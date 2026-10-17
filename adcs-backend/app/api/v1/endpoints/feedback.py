from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependency import RoleChecker, get_current_user
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackListResponse
from app.services.feedback_service import create_feedback_service, get_feedbacks_service

router = APIRouter()
require_admin = RoleChecker(['admin'])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Người dùng gửi ý kiến đóng góp cho team dev."""
    return create_feedback_service(db=db, user=current_user, data=data)

@router.get("", response_model=FeedbackListResponse, dependencies=[Depends(require_admin)])
def get_all_feedbacks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin lấy danh sách ý kiến đóng góp từ người dùng."""
    return get_feedbacks_service(db=db, skip=skip, limit=limit)
