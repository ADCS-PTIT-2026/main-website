from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, TokenResponse, RefreshTokenRequest
from app.services.auth_service import login, register, refresh_access_token

router = APIRouter()

# 1. Đăng nhập
@router.post("/login", response_model=LoginResponse)
def login_api(request: LoginRequest, db: Session = Depends(get_db)):
    return login(db, request.email, request.password)

# 2. Đăng ký
@router.post("/register", response_model=RegisterResponse)
def register_api(request: RegisterRequest, db: Session = Depends(get_db)):
    return register(db, request.name, request.email, request.password)

# 3. Refresh Token (THÊM MỚI)
@router.post("/refresh", response_model=TokenResponse)
def refresh_token_api(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    API này nhận vào refresh_token cũ và trả về bộ access_token + refresh_token mới.
    """
    return refresh_access_token(db, request.refresh_token)