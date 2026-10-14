from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
import requests
from app.db.session import get_db
from app.models.user import User
from app.models.telegram_bot import Bot
from app.models.role_permission import Role
from app.schemas.telegram import RoleNotificationRequest
import html
from app.core.logger import logger

router = APIRouter()

def send_telegram_notification(bot_token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload, timeout=10)

        if response.status_code != 200:
            logger.error(f"[Telegram Error] Lỗi từ API Telegram: {response.text}")
        else:
            logger.info(f"[Telegram] Gửi tin nhắn thành công tới chat_id: {chat_id}")
            
    except Exception as e:
        logger.error(f"[Telegram Request Error] Lỗi khi kết nối đến Telegram: {e}")

@router.post("/notify_by_roles")
async def notify_by_roles(request: RoleNotificationRequest, db: Session = Depends(get_db)):
    """
    API dành cho Data Service gọi để gửi thông báo đến các nhóm quyền cụ thể
    """
    try:
        if "all" in request.roles:
            users_to_notify = (
            db.query(User)
            .filter(
                User.telegram_chat_id != None,
                User.telegram_chat_id != ""
            )
            .all()
            )
        else:
            users_to_notify = (
            db.query(User)
            .join(Role)
            .filter(
                Role.name.in_(request.roles),
                User.telegram_chat_id != None,
                User.telegram_chat_id != ""
            )
            .all()
            )
        

        if not users_to_notify:
            return {
                "status": "success", 
                "message": "Không tìm thấy người dùng nào thuộc các Role này đã liên kết Telegram."
            }
        safe_text = html.escape(request.text)

        success_count = 0
        for user in users_to_notify:
            logger.info(f"[Role Notify] Đang gửi tới: {user.username} ({user.telegram_chat_id})")
            
            full_text = f"🔔 <b>THÔNG BÁO MỚI</b>\n\n{safe_text}"
            
            send_telegram_notification(request.bot_token, user.telegram_chat_id, full_text)
            success_count += 1

        return {
            "status": "success",
            "sent_count": success_count,
            "target_roles": request.roles
        }

    except Exception as e:
        logger.error(f"[Notify Role Error] Lỗi hệ thống: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    logger.info(f"[Telegram Webhook] Nhận update: {data}")
    
    if "message" in data and "text" in data["message"]:
        msg = data["message"]
        text = msg["text"].strip()
        chat_id = msg["chat"]["id"]

        logger.info(f"[Telegram Webhook] Nhận tin nhắn: '{text}' từ chat_id: {chat_id}")

        if text.startswith("/start"):
            bot = db.query(Bot).filter(Bot.name == "ptit_adcs_bot").first()
            if not bot:
                logger.error("[Telegram Webhook Error] CSDL KHÔNG tìm thấy bot 'ptit_adcs_bot'")
                return {"status": "bot_not_found"}

            parts = text.split(maxsplit=1)
            if len(parts) > 1:
                user_id = parts[1].strip()
                logger.info(f"[Telegram Webhook] Bóc tách user_id: {user_id}")
                
                user = db.query(User).filter(User.user_id == str(user_id)).first()
                if not user:
                    logger.warning(f"[Telegram Webhook Error] Không tìm thấy user với user_id: {user_id}")
                    send_telegram_notification(
                        bot.token,
                        str(chat_id),
                        "⚠️ <b>Lỗi liên kết:</b> Không tìm thấy thông tin tài khoản trên hệ thống PTIT ADCS. Vui lòng thử lại từ Bảng điều khiển website."
                    )
                    return {"status": "user_not_found"}

                logger.info(f"[Telegram Webhook] Đã tìm thấy User: {user.email}")
                user.telegram_chat_id = str(chat_id)
                db.commit()

                welcome_text = (
                    f"🎉 <b>KẾT NỐI THÀNH CÔNG!</b>\n\n"
                    f"Chào <b>{user.username}</b>,\n"
                    f"Tài khoản <b>{user.email}</b> đã được liên kết thành công với hệ thống <b>PTIT ADCS</b>.\n\n"
                    f"Từ giờ, bạn sẽ nhận được thông báo kết quả xử lý văn bản từ AI ngay tại đây. 🤖🚀"
                )
                
                logger.info(f"[Telegram Webhook] Đang gửi tin nhắn chào mừng tới chat_id {chat_id}...")
                send_telegram_notification(bot.token, str(chat_id), welcome_text)
            else:
                help_text = (
                    "👋 <b>Chào mừng bạn đến với PTIT ADCS Bot!</b>\n\n"
                    "Để nhận thông báo xử lý văn bản từ hệ thống AI, bạn cần liên kết tài khoản:\n\n"
                    "1️⃣ Đăng nhập website: <a href='https://adcs.ptitai.org'>https://adcs.ptitai.org</a>\n"
                    "2️⃣ Tại Bảng điều khiển, nhấn nút <b>'Kết nối Telegram'</b>\n"
                    "3️⃣ Nhấn nút <b>Bắt đầu (Start)</b> trên Telegram để hoàn tất."
                )
                send_telegram_notification(bot.token, str(chat_id), help_text)

    return {"status": "ok"}

@router.post("/setup-webhook")
def setup_webhook_endpoint(db: Session = Depends(get_db)):
    """Cấu hình lại Webhook với Telegram API"""
    bot = db.query(Bot).filter(Bot.name == "ptit_adcs_bot").first()
    if not bot:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình Bot")
    webhook_url = "https://adcs.ptitai.org/api/telegram/webhook"
    res = requests.get(f"https://api.telegram.org/bot{bot.token}/setWebhook?url={webhook_url}", timeout=10).json()
    return res

@router.get("/bot-token")
async def get_bot_token(name: str = "ptit_adcs_bot", db: Session = Depends(get_db)):
    """
    API lấy thông tin và Token của Bot.
    Có thể truyền query param ?name=... (Mặc định là ptit_adcs_bot)
    """
    try:
        bot = db.query(Bot).filter(Bot.name == name).first()
        
        if not bot:
            return {
                "status": "error", 
                "message": f"Không tìm thấy cấu hình cho bot có tên '{name}' trong cơ sở dữ liệu."
            }

        return {
            "status": "success",
            "data": {
                "bot_id": bot.bot_id,
                "name": bot.name,
                "token": bot.token,
                "channel_type": bot.channel_type
            }
        }
        
    except Exception as e:
        print(f"[Get Bot Token Error] Lỗi hệ thống: {e}")
        return {"status": "error", "message": str(e)}