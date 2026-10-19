"""OIDC authorization-code flow with server-bound state, nonce and PKCE."""
import base64
import hashlib
import os
import secrets
import threading
import time
from datetime import timedelta
from urllib.parse import urlencode

import requests
from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.dependency import get_user_permissions
from app.core.logger import logger
from app.core.security import hash_password, hash_token, utcnow
from app.crud.user import create_user, get_user_by_email
from app.models.role_permission import Role
from app.models.security import SSOLoginAttempt
from app.models.user import User
from app.services.token_service import issue_token_pair

PTIT_CLIENT_ID = os.getenv("PTIT_CLIENT_ID")
PTIT_REDIRECT_URI = os.getenv("PTIT_REDIRECT_URI")
PTIT_CERTS_ENDPOINT = os.getenv("PTIT_CERTS_ENDPOINT", "https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/certs")
PTIT_ISSUER = os.getenv("PTIT_ISSUER") or PTIT_CERTS_ENDPOINT.rsplit("/protocol/openid-connect/", 1)[0]
PTIT_AUTH_ENDPOINT = os.getenv("PTIT_AUTH_ENDPOINT", f"{PTIT_ISSUER}/protocol/openid-connect/auth")
PTIT_TOKEN_ENDPOINT = os.getenv("PTIT_TOKEN_ENDPOINT", f"{PTIT_ISSUER}/protocol/openid-connect/token")
SSO_COOKIE_NAME = "adcs_sso_state"
SSO_COOKIE_PATH = "/api/auth/sso"
SSO_COOKIE_SECURE = (PTIT_REDIRECT_URI or "").startswith("https://")
SSO_LIFETIME_SECONDS = 600
_CACHED_JWKS = None
_JWKS_CACHED_AT = 0.0
_JWKS_LOCK = threading.Lock()


def get_ptit_jwks(force_refresh=False):
    global _CACHED_JWKS, _JWKS_CACHED_AT
    with _JWKS_LOCK:
        if not force_refresh and _CACHED_JWKS and time.monotonic() - _JWKS_CACHED_AT < 300:
            return _CACHED_JWKS
        try:
            response = requests.get(PTIT_CERTS_ENDPOINT, timeout=5)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, dict) or not isinstance(data.get("keys"), list) or not data["keys"]:
                return None
            _CACHED_JWKS, _JWKS_CACHED_AT = data, time.monotonic()
            return data
        except (requests.RequestException, ValueError):
            logger.warning("SSO: không thể tải khóa xác minh")
            return None


def begin_sso_login(db: Session):
    if not PTIT_CLIENT_ID or not PTIT_REDIRECT_URI or not PTIT_ISSUER:
        raise HTTPException(status_code=503, detail="SSO chưa được cấu hình")
    db.query(SSOLoginAttempt).filter(SSOLoginAttempt.expires_at <= utcnow()).delete(synchronize_session=False)
    state, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(3))
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    db.add(SSOLoginAttempt(state_hash=hash_token(state), nonce_hash=hash_token(nonce), code_verifier=verifier,
                          expires_at=utcnow() + timedelta(seconds=SSO_LIFETIME_SECONDS)))
    db.commit()
    params = {"client_id": PTIT_CLIENT_ID, "response_type": "code", "redirect_uri": PTIT_REDIRECT_URI,
              "scope": "openid profile email", "state": state, "nonce": nonce,
              "code_challenge": challenge, "code_challenge_method": "S256"}
    return {"authorization_url": f"{PTIT_AUTH_ENDPOINT}?{urlencode(params)}", "state": state}


