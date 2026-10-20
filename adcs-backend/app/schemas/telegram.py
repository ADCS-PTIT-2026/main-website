from typing import List, Optional
from pydantic import BaseModel
from app.models.role_permission import Role

class RoleNotificationRequest(BaseModel):
    text: str
    # Không còn dùng: Web tự lấy token bot của hệ thống (D2, crawler không giữ token)
    bot_token: Optional[str] = None
    roles: List[str]
