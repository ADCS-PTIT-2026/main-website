from pydantic import BaseModel, ConfigDict, EmailStr, computed_field
from typing import Optional
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    username: str

# --- Requests ---
class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class UserAssign(BaseModel):
    role_id: Optional[UUID] = None
    department_id: Optional[str] = None

class UserStatus(BaseModel):
    is_active: bool

# --- Responses ---
class UserResponse(UserBase):
    user_id: UUID
    role_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_active: bool
    telegram_chat_id: Optional[str] = None

    @computed_field
    @property
    def is_telegram_connected(self) -> bool:
        return bool(self.telegram_chat_id)

    model_config = ConfigDict(from_attributes=True)

class ActionResponse(BaseModel):
    message: str

class TelegramStatusResponse(BaseModel):
    is_connected: bool
    telegram_chat_id: Optional[str] = None
    bot_name: str
    link: str

class UserProfileResponse(BaseModel):
    user_id: str
    email: EmailStr
    username: str
    role_id: Optional[str] = None
    role_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    is_active: bool
    is_telegram_connected: bool
    telegram_chat_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str