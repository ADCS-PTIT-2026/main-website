from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import requests
from app.db.session import get_db
from app.models.user import User
from app.models.telegram_bot import Bot

router = APIRouter(prefix="/api/webhook", tags=["Webhook"])

def send_telegram_message(bot_token: str, chat_id: str, text: str):
    """Hàm phụ trợ để gửi tin nhắn chào mừng lại cho user"""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": text})

@router.post("/telegram")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint này nhận dữ liệu từ Telegram đẩy về.
    """
    # Đọc dữ liệu JSON Telegram gửi sang
    update = await request.json()

    # Kiểm tra xem có tin nhắn không
    if "message" in update and "text" in update["message"]:
        message_text = update["message"]["text"]
        chat_id = update["message"]["chat"]["id"]
        
        # Nếu người dùng bấm Start từ link Deep Linking, text sẽ có dạng: "/start uuid-cua-nguoi-dung"
        if message_text.startswith("/start "):
            # Cắt chuỗi để lấy user_id (payload)
            user_id = message_text.split(" ")[1]
            
            # Tìm người dùng trong CSDL
            user = db.query(User).filter(User.user_id == user_id).first()
            
            if user:
                # Lưu chat_id vào CSDL
                user.telegram_chat_id = str(chat_id)
                db.commit()

                # Lấy token bot từ DB để gửi tin nhắn chào mừng
                bot = db.query(Bot).filter(Bot.name == 'ptit_adcs_bot').first()
                if bot:
                    welcome_msg = f"Xin chào {user.display_name or user.username}! Tài khoản Telegram của bạn đã được kết nối thành công với hệ thống PTIT ADCS. Bạn sẽ nhận được thông báo văn bản tại đây."
                    send_telegram_message(bot.token, str(chat_id), welcome_msg)
            else:
                print(f"[Webhook] Không tìm thấy user với id: {user_id}")

    # Bắt buộc phải trả về HTTP 200 OK để Telegram biết bạn đã nhận được tin
    return {"status": "ok"}