from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str

class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[str] = None

class UpdateUserResponse(BaseModel):
    message: str