import re
import os
from app.services.telegram_link_service import issue_telegram_link, disconnect_telegram
from app.models.security import RefreshToken
from app.core.security import utcnow
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.crud import user as crud_user
from app.models.user import User
from app.models.role_permission import Role
from app.models.department import Department
from app.schemas.user import (
    UserCreate, UserUpdate, UserAssign, UserStatus,
    UserProfileResponse, UserProfileUpdate, ChangePasswordRequest
)
from app.core.security import hash_password, verify_password
from app.core.logger import logger 

def get_all_users_service(db: Session):
    logger.info("Yêu cầu lấy danh sách toàn bộ người dùng")
    try:
        users = crud_user.get_all_users(db)
        logger.info(f"Lấy thành công {len(users)} người dùng")
        return users
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi lấy danh sách người dùng: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống khi lấy danh sách người dùng."
        )

def create_new_user(db: Session, data: UserCreate):
    logger.info(f"Yêu cầu tạo tài khoản mới cho email: {data.email}")
    try:
        existing_user = crud_user.get_user_by_email(db, data.email)
        if existing_user:
            logger.warning(f"Từ chối tạo tài khoản. Email đã tồn tại: {data.email}")
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

        created_user = crud_user.create_user(db, new_user)
        user_id = getattr(created_user, 'user_id', 'Unknown_ID')
        logger.info(f"Tạo tài khoản thành công! Email: {data.email} | ID: {user_id}")
        
        return created_user

    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Lỗi toàn vẹn dữ liệu (IntegrityError) khi tạo user {data.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi dữ liệu khi tạo người dùng."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi hệ thống không xác định khi tạo user {data.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Đã xảy ra lỗi hệ thống trong quá trình tạo tài khoản."
        )

def update_user_info_service(db: Session, user_id: str, request: UserUpdate):
    logger.info(f"Yêu cầu cập nhật thông tin cơ bản cho user ID: {user_id}")
    try:
        user = crud_user.get_user_by_id(db, user_id)
        if not user:
            logger.warning(f"Từ chối cập nhật. Không tìm thấy user ID: {user_id}")
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        updated_user = crud_user.update_user_fields(db, user, request.model_dump(exclude_unset=True))
        logger.info(f"Cập nhật thông tin thành công cho user ID: {user_id}")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi cập nhật thông tin người dùng")

def assign_user_role_dept_service(db: Session, user_id: str, request: UserAssign):
    logger.info(f"Yêu cầu phân quyền/phòng ban cho user ID: {user_id}")
    try:
        user = db.query(User).filter(User.user_id == user_id).with_for_update().populate_existing().first()
        if not user:
            logger.warning(f"Từ chối phân quyền. Không tìm thấy user ID: {user_id}")
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        updated_user = crud_user.update_user_fields(db, user, {**request.model_dump(exclude_unset=True), "auth_version": user.auth_version + 1})
        logger.info(f"Phân quyền/phòng ban thành công cho user ID: {user_id}")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi phân quyền user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi phân quyền người dùng")

def change_user_status_service(db: Session, user_id: str, request: UserStatus):
    logger.info(f"Yêu cầu thay đổi trạng thái (Active/Inactive) cho user ID: {user_id}")
    try:
        user = db.query(User).filter(User.user_id == user_id).with_for_update().populate_existing().first()
        if not user:
            logger.warning(f"Từ chối đổi trạng thái. Không tìm thấy user ID: {user_id}")
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        updated_user = crud_user.update_user_fields(db, user, {**request.model_dump(), "auth_version": user.auth_version + 1})
        logger.info(f"Đổi trạng thái thành công cho user ID: {user_id}")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi đổi trạng thái user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi thay đổi trạng thái người dùng")

