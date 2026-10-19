from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, TokenResponse, RefreshTokenRequest, SSOCallbackRequest
from app.services.auth_service import login, register, refresh_access_token, ptit_sso_login
from app.services.token_service import revoke_refresh_token
from app.services.sso_service import begin_sso_login, SSO_COOKIE_NAME, SSO_COOKIE_PATH, SSO_COOKIE_SECURE, SSO_LIFETIME_SECONDS

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

@router.post("/logout")
def logout_api(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, request.refresh_token)
    return {"message": "Đã đăng xuất"}

@router.get("/sso/start")
def sso_start_api(response: Response, db: Session = Depends(get_db)):
    result = begin_sso_login(db)
    response.set_cookie(SSO_COOKIE_NAME, result["state"], max_age=SSO_LIFETIME_SECONDS,
                        httponly=True, secure=SSO_COOKIE_SECURE, samesite="lax", path=SSO_COOKIE_PATH)
    return result

@router.post("/sso/callback", response_model=LoginResponse)
def sso_callback_api(payload: SSOCallbackRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    result = ptit_sso_login(db, payload.code, payload.state, request.cookies.get(SSO_COOKIE_NAME))
    response.delete_cookie(SSO_COOKIE_NAME, path=SSO_COOKIE_PATH, secure=SSO_COOKIE_SECURE, samesite="lax")
    return result
