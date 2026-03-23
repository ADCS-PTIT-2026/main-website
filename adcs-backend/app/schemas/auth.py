from pydantic import BaseModel
from uuid import UUID

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str

class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class RegisterResponse(BaseModel):
    message: str
    is_active: bool