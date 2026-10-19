import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "7"))

pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"], 
    deprecated="auto"
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password):
    return pwd_context.hash(password)

def utcnow():
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_token(data: dict, token_type: str, lifetime: timedelta):
    now = utcnow()
    claims = {**data, "token_type": token_type, "jti": secrets.token_urlsafe(32),
              "auth_version": data.get("auth_version", 0), "iat": now, "exp": now + lifetime}
    if not SECRET_KEY or len(SECRET_KEY.encode()) < 32 or ALGORITHM not in {"HS256", "HS384", "HS512"}:
        raise RuntimeError("Configure a JWT secret and a supported HMAC algorithm")
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict):
    return _create_token(data, "access", timedelta(minutes=ACCESS_TOKEN_MINUTES))

def create_refresh_token(data: dict):
    return _create_token(data, "refresh", timedelta(days=REFRESH_TOKEN_DAYS))


def decode_token(token: str, expected_type: str):
    if not SECRET_KEY or len(SECRET_KEY.encode()) < 32 or ALGORITHM not in {"HS256", "HS384", "HS512"}:
        raise JWTError("JWT configuration unavailable")
    claims = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={
        "require_exp": True, "require_iat": True, "require_sub": True, "require_jti": True,
    })
    if claims.get("token_type") != expected_type or type(claims.get("auth_version")) is not int:
        raise JWTError("Incorrect token purpose")
    from uuid import UUID
    try:
        UUID(claims["sub"])
        UUID(claims["sid"])
    except (ValueError, TypeError, AttributeError, KeyError) as exc:
        raise JWTError("Invalid subject") from exc
    return claims
