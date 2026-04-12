from typing import List
from pydantic import BaseModel
from app.models.role_permission import Role

class RoleNotificationRequest(BaseModel):
    text: str
    bot_token: str
    roles: List[str]