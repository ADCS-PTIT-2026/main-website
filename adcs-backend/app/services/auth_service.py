import os
import re
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.user import get_user_by_email, create_user
from app.models.user import User
from app.models.security import LoginAttempt
from app.core.security import verify_password, hash_password
from app.core.dependency import get_user_session_data
from app.services.token_service import issue_token_pair, refresh_access_token
from app.services.sso_service import ptit_sso_login


def check_login_rate_limit(db: Session, key: str):
    now = datetime.now(timezone.utc)
    attempt = db.query(LoginAttempt).filter_by(key=key).first()
    if attempt and attempt.locked_until and attempt.locked_until > now:
        remaining_seconds = max(1, int((attempt.locked_until - now).total_seconds()))
        remaining_minutes = max(1, (remaining_seconds + 59) // 60)
        raise HTTPException(
            status_code=429,
            detail=f"Đăng nhập sai quá 5 lần liên tiếp. Tài khoản hoặc IP bị tạm khóa, vui lòng thử lại sau {remaining_minutes} phút.",
            headers={"Retry-After": str(remaining_seconds)}
        )


def record_login_failure(db: Session, key: str):
    now = datetime.now(timezone.utc)
    attempt = db.query(LoginAttempt).filter_by(key=key).with_for_update().first()
    if not attempt:
        attempt = LoginAttempt(key=key, failures=1, window_start=now, updated_at=now)
        db.add(attempt)
    else:
        # If last attempt was more than 15 mins ago, reset window
        if (now - attempt.window_start).total_seconds() > 900:
            attempt.failures = 1
            attempt.window_start = now
            attempt.locked_until = None
        else:
            attempt.failures += 1
            if attempt.failures >= 5:
                attempt.locked_until = now + timedelta(minutes=15)
        attempt.updated_at = now
    db.commit()


def record_login_success(db: Session, key: str):
    attempt = db.query(LoginAttempt).filter_by(key=key).first()
    if attempt:
        db.delete(attempt)
        db.commit()


def login(db: Session, email: str, password: str, client_ip: str = "unknown"):
    email = email.strip().lower()
    email_key = f"email:{email}"
    ip_key = f"ip:{client_ip}"

    check_login_rate_limit(db, email_key)
    if client_ip != "unknown":
        check_login_rate_limit(db, ip_key)

    user = get_user_by_email(db, email)

    if not user or not verify_password(password, user.password_hash):
        record_login_failure(db, email_key)
        if client_ip != "unknown":
            record_login_failure(db, ip_key)
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác!")

    record_login_success(db, email_key)
    tokens = issue_token_pair(db, user)
    return {**tokens, "user": get_user_session_data(db, user)}


def is_allowed_registration_email(email: str) -> bool:
    email = email.strip().lower()
    allowed_domains_str = os.getenv("REGISTRATION_ALLOWED_DOMAINS", "ptit.edu.vn,stu.ptit.edu.vn")
    allowed_domains = {d.strip().lower() for d in allowed_domains_str.split(",") if d.strip()}
    domain = email.split("@")[-1] if "@" in email else ""
    return domain in allowed_domains


def register(db: Session, name: str, email: str, password: str):
    email = email.strip().lower()

    # 1. Kiểm tra định dạng email
    if not re.match(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$", email):
        raise HTTPException(status_code=400, detail="Định dạng email không hợp lệ!")

    # 1.5. Kiểm tra tên miền email thuộc Học viện (L10)
    if not is_allowed_registration_email(email):
        allowed_domains_str = os.getenv("REGISTRATION_ALLOWED_DOMAINS", "ptit.edu.vn,stu.ptit.edu.vn")
        allowed_domains = {d.strip().lower() for d in allowed_domains_str.split(",") if d.strip()}
        domains_formatted = ", ".join("@" + d for d in sorted(allowed_domains))
        raise HTTPException(
            status_code=400,
            detail=f"Hệ thống chỉ nhận đăng ký tài khoản có email thuộc tên miền Học viện ({domains_formatted})."
        )

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
