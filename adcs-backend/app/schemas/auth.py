from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: Optional[str] = None
    is_admin: bool = False
    permissions: list[str] = []
    is_telegram_connected: bool = False
    telegram_chat_id: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class RegisterResponse(BaseModel):
    message: str
    is_active: bool

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str

class SSOCallbackRequest(BaseModel):
    code: str = Field(min_length=1, max_length=4096)
    state: str = Field(min_length=32, max_length=128)
