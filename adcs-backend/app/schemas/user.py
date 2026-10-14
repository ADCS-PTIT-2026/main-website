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