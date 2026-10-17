from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FeedbackCreate(BaseModel):
    feedback_type: str = Field(default="improvement", description="Loại góp ý: bug, feature, improvement, other")
    content: str = Field(..., min_length=1, description="Nội dung ý kiến góp ý")

class FeedbackResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    feedback_type: str
    content: str
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True

class FeedbackListResponse(BaseModel):
    total: int
    items: List[FeedbackResponse]
