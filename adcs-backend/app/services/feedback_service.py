from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackListResponse

def create_feedback_service(db: Session, user: User, data: FeedbackCreate) -> FeedbackResponse:
    user_uuid = user.user_id if user else None

    new_feedback = Feedback(
        user_id=user_uuid,
        feedback_type=data.feedback_type or "improvement",
        content=data.content.strip()
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    u_name = getattr(user, "display_name", None) or getattr(user, "username", None) or getattr(user, "email", "Người dùng")
    u_email = getattr(user, "email", None)

    return FeedbackResponse(
        id=new_feedback.id,
        user_id=str(new_feedback.user_id) if new_feedback.user_id else None,
        feedback_type=new_feedback.feedback_type,
        content=new_feedback.content,
        created_at=new_feedback.created_at,
        user_name=u_name,
        user_email=u_email
    )

def get_feedbacks_service(db: Session, skip: int = 0, limit: int = 50) -> FeedbackListResponse:
    total = db.query(Feedback).count()
    feedbacks = (
        db.query(Feedback, User)
        .outerjoin(User, Feedback.user_id == User.user_id)
        .order_by(desc(Feedback.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    items = []
    for fb, u in feedbacks:
        u_name = None
        u_email = None
        if u:
            u_name = getattr(u, "display_name", None) or getattr(u, "username", None) or getattr(u, "email", None)
            u_email = getattr(u, "email", None)
        
        items.append(
            FeedbackResponse(
                id=fb.id,
                user_id=str(fb.user_id) if fb.user_id else None,
                feedback_type=fb.feedback_type,
                content=fb.content,
                created_at=fb.created_at,
                user_name=u_name or "Người dùng ẩn danh",
                user_email=u_email or ""
            )
        )

    return FeedbackListResponse(
        total=total,
        items=items
    )
