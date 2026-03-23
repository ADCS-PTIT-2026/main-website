from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.crud import user as crud_user
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password 

def create_new_user(db: Session, data: UserCreate):
    # Kiểm tra email tồn tại
    existing_user = crud_user.get_user_by_email(db, data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trong hệ thống."
        )
    
    new_user = User(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        is_active=False
    )
    
    try:
        return crud_user.create_user(db, new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi dữ liệu khi tạo người dùng."
        )