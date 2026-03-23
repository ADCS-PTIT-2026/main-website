from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user import UpdateUserRequest, UpdateUserResponse
from app.services.user_service import approve_user
from app.db.session import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.put("/{id}", response_model=UpdateUserResponse)
def update_user_api(id: str, request: UpdateUserRequest, db: Session = Depends(get_db)):
    return approve_user(
        db,
        user_id=id,
        name=request.name,
        is_active=request.is_active
    )