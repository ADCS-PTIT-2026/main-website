import re
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.user import get_user_by_email, create_user
from app.models.user import User
from app.models.role_permission import Role
from app.core.security import verify_password, hash_password
from app.core.dependency import get_user_permissions
from app.services.token_service import issue_token_pair, refresh_access_token
from app.services.sso_service import ptit_sso_login


def login(db: Session, email: str, password: str):
    email = email.strip().lower()
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    if not user.is_active:
        raise HTTPException(
            status_code=403, 
            detail="Tài khoản của bạn đang chờ Quản trị viên duyệt hoặc đã bị vô hiệu hóa!"
        )

    if not user.role_id:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản chưa được phân quyền sử dụng hệ thống. Vui lòng liên hệ Quản trị viên."
        )

    role_name = None
    role = None
    permissions = []
    if user.role_id:
        role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
        if role:
            role_name = role.name
            permissions = get_user_permissions(db, user.role_id)

    if role is None:
        raise HTTPException(status_code=403, detail="Vai trò người dùng không hợp lệ")

    tokens = issue_token_pair(db, user)

    return {
        **tokens,
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "name": user.username,
            "role": role_name,
            "is_admin": bool(role and role.system_code == "admin"),
            "permissions": permissions,
            "is_telegram_connected": bool(user.telegram_chat_id),
            "telegram_chat_id": user.telegram_chat_id
        }
    }


def register(db: Session, name: str, email: str, password: str):
    email = email.strip().lower()

    # 1. Kiểm tra định dạng email
    if not re.match(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$", email):
        raise HTTPException(status_code=400, detail="Định dạng email không hợp lệ!")

    # 2. Kiểm tra độ phức tạp của mật khẩu
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có độ dài tối thiểu 8 ký tự!")
    if not (any(c.isupper() for c in password) and any(c.islower() for c in password) and any(c.isdigit() for c in password)):
        raise HTTPException(status_code=400, detail="Mật khẩu phải bao gồm cả chữ hoa, chữ thường và chữ số!")

    # 3. Kiểm tra trùng email
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký trên hệ thống!")

    # 4. Tạo tài khoản với trạng thái chờ duyệt (is_active = False)
    hashed_pwd = hash_password(password)
    new_user = User(
        username=name.strip(),
        email=email,
        password_hash=hashed_pwd,
        is_active=False # Chờ admin phê duyệt
    )

    user = create_user(db, new_user)

    return {
        "message": "Đăng ký tài khoản thành công! Tài khoản của bạn đang chờ Quản trị viên duyệt và phân quyền.",
        "is_active": user.is_active
    }
