from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException, status

def get_user_by_email(db: Session, email: str):
    try:
        return db.query(User).filter(User.email == email).first()
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi truy vấn người dùng theo email: {str(e)}"
        )

def get_user_by_id(db: Session, user_id: str):
    try:
        return db.query(User).filter(User.user_id == user_id).first()
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lỗi khi truy vấn người dùng theo ID"
        )

def create_user(db: Session, name: str, email: str, password: str):
    user = User(
        username=name,
        email=email,
        password_hash=hash_password(password),
        is_active=False 
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trong hệ thống."
        )
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống khi tạo người dùng."
        )

def update_user(db: Session, user: User, username: str = None, is_active: bool = None, role_id: str = None):
    try:
        if username is not None:
            user.username = username
        if is_active is not None:
            user.is_active = is_active
        if role_id is not None:
            user.role_id = role_id

        db.commit()
        db.refresh(user)
        return user

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dữ liệu không hợp lệ (Trùng lặp hoặc Role ID không tồn tại)."
        )
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi cơ sở dữ liệu."
        )