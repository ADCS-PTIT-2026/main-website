from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.session import SessionLocal
from app.models.user import User
from app.models.role_permission import Role, Permission, RolePermission
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_user_permissions(db: Session, role_id: str) -> list[str]:
    """Lấy danh sách mã quyền (code) tương ứng với role_id"""
    if not role_id:
        return []
    permissions = (
        db.query(Permission.code)
        .join(RolePermission, Permission.permission_id == RolePermission.permission_id)
        .filter(RolePermission.role_id == str(role_id))
        .all()
    )
    return [p[0] for p in permissions]

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Giải mã JWT Token và lấy thông tin User từ Database kèm danh sách mã quyền.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin đăng nhập",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.user_id == user_id).first()
    
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Tài khoản chưa được kích hoạt hoặc đã bị khóa"
        )

    # Lấy thông tin role và permissions
    user.role_name = None
    user.permissions = []
    if user.role_id:
        role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
        if role:
            user.role_name = role.name
            user.permissions = get_user_permissions(db, user.role_id)
        
    return user

class RoleChecker:
    """
    Kiểm tra danh sách các Role được phép truy cập.
    """
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        if not current_user.role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Tài khoản chưa được cấp quyền cho hành động này."
            )
            
        role = db.query(Role).filter(Role.role_id == str(current_user.role_id)).first()
        
        if not role or role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Bạn không có quyền thực hiện thao tác này (Yêu cầu vai trò: {', '.join(self.allowed_roles)})"
            )
        
        return current_user

class PermissionChecker:
    """
    Kiểm tra người dùng có mã quyền (permission_code) cụ thể hay không.
    Người dùng có role 'admin' mặc định bypass toàn bộ quyền.
    """
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: User = Depends(get_current_user)):
        # Admin có toàn quyền
        if getattr(current_user, "role_name", "") == "admin":
            return current_user

        user_permissions = getattr(current_user, "permissions", [])
        if self.required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền thực hiện thao tác này (Yêu cầu quyền: {self.required_permission})"
            )
        return current_user