def delete_user_account_service(db: Session, user_id: str):
    logger.info(f"Yêu cầu xóa tài khoản user ID: {user_id}")
    try:
        user = crud_user.get_user_by_id(db, user_id)
        if not user:
            logger.warning(f"Từ chối xóa. Không tìm thấy user ID: {user_id}")
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        crud_user.delete_user(db, user)
        logger.info(f"Xóa tài khoản thành công user ID: {user_id}")
        return {"message": "Đã xóa tài khoản thành công"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi xóa user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi xóa tài khoản")

def get_telegram_link_service(db: Session, current_user: User):
    if not os.getenv("TELEGRAM_BOT_TOKEN") or not os.getenv("TELEGRAM_WEBHOOK_SECRET"):
        raise HTTPException(status_code=503, detail="Telegram chưa được cấu hình đầy đủ")
    bot_name = os.getenv("TELEGRAM_BOT_NAME", "ptit_adcs_bot")
    return issue_telegram_link(db, current_user, bot_name)

def get_telegram_status_service(db: Session, current_user: User):
    """Lấy trạng thái kết nối Telegram của người dùng hiện tại"""
    try:
        bot_name = os.getenv("TELEGRAM_BOT_NAME", "ptit_adcs_bot")
        deep_link = f"https://t.me/{bot_name}"
        return {
            "is_connected": bool(current_user.telegram_chat_id),
            "telegram_chat_id": current_user.telegram_chat_id,
            "bot_name": bot_name,
            "link": deep_link
        }
    except Exception as e:
        logger.error(f"Lỗi khi lấy trạng thái Telegram user {current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi khi lấy trạng thái Telegram")

def disconnect_telegram_service(db: Session, current_user: User):
    """Hủy liên kết Telegram của người dùng hiện tại để kết nối lại hoặc đổi tài khoản khác"""
    try:
        disconnect_telegram(db, current_user)
        db.refresh(current_user)
        logger.info(f"Đã hủy liên kết Telegram cho user {current_user.email}")
        return {
            "message": "Đã ngắt kết nối Telegram thành công",
            "is_connected": False
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi hủy liên kết Telegram user {current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi khi hủy liên kết Telegram")

def get_current_user_profile_service(db: Session, current_user: User):
    """Lấy thông tin chi tiết của người dùng hiện tại"""
    try:
        role_name = None
        if current_user.role_id:
            role = db.query(Role).filter(Role.role_id == str(current_user.role_id)).first()
            if role:
                role_name = role.name

        department_name = None
        if current_user.department_id:
            dept_id_str = str(current_user.department_id)
            dept = None
            if dept_id_str.isdigit():
                dept = db.query(Department).filter(Department.id == int(dept_id_str)).first()
            else:
                try:
                    dept = db.query(Department).filter(Department.department_id == dept_id_str).first()
                except Exception:
                    pass
            if dept:
                department_name = dept.name

        return {
            "user_id": str(current_user.user_id),
            "email": current_user.email,
            "username": current_user.username,
            "role_id": str(current_user.role_id) if current_user.role_id else None,
            "role_name": role_name,
            "department_id": str(current_user.department_id) if current_user.department_id else None,
            "department_name": department_name,
            "is_active": current_user.is_active,
            "is_telegram_connected": bool(current_user.telegram_chat_id),
            "telegram_chat_id": current_user.telegram_chat_id
        }
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin profile user {current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi lấy thông tin hồ sơ")

def update_current_user_profile_service(db: Session, current_user: User, request: UserProfileUpdate):
    """Cập nhật thông tin cơ bản của người dùng hiện tại"""
    try:
        if request.username is not None and request.username.strip():
            current_user.username = request.username.strip()
        db.commit()
        db.refresh(current_user)
        logger.info(f"Cập nhật hồ sơ thành công cho user {current_user.email}")
        return get_current_user_profile_service(db, current_user)
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi cập nhật hồ sơ user {current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi cập nhật thông tin hồ sơ")

def change_current_user_password_service(db: Session, current_user: User, request: ChangePasswordRequest):
    """Đổi mật khẩu người dùng hiện tại với kiểm tra an toàn"""
    try:
        current_user = db.query(User).filter(User.user_id == str(current_user.user_id)).with_for_update().populate_existing().first()
        # 1. Kiểm tra mật khẩu mới và xác nhận mật khẩu
        if request.new_password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu xác nhận không khớp với mật khẩu mới"
            )

        # 2. Kiểm tra độ phức tạp của mật khẩu mới (CWE-521)
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải có tối thiểu 8 ký tự"
            )

        if not re.search(r'[A-Z]', request.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa"
            )

        if not re.search(r'[a-z]', request.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải chứa ít nhất 1 chữ cái in thường"
            )

        if not re.search(r'[0-9]', request.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải chứa ít nhất 1 chữ số"
            )

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', request.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)"
            )

        # 3. Xác thực mật khẩu hiện tại
        if not verify_password(request.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không chính xác"
            )

        # 4. Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        if verify_password(request.new_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới không được trùng với mật khẩu hiện tại"
            )

        # 5. Cập nhật mật khẩu băm mới
        current_user.password_hash = hash_password(request.new_password)
        current_user.auth_version += 1
        db.query(RefreshToken).filter(RefreshToken.user_id == current_user.user_id, RefreshToken.revoked_at.is_(None)).update({"revoked_at": utcnow()})
        db.commit()
        logger.info(f"Đổi mật khẩu thành công cho user {current_user.email}")
        return {"message": "Đổi mật khẩu thành công"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi đổi mật khẩu user {current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Đã xảy ra lỗi hệ thống trong quá trình đổi mật khẩu"
        )