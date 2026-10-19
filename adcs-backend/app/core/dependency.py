from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.authorization import has_permission
from app.core.security import decode_token, utcnow
from app.db.session import get_db
from app.models.role_permission import Permission, Role, RolePermission
from app.models.user import User
from app.models.security import RefreshToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_user_permissions(db: Session, role_id: str) -> list[str]:
    if not role_id:
        return []
    permissions = (db.query(Permission.code)
                   .join(RolePermission, Permission.permission_id == RolePermission.permission_id)
                   .filter(RolePermission.role_id == str(role_id)).all())
    return [permission[0] for permission in permissions]


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_error = HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
                                      headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(token, "access")
    except JWTError:
        raise credentials_error
    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if user is None or user.auth_version != payload["auth_version"]:
        raise credentials_error
    session = db.query(RefreshToken.token_hash).filter(
        RefreshToken.family_id == payload["sid"], RefreshToken.user_id == user.user_id,
        RefreshToken.revoked_at.is_(None), RefreshToken.expires_at > utcnow(),
    ).first()
    if session is None:
        raise credentials_error
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản chưa được kích hoạt hoặc đã bị khóa")
    role = db.query(Role).filter(Role.role_id == str(user.role_id)).first() if user.role_id else None
    if role is None:
        raise HTTPException(status_code=403, detail="Tài khoản chưa được phân quyền")
    user.role_name = role.name
    user.is_admin = role.system_code == "admin"
    user.permissions = get_user_permissions(db, user.role_id)
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        role = db.query(Role).filter(Role.role_id == str(current_user.role_id)).first()
        if role and role.system_code in self.allowed_roles:
            return current_user
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này")


class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: User = Depends(get_current_user)):
        require_permission(current_user, self.required_permission)
        return current_user


def require_permission(user: User, code: str):
    if not has_permission(user, code):
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này")
