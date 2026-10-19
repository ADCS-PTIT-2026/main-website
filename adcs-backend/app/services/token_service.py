import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_token, utcnow
from app.models.role_permission import Role
from app.models.security import RefreshToken
from app.models.user import User


def issue_token_pair(db: Session, user: User, family_id=None, commit=True):
    db.query(RefreshToken).filter(RefreshToken.expires_at <= utcnow()).delete(synchronize_session=False)
    family_id = family_id or uuid.uuid4()
    claims = {"sub": str(user.user_id), "auth_version": user.auth_version, "sid": str(family_id)}
    refresh_token = create_refresh_token(claims)
    payload = decode_token(refresh_token, "refresh")
    db.add(RefreshToken(
        token_hash=hash_token(refresh_token), family_id=family_id,
        user_id=user.user_id, auth_version=user.auth_version,
        expires_at=datetime.fromtimestamp(payload["exp"], timezone.utc),
    ))
    if commit:
        db.commit()
    return {"access_token": create_access_token(claims), "refresh_token": refresh_token}


def refresh_access_token(db: Session, raw_token: str):
    denied = HTTPException(status_code=401, detail="Refresh token không hợp lệ hoặc đã hết hạn",
                           headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(raw_token, "refresh")
    except JWTError:
        raise denied
    # Serialize refresh/password changes per user and refresh rotation across workers.
    user = db.query(User).filter(User.user_id == payload["sub"]).with_for_update().first()
    if not user or not user.is_active or not user.role_id:
        raise denied
    if not db.query(Role).filter(Role.role_id == str(user.role_id)).first():
        raise denied
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(raw_token)).with_for_update().first()
    if not stored or str(stored.user_id) != str(user.user_id) or str(stored.family_id) != payload["sid"]:
        raise denied
    now = utcnow()
    if stored.revoked_at is not None or stored.auth_version != user.auth_version:
        # Reuse of a rotated token revokes its successors as well.
        db.query(RefreshToken).filter(RefreshToken.family_id == stored.family_id,
                                     RefreshToken.revoked_at.is_(None)).update({"revoked_at": now})
        db.commit()
        raise denied
    if stored.expires_at <= now or payload["auth_version"] != user.auth_version:
        raise denied
    stored.revoked_at = now
    result = issue_token_pair(db, user, family_id=stored.family_id, commit=False)
    db.commit()
    return result


def revoke_refresh_token(db: Session, raw_token: str):
    try:
        payload = decode_token(raw_token, "refresh")
    except JWTError:
        return
    db.query(User).filter(User.user_id == payload["sub"]).with_for_update().first()
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(raw_token)).first()
    if stored:
        db.query(RefreshToken).filter(RefreshToken.family_id == stored.family_id,
                                     RefreshToken.revoked_at.is_(None)).update({"revoked_at": utcnow()})
        db.commit()
