import re
import secrets
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_token, utcnow
from app.models.security import TelegramLinkToken
from app.models.user import User


def issue_telegram_link(db: Session, current_user: User, bot_name: str):
    # Serialize creation/consumption/disconnection using the same user row lock.
    db.query(User).filter(User.user_id == str(current_user.user_id)).with_for_update().first()
    now = utcnow()
    db.query(TelegramLinkToken).filter(TelegramLinkToken.expires_at <= now).delete(synchronize_session=False)
    db.query(TelegramLinkToken).filter(TelegramLinkToken.user_id == current_user.user_id,
                                      TelegramLinkToken.used_at.is_(None)).update({"used_at": now})
    token = secrets.token_urlsafe(32)  # 43 URL-safe characters; within Telegram's start limit.
    db.add(TelegramLinkToken(token_hash=hash_token(token), user_id=current_user.user_id,
                             expires_at=now + timedelta(minutes=10)))
    db.commit()
    return {"bot_name": bot_name, "link": f"https://t.me/{bot_name}?start={token}",
            "is_connected": bool(current_user.telegram_chat_id),
            "telegram_chat_id": current_user.telegram_chat_id}


def consume_telegram_link(db: Session, raw_token: str, chat_id: str):
    if not re.fullmatch(r"[A-Za-z0-9_-]{43}", raw_token):
        return None
    token_hash = hash_token(raw_token)
    candidate = db.query(TelegramLinkToken).filter(TelegramLinkToken.token_hash == token_hash).first()
    if not candidate:
        return None
    user = db.query(User).filter(User.user_id == str(candidate.user_id)).with_for_update().populate_existing().first()
    token = db.query(TelegramLinkToken).filter(TelegramLinkToken.token_hash == token_hash).with_for_update().populate_existing().first()
    if not user or not user.is_active or not token or token.used_at is not None or token.expires_at <= utcnow():
        return None
    token.used_at = utcnow()
    user.telegram_chat_id = str(chat_id)
    db.commit()
    return user


def disconnect_telegram(db: Session, current_user: User):
    user = db.query(User).filter(User.user_id == str(current_user.user_id)).with_for_update().populate_existing().first()
    user.telegram_chat_id = None
    db.query(TelegramLinkToken).filter(TelegramLinkToken.user_id == current_user.user_id,
                                      TelegramLinkToken.used_at.is_(None)).update({"used_at": utcnow()})
    db.commit()