def _signing_key(id_token: str):
    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token SSO không hợp lệ")
    if header.get("alg") != "RS256" or not isinstance(header.get("kid"), str):
        raise HTTPException(status_code=401, detail="Thuật toán token SSO không hợp lệ")
    for force in (False, True):
        jwks = get_ptit_jwks(force_refresh=force)
        if not jwks:
            raise HTTPException(status_code=503, detail="Không thể xác minh đăng nhập SSO lúc này")
        for key in jwks.get("keys", []):
            if (key.get("kid") == header["kid"] and key.get("kty") == "RSA"
                    and key.get("use", "sig") == "sig" and key.get("alg", "RS256") == "RS256"):
                return key
    raise HTTPException(status_code=401, detail="Không tìm thấy khóa xác minh SSO")


def ptit_sso_login(db: Session, code: str, state: str, cookie_state: str | None):
    if not cookie_state or not secrets.compare_digest(state.encode(), cookie_state.encode()):
        raise HTTPException(status_code=401, detail="Phiên đăng nhập SSO không hợp lệ")
    attempt = db.query(SSOLoginAttempt).filter(SSOLoginAttempt.state_hash == hash_token(state)).with_for_update().first()
    if not attempt or attempt.used_at is not None or attempt.expires_at <= utcnow():
        raise HTTPException(status_code=401, detail="Phiên đăng nhập SSO đã hết hạn hoặc đã sử dụng")
    verifier, expected_nonce = attempt.code_verifier, attempt.nonce_hash
    attempt.used_at = utcnow()
    # The code/state is single-use even if the upstream exchange subsequently fails.
    db.commit()
    try:
        response = requests.post(PTIT_TOKEN_ENDPOINT, data={
            "grant_type": "authorization_code", "code": code, "redirect_uri": PTIT_REDIRECT_URI,
            "client_id": PTIT_CLIENT_ID, "code_verifier": verifier,
        }, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Không thể xác thực với máy chủ PTIT SSO")
        token_data = response.json()
    except (requests.RequestException, ValueError):
        raise HTTPException(status_code=503, detail="Máy chủ SSO tạm thời không khả dụng")
    id_token = token_data.get("id_token")
    if not isinstance(id_token, str):
        raise HTTPException(status_code=401, detail="Máy chủ SSO không trả token hợp lệ")
    key = _signing_key(id_token)
    try:
        info = jwt.decode(id_token, key, algorithms=["RS256"], audience=PTIT_CLIENT_ID,
                          issuer=PTIT_ISSUER, access_token=token_data.get("access_token"), options={
                              "require_exp": True, "require_iat": True, "require_sub": True,
                              "require_aud": True, "require_iss": True,
                          })
    except JWTError:
        raise HTTPException(status_code=401, detail="Không thể xác minh token SSO")
    nonce = info.get("nonce")
    if not isinstance(nonce, str) or not secrets.compare_digest(hash_token(nonce), expected_nonce):
        raise HTTPException(status_code=401, detail="Nonce SSO không hợp lệ")
    email = info.get("email")
    if not isinstance(email, str) or info.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="SSO chưa xác minh địa chỉ email")
    email = email.strip().lower()
    role = db.query(Role).filter(Role.system_code == "user").first()
    user = get_user_by_email(db, email)
    if not user:
        if not role:
            raise HTTPException(status_code=403, detail="Chưa cấu hình vai trò người dùng SSO")
        name = info.get("name") or info.get("preferred_username") or email.split("@")[0]
        user = create_user(db, User(username=name, email=email, password_hash=hash_password(secrets.token_urlsafe(32)),
                                    is_active=True, role_id=str(role.role_id)))
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản chưa được kích hoạt hoặc đã bị khóa")
    if not user.role_id:
        raise HTTPException(status_code=403, detail="Tài khoản chưa được phân quyền")
    role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
    if not role:
        raise HTTPException(status_code=403, detail="Vai trò người dùng không hợp lệ")
    tokens = issue_token_pair(db, user)
    return {**tokens, "user": {
        "id": str(user.user_id), "email": user.email, "name": user.username,
        "role": role.name, "is_admin": role.system_code == "admin",
        "permissions": get_user_permissions(db, user.role_id),
        "is_telegram_connected": bool(user.telegram_chat_id), "telegram_chat_id": user.telegram_chat_id,
    }}
