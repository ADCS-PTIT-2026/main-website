from sqlalchemy.orm import Session
from app.crud.user import get_user_by_email, create_user, get_user_by_id
from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token
from fastapi import HTTPException, status
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from app.core.security import hash_password
import httpx

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

AZURE_CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
AZURE_CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET")
AZURE_TENANT_ID = os.getenv("AZURE_TENANT_ID")
AZURE_REDIRECT_URI = os.getenv("AZURE_REDIRECT_URI")

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

async def login_with_ptit_sso(db: Session, code: str):
    """
    Xử lý trao đổi mã code lấy Access Token của Microsoft, lấy thông tin User 
    và đăng nhập/đăng ký vào hệ thống nội bộ.
    """
    token_url = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token"
    
    # Đổi code lấy Access Token từ Microsoft
    data = {
        "client_id": AZURE_CLIENT_ID,
        "scope": "openid email profile User.Read",
        "code": code,
        "redirect_uri": AZURE_REDIRECT_URI,
        "grant_type": "authorization_code",
        "client_secret": AZURE_CLIENT_SECRET,
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Không thể xác thực với Microsoft")
        
        ms_tokens = token_response.json()
        ms_access_token = ms_tokens.get("access_token")

        # Dùng Microsoft Access Token lấy thông tin User (gọi Graph API)
        user_info_response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {ms_access_token}"}
        )
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Không thể lấy thông tin tài khoản từ Microsoft")
        
        ms_user = user_info_response.json()
        
    email = ms_user.get("mail") or ms_user.get("userPrincipalName")
    name = ms_user.get("displayName", "PTIT User")

    if not email or not email.endswith("@ptit.edu.vn"):
        raise HTTPException(status_code=403, detail="Hệ thống chỉ chấp nhận email trường @ptit.edu.vn")

    user = get_user_by_email(db, email)
    if not user:
        new_user = User(
            username=name,
            email=email,
            password_hash=hash_password("SSO_AUTHENTICATED_ACCOUNT_" + os.urandom(8).hex()),
            is_active=True
        )
        user = create_user(db, new_user)
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa!")

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