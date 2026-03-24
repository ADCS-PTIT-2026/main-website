from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.session import SessionLocal
from app.schemas.user import (
    UserResponse, UserCreate, UserUpdate, 
    UserAssign, UserStatus, ActionResponse
)
from app.crud import user as crud_user
from app.services.user_service import create_new_user

from app.core.dependency import RoleChecker

router = APIRouter(prefix="/api/users", tags=["Users"])
require_admin = RoleChecker(['admin'])


# 1. Lấy danh sách người dùng
@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return crud_user.get_all_users(db)

# 2. Tạo tài khoản mới
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(request: UserCreate, db: Session = Depends(get_db)):
    return create_new_user(db, request)

# 3. Sửa thông tin user (username, email)
@router.put("/{id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_user_info(id: str, request: UserUpdate, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return crud_user.update_user_fields(db, user, request.model_dump(exclude_unset=True))

# 4. Gán role + phòng ban
@router.put("/{id}/assign", response_model=UserResponse, dependencies=[Depends(require_admin)])
def assign_user_role_dept(id: str, request: UserAssign, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return crud_user.update_user_fields(db, user, request.model_dump(exclude_unset=True))

# 5. Activate / deactivate (Duyệt người dùng)
@router.put("/{id}/status", response_model=UserResponse, dependencies=[Depends(require_admin)])
def change_user_status(id: str, request: UserStatus, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return crud_user.update_user_fields(db, user, request.model_dump())

# 6. Xóa tài khoản
@router.delete("/{id}", response_model=ActionResponse, dependencies=[Depends(require_admin)])
def delete_user_account(id: str, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    crud_user.delete_user(db, user)
    return {"message": "Đã xóa tài khoản thành công"}