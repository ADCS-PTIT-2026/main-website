from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import requests
from app.db.session import get_db
from app.models.user import User
from app.models.telegram_bot import Bot
from app.models.role_permission import Role
from app.schemas.telegram import RoleNotificationRequest
import html

router = APIRouter()

def send_telegram_notification(bot_token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload)

        if response.status_code != 200:
            print(f"[Telegram Error] Lỗi từ API Telegram: {response.text}")
        else:
            print(f"[Telegram] Gửi tin nhắn thành công tới chat_id: {chat_id}")
            
    except Exception as e:
        print(f"[Telegram Request Error] Lỗi khi kết nối đến Telegram: {e}")

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
        print(request.text)
        safe_text = html.escape(request.text)

        success_count = 0
        for user in users_to_notify:
            print(f"[Role Notify] Đang gửi tới: {user.username} ({user.telegram_chat_id})")
            
            full_text = f"🔔 <b>THÔNG BÁO MỚI</b>\n\n{safe_text}"
            
            send_telegram_notification(request.bot_token, user.telegram_chat_id, full_text)
            success_count += 1

        return {
            "status": "success",
            "sent_count": success_count,
            "target_roles": request.roles
        }

    except Exception as e:
        print(f"[Notify Role Error] Lỗi hệ thống: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    print("11111")
    data = await request.json()
    
    print(f"\n[Webhook Received] Payload: {data}")
    
    if "message" in data and "text" in data["message"]:
        msg = data["message"]
        text = msg["text"]
        chat_id = msg["chat"]["id"]

        print(f"[Webhook] Nhận tin nhắn: '{text}' từ chat_id: {chat_id}")

        if text.startswith("/start "):
            user_id = text.split(" ")[1]
            print(f"[Webhook] Bóc tách được user_id: {user_id}")
            
            user = db.query(User).filter(User.user_id == str(user_id)).first()
            if not user:
                print(f"[Webhook Error] CSDL KHÔNG tìm thấy người dùng với user_id: {user_id}")
                return {"status": "user_not_found"}

            print(f"[Webhook] Đã tìm thấy User: {user.email}")
            user.telegram_chat_id = str(chat_id)
            db.commit()

            bot = db.query(Bot).filter(Bot.name == "ptit_adcs_bot").first()
            
            if not bot:
                print(f"[Webhook Error] CSDL KHÔNG tìm thấy bot có tên 'ptit_adcs_bot'. Vui lòng kiểm tra lại bảng bots.")
                return {"status": "bot_not_found"}

            welcome_text = (
                f"🎉 <b>KẾT NỐI THÀNH CÔNG!</b>\n\n"
                f"Chào <b>{user.username}</b>,\n"
                f"Tài khoản của bạn đã được liên kết với hệ thống <b>PTIT ADCS</b>.\n\n"
                f"Từ giờ, bạn sẽ nhận được thông báo kết quả xử lý văn bản từ AI ngay tại đây. 🤖🚀"
            )
            
            print(f"[Webhook] Đang tiến hành gửi tin nhắn chào mừng...")
            send_telegram_notification(bot.token, str(chat_id), welcome_text)

    return {"status": "ok"}