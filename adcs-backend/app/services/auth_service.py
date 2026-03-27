from sqlalchemy.orm import Session
from app.crud.user import get_user_by_email, create_user, get_user_by_id
from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token
from fastapi import HTTPException, status
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from app.core.security import hash_password

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def login(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Email chưa được đăng ký!")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản chưa được kích hoạt hoặc bị khóa!")

    # Tạo cả 2 token
    access_token = create_access_token({"sub": str(user.user_id)})
    refresh_token = create_refresh_token({"sub": str(user.user_id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "name": user.username
        }
    }


def register(db: Session, name: str, email: str, password: str):
    hashed_pwd = hash_password(password)
    new_user = User(
        username=name,
        email=email,
        password_hash=hashed_pwd
    )

    user = create_user(db, new_user)

    return {
        "message": "Đăng ký thành công",
        "is_active": user.is_active
    }

def refresh_access_token(db: Session, refresh_token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản không tồn tại hoặc bị khóa")

    new_access_token = create_access_token({"sub": str(user.user_id)})
    new_refresh_token = create_refresh_token({"sub": str(user.user_id)})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }