import os
import re
import requests
import REDACTED_LEAKED_SECRETs
from dotenv import load_dotenv
from fastapi import HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.crud.user import get_user_by_email, create_user, get_user_by_id
from app.models.user import User
from app.models.role_permission import Role
from app.core.security import verify_password, create_access_token, create_refresh_token, hash_password
from app.core.dependency import get_user_permissions
from app.core.logger import logger

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

PTIT_CLIENT_ID = os.getenv("PTIT_CLIENT_ID")
PTIT_TOKEN_ENDPOINT = os.getenv("PTIT_TOKEN_ENDPOINT")
PTIT_REDIRECT_URI = os.getenv("PTIT_REDIRECT_URI")
PTIT_CERTS_ENDPOINT = os.getenv(
    "PTIT_CERTS_ENDPOINT",
    "https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/certs"
)

# Cache JWKS để không phải request liên tục mỗi lần SSO
_CACHED_JWKS = None

def get_ptit_jwks():
    global _CACHED_JWKS
    if _CACHED_JWKS:
        return _CACHED_JWKS
    try:
        res = requests.get(PTIT_CERTS_ENDPOINT, timeout=5)
        if res.status_code == 200:
            _CACHED_JWKS = res.json()
            return _CACHED_JWKS
    except Exception as e:
        logger.warning(f"[PTIT_SSO] Không thể tải JWKS từ {PTIT_CERTS_ENDPOINT}: {e}")
    return None

def login(db: Session, email: str, password: str):
    email = email.strip().lower()
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    if not user.is_active:
        raise HTTPException(
            status_code=403, 
            detail="Tài khoản của bạn đang chờ Quản trị viên duyệt hoặc đã bị vô hiệu hóa!"
        )

    if not user.role_id:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản chưa được phân quyền sử dụng hệ thống. Vui lòng liên hệ Quản trị viên."
        )

    role_name = None
    permissions = []
    if user.role_id:
        role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
        if role:
            role_name = role.name
            permissions = get_user_permissions(db, user.role_id)

    # Tạo cả 2 token
    access_token = create_access_token({"sub": str(user.user_id)})
    refresh_token = create_refresh_token({"sub": str(user.user_id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "name": user.username,
            "role": role_name,
            "permissions": permissions,
            "is_telegram_connected": bool(user.telegram_chat_id),
            "telegram_chat_id": user.telegram_chat_id
        }
    }


def register(db: Session, name: str, email: str, password: str):
    email = email.strip().lower()

    # 1. Kiểm tra định dạng email
    if not re.match(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$", email):
        raise HTTPException(status_code=400, detail="Định dạng email không hợp lệ!")

    # 2. Kiểm tra độ phức tạp của mật khẩu
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có độ dài tối thiểu 8 ký tự!")
    if not (any(c.isupper() for c in password) and any(c.islower() for c in password) and any(c.isdigit() for c in password)):
        raise HTTPException(status_code=400, detail="Mật khẩu phải bao gồm cả chữ hoa, chữ thường và chữ số!")

    # 3. Kiểm tra trùng email
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký trên hệ thống!")

    # 4. Tạo tài khoản với trạng thái chờ duyệt (is_active = False)
    hashed_pwd = hash_password(password)
    new_user = User(
        username=name.strip(),
        email=email,
        password_hash=hashed_pwd,
        is_active=False # Chờ admin phê duyệt
    )

    user = create_user(db, new_user)

    return {
        "message": "Đăng ký tài khoản thành công! Tài khoản của bạn đang chờ Quản trị viên duyệt và phân quyền.",
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
    logger.info("[PTIT_SSO] Nhận yêu cầu đăng nhập SSO với authorization code")

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
        logger.warning(f"[PTIT_SSO] Đổi token thất bại: {token_response.text}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không thể xác thực với máy chủ PTIT SSO!"
        )

    token_data = token_response.json()
    id_token = token_data.get("id_token")
    ptit_access_token = token_data.get("access_token")

    if not id_token:
        raise HTTPException(status_code=400, detail="Không nhận được id_token từ hệ thống PTIT.")

    # Kiểm tra chữ ký số qua JWKS của Keycloak
    jwks = get_ptit_jwks()
    user_info = None
    if jwks:
        try:
            user_info = jwt.decode(
                id_token,
                jwks,
                algorithms=["RS256"],
                access_token=ptit_access_token,
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_at_hash": False,
                    "verify_exp": True,
                }
            )
            logger.info("[PTIT_SSO] Xác thực chữ ký số JWKS RS256 thành công")
        except JWTError as jwt_err:
            logger.error(f"[PTIT_SSO] Xác thực chữ ký token thất bại: {jwt_err}")
            raise HTTPException(status_code=401, detail=f"Chữ ký số SSO không hợp lệ: {str(jwt_err)}")
    else:
        # Fallback cảnh báo nếu không kết nối được JWKS
        logger.warning("[PTIT_SSO] Không lấy được JWKS, fallback giải mã không kiểm tra chữ ký")
        try:
            user_info = jwt.get_unverified_claims(id_token)
        except Exception as e:
            logger.error(f"[PTIT_SSO] Lỗi decode id_token: {e}")
            raise HTTPException(status_code=400, detail="Token SSO trả về không hợp lệ.")

    email = user_info.get("email")
    name = user_info.get("name") or user_info.get("preferred_username") or (email.split('@')[0] if email else "Người dùng PTIT")

    if not email:
        logger.warning("[PTIT_SSO] Thiếu thông tin email trong token PTIT")
        raise HTTPException(status_code=400, detail="Không thể lấy được email từ hệ thống PTIT SSO.")

    email = email.strip().lower()
    user = get_user_by_email(db, email)

    default_user_role = db.query(Role).filter(Role.name == "user").first()

    if not user:
        logger.info(f"[PTIT_SSO] Khởi tạo tài khoản mới từ SSO: email={email}")
        user = create_user(db, User(
            username=name,
            email=email,
            password_hash=hash_password(REDACTED_LEAKED_SECRETs.token_urlsafe(16)),
            is_active=True, # Tài khoản SSO PTIT hợp lệ được tự động kích hoạt
            role_id=default_user_role.role_id if default_user_role else None
        ))

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đang chờ Quản trị viên duyệt hoặc đã bị khóa!"
        )

    if not user.role_id and default_user_role:
        user.role_id = default_user_role.role_id
        db.commit()
        db.refresh(user)

    logger.info(f"[PTIT_SSO] Đăng nhập thành công user_id={user.user_id}")

    role_name = None
    permissions = []
    if user.role_id:
        role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
        if role:
            role_name = role.name
            permissions = get_user_permissions(db, user.role_id)

    return {
        "access_token": create_access_token({"sub": str(user.user_id)}),
        "refresh_token": create_refresh_token({"sub": str(user.user_id)}),
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "name": user.username,
            "role": role_name,
            "permissions": permissions,
            "is_telegram_connected": bool(user.telegram_chat_id),
            "telegram_chat_id": user.telegram_chat_id
        }
    }