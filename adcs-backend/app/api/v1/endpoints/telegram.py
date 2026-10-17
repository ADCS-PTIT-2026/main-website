from fastapi import APIRouter, Depends, Request, HTTPException, Header, status
from sqlalchemy.orm import Session
import requests
import os
from dotenv import load_dotenv
from app.db.session import get_db
from app.models.user import User
from app.models.telegram_bot import Bot
from app.models.role_permission import Role
from app.schemas.telegram import RoleNotificationRequest
from app.core.dependency import RoleChecker, get_current_user
import html
from app.core.logger import logger

load_dotenv()
router = APIRouter()
require_admin = RoleChecker(['admin'])

def get_system_bot_token(db: Session = None) -> str:
    """Lấy token bot từ biến môi trường, fallback sang database nếu chưa có trong env"""
    env_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if env_token:
        return env_token
    if db:
        bot = db.query(Bot).filter(Bot.name == "ptit_adcs_bot").first()
        if bot and bot.token:
            return bot.token
    return ""

def send_telegram_notification(bot_token: str, chat_id: str, text: str):
    token = bot_token or get_system_bot_token()
    if not token:
        logger.warning("[Telegram] Không tìm thấy Bot Token để gửi tin nhắn")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
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
async def notify_by_roles(
    request: RoleNotificationRequest, 
    db: Session = Depends(get_db),
    x_service_key: str = Header(None, alias="X-Service-Key")
):
    """
    API gửi thông báo theo nhóm quyền (Yêu cầu Service Key hoặc quyền nội bộ)
    """
    expected_key = os.getenv("SERVICE_INTERNAL_KEY", os.getenv("SECRET_KEY", "adcs-service-secret"))
    if not x_service_key or x_service_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yêu cầu khóa xác thực dịch vụ (X-Service-Key) hợp lệ."
        )

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
                .join(Role, User.role_id == Role.role_id)
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

        bot_token = get_system_bot_token(db)
        success_count = 0
        for user in users_to_notify:
            logger.info(f"[Role Notify] Đang gửi tới: {user.username} ({user.telegram_chat_id})")
            full_text = f"🔔 <b>THÔNG BÁO MỚI</b>\n\n{safe_text}"
            send_telegram_notification(bot_token, user.telegram_chat_id, full_text)
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
        bot_token = get_system_bot_token(db)

        logger.info(f"[Telegram Webhook] Nhận tin nhắn: '{text}' từ chat_id: {chat_id}")

        if text.startswith("/start"):
            parts = text.split(maxsplit=1)
            if len(parts) > 1:
                user_id = parts[1].strip()
                logger.info(f"[Telegram Webhook] Bóc tách user_id: {user_id}")
                
                user = db.query(User).filter(User.user_id == str(user_id)).first()
                if not user:
                    logger.warning(f"[Telegram Webhook Error] Không tìm thấy user với user_id: {user_id}")
                    send_telegram_notification(
                        bot_token,
                        str(chat_id),
                        "⚠️ <b>Lỗi liên kết:</b> Không tìm thấy thông tin tài khoản trên hệ thống PTIT ADCS. Vui lòng thử lại từ Bảng điều khiển website."
                    )
                    return {"status": "user_not_found"}

                logger.info(f"[Telegram Webhook] Đã tìm thấy User: {user.email}")
                user.telegram_chat_id = str(chat_id)
                db.commit()

                welcome_text = (
                    f"🎉 <b>KẾT NỐI THÀNH CÔNG!</b>\n\n"
                    f"Chào <b>{user.username or user.email}</b>,\n"
                    f"Tài khoản <b>{user.email}</b> đã được liên kết thành công với hệ thống <b>PTIT ADCS</b>.\n\n"
                    f"Từ giờ, bạn sẽ nhận được thông báo kết quả xử lý văn bản từ AI ngay tại đây. 🤖🚀"
                )
                
                logger.info(f"[Telegram Webhook] Đang gửi tin nhắn chào mừng tới chat_id {chat_id}...")
                send_telegram_notification(bot_token, str(chat_id), welcome_text)
            else:
                help_text = (
                    "👋 <b>Chào mừng bạn đến với PTIT ADCS Bot!</b>\n\n"
                    "Để nhận thông báo xử lý văn bản từ hệ thống AI, bạn cần liên kết tài khoản:\n\n"
                    "1️⃣ Đăng nhập website: <a href='https://adcs.ptitai.org'>https://adcs.ptitai.org</a>\n"
                    "2️⃣ Tại Bảng điều khiển, nhấn nút <b>'Kết nối Telegram'</b>\n"
                    "3️⃣ Nhấn nút <b>Bắt đầu (Start)</b> trên Telegram để hoàn tất."
                )
                send_telegram_notification(bot_token, str(chat_id), help_text)

    return {"status": "ok"}

@router.post("/setup-webhook", dependencies=[Depends(require_admin)])
def setup_webhook_endpoint(db: Session = Depends(get_db)):
    """Cấu hình lại Webhook với Telegram API (Yêu cầu quyền Admin)"""
    bot_token = get_system_bot_token(db)
    if not bot_token:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình Bot Token trong biến môi trường hoặc CSDL")
    webhook_url = "https://adcs.ptitai.org/api/telegram/webhook"
    res = requests.get(f"https://api.telegram.org/bot{bot_token}/setWebhook?url={webhook_url}", timeout=10).json()
    return res

@router.get("/bot-info", dependencies=[Depends(require_admin)])
async def get_bot_info(db: Session = Depends(get_db)):
    """
    API lấy thông tin công khai của Bot (Không bao gồm token, chỉ Admin mới truy cập được)
    """
    bot = db.query(Bot).filter(Bot.name == "ptit_adcs_bot").first()
    has_env_token = bool(os.getenv("TELEGRAM_BOT_TOKEN"))
    return {
        "status": "success",
        "data": {
            "name": bot.name if bot else "ptit_adcs_bot",
            "channel_type": bot.channel_type if bot else "telegram",
            "is_token_configured": has_env_token or (bool(bot.token) if bot else False)
        }
    }