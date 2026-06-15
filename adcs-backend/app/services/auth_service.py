from sqlalchemy.orm import Session
from app.crud.user import get_user_by_email, create_user, get_user_by_id
from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token
from fastapi import HTTPException, status
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from app.core.security import hash_password
from app.core.logger import logger
import requests
import secrets

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

PTIT_CLIENT_ID = os.getenv("PTIT_CLIENT_ID")
PTIT_TOKEN_ENDPOINT = os.getenv("PTIT_TOKEN_ENDPOINT")
PTIT_REDIRECT_URI = os.getenv("PTIT_REDIRECT_URI")

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
        password_hash=hashed_pwd,
        is_active=True
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

def ptit_sso_login(db: Session, code: str):
    logger.info("[PTIT_SSO] Request received with code")

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": PTIT_REDIRECT_URI,
        "client_id": PTIT_CLIENT_ID
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    token_response = requests.post(PTIT_TOKEN_ENDPOINT, data=payload, headers=headers)

    if token_response.status_code != 200:
        logger.warning(f"[PTIT_SSO] Failed to exchange token: {token_response.text}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không thể xác thực với hệ thống PTIT!"
        )

    token_data = token_response.json()
    id_token = token_data.get("id_token")

    if not id_token:
        raise HTTPException(status_code=400, detail="Không nhận được id_token từ PTIT.")

    try:
        user_info = jwt.get_unverified_claims(id_token)
    except Exception as e:
        logger.error(f"[PTIT_SSO] Error decoding id_token: {e}")
        raise HTTPException(status_code=400, detail="Token trả về không hợp lệ.")

    email = user_info.get("email")
    name = user_info.get("name") or user_info.get("preferred_username") or email.split('@')[0]

    if not email:
        logger.warning("[PTIT_SSO] Missing email from PTIT token")
        raise HTTPException(status_code=400, detail="Không thể lấy được email từ hệ thống PTIT.")

    user = get_user_by_email(db, email)

    if not user:
        logger.info(f"[PTIT_SSO] Creating new user email={email}")
        user = create_user(db, User(
            username=name,
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(16))
        ))

    logger.info(f"[PTIT_SSO] Success user_id={user.user_id}")

    return {
        "access_token": create_access_token({"sub": str(user.user_id)}),
        "refresh_token": create_refresh_token({"sub": str(user.user_id)}),
        "user": {"id": str(user.user_id), "email": user.email, "name": user.username}
    }