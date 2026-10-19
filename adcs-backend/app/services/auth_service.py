import re
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.user import get_user_by_email, create_user
from app.models.user import User
from app.core.security import verify_password, hash_password
from app.core.dependency import get_user_session_data
from app.services.token_service import issue_token_pair, refresh_access_token
from app.services.sso_service import ptit_sso_login


def login(db: Session, email: str, password: str):
    email = email.strip().lower()
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    tokens = issue_token_pair(db, user)
    return {**tokens, "user": get_user_session_data(db, user)}


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
