from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.crud.user import get_user_by_id, update_user

def approve_user(db: Session, user_id: str, name: str = None, is_active: bool = None):
    user = get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = update_user(db, user, name, is_active)

    return {
        "message": "Grant access successful"
    }