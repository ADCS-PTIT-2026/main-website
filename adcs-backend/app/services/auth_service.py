from sqlalchemy.orm import Session
from app.crud.user import get_user_by_email, create_user, get_user_by_id, update_user
from app.core.security import verify_password, create_access_token
from fastapi import HTTPException

def login(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    token = create_access_token({"sub": str(user.user_id)})

    return {
        "access_token": token,
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "name": user.username
        }
    }

def register(db: Session, name: str, email: str, password: str):
    user = create_user(db, name, email, password)

    return {
        "message": "Đăng ký thành công",
        "is_active": user.is_active
    }