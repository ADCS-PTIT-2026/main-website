from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import (
    UserResponse, UserCreate, UserUpdate, 
    UserAssign, UserStatus, ActionResponse
)
from app.models.user import User
from app.core.dependency import RoleChecker, get_current_user

# Import các hàm từ service
from app.services.user_service import (
    get_all_users_service,
    create_new_user,
    update_user_info_service,
    assign_user_role_dept_service,
    change_user_status_service,
    delete_user_account_service,
    get_telegram_link_service
)

router = APIRouter(prefix="")
require_admin = RoleChecker(['admin'])

# 1. Lấy danh sách người dùng
@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return get_all_users_service(db)

# 2. Tạo tài khoản mới
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(request: UserCreate, db: Session = Depends(get_db)):
    return create_new_user(db, request)

# 3. Sửa thông tin user (username, email)
@router.put("/{id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_user_info(id: str, request: UserUpdate, db: Session = Depends(get_db)):
    return update_user_info_service(db, id, request)

# 4. Gán role + phòng ban
@router.put("/{id}/assign", response_model=UserResponse, dependencies=[Depends(require_admin)])
def assign_user_role_dept(id: str, request: UserAssign, db: Session = Depends(get_db)):
    return assign_user_role_dept_service(db, id, request)

# 5. Activate / deactivate (Duyệt người dùng)
@router.put("/{id}/status", response_model=UserResponse, dependencies=[Depends(require_admin)])
def change_user_status(id: str, request: UserStatus, db: Session = Depends(get_db)):
    return change_user_status_service(db, id, request)

# 6. Xóa tài khoản
@router.delete("/{id}", response_model=ActionResponse, dependencies=[Depends(require_admin)])
def delete_user_account(id: str, db: Session = Depends(get_db)):
    return delete_user_account_service(db, id)

# 7. Lấy link liên kết Telegram
@router.get("/connect_to_telegram")
def get_telegram_link(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo link Deep Linking đến Telegram Bot kèm theo user_id."""
    return get_telegram_link_service(db, current_user)