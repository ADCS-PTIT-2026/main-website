from pydantic import BaseModel, ConfigDict, EmailStr
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

    model_config = ConfigDict(from_attributes=True)

class ActionResponse(BaseModel):
    message: str