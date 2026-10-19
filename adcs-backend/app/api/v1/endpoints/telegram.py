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
import secrets
from app.services.telegram_link_service import consume_telegram_link
from app.core.logger import logger

load_dotenv()
router = APIRouter()
require_admin = RoleChecker(['admin'])

def get_system_bot_token(db: Session = None) -> str:
    """Chỉ lấy token bot từ cấu hình môi trường riêng."""
    return os.getenv("TELEGRAM_BOT_TOKEN", "")

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
    expected_key = os.getenv("SERVICE_INTERNAL_KEY")
    if not expected_key:
        raise HTTPException(status_code=503, detail="Chưa cấu hình khóa dịch vụ nội bộ")
    if not x_service_key or not secrets.compare_digest(x_service_key.encode(), expected_key.encode()):
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
    expected = os.getenv("TELEGRAM_WEBHOOK_SECRET")
    supplied = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Webhook Telegram chưa được cấu hình")
    if not supplied or not secrets.compare_digest(supplied.encode(), expected.encode()):
        raise HTTPException(status_code=403, detail="Webhook Telegram không hợp lệ")
    data = await request.json()
    message = data.get("message", {}) if isinstance(data, dict) else {}
    chat = message.get("chat", {})
    text = message.get("text")
    if chat.get("type") != "private" or not isinstance(text, str) or "id" not in chat:
        return {"status": "ignored"}
    parts = text.strip().split(maxsplit=1)
    if not parts or parts[0] != "/start":
        return {"status": "ok"}
    if len(parts) != 2:
        return {"status": "link_required"}
    user = consume_telegram_link(db, parts[1], str(chat["id"]))
    if user is None:
        return {"status": "invalid_or_expired_link"}
    logger.info("Đã liên kết Telegram cho user_id=%s", user.user_id)
    token = get_system_bot_token()
    if token:
        name = html.escape(user.username or user.email or "Người dùng")
        send_telegram_notification(token, str(chat["id"]), f"Kết nối thành công tài khoản <b>{name}</b> với PTIT ADCS.")
    return {"status": "ok"}


@router.post("/setup-webhook", dependencies=[Depends(require_admin)])
def setup_webhook_endpoint(db: Session = Depends(get_db)):
    token = get_system_bot_token()
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET")
    if not token or not secret:
        raise HTTPException(status_code=503, detail="Cần cấu hình bot token và webhook secret")
    url = os.getenv("TELEGRAM_WEBHOOK_URL", "https://adcs.ptitai.org/api/telegram/webhook")
    try:
        response = requests.post(f"https://api.telegram.org/bot{token}/setWebhook",
                                 json={"url": url, "secret_token": secret}, timeout=10)
        response.raise_for_status()
        if not response.json().get("ok"):
            raise HTTPException(status_code=502, detail="Telegram từ chối cấu hình webhook")
    except (requests.RequestException, ValueError):
        raise HTTPException(status_code=502, detail="Không thể cấu hình webhook Telegram")
    return {"status": "success"}

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
            "is_token_configured": has_env_token
        }
    }
