from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.crud import user as crud_user
from app.models.user import User
from app.models.telegram_bot import Bot
from app.schemas.user import UserCreate, UserUpdate, UserAssign, UserStatus
from app.core.security import hash_password 
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
        user = crud_user.get_user_by_id(db, user_id)
        if not user:
            logger.warning(f"Từ chối phân quyền. Không tìm thấy user ID: {user_id}")
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        updated_user = crud_user.update_user_fields(db, user, request.model_dump(exclude_unset=True))
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
        user = crud_user.get_user_by_id(db, user_id)
        if not user:
            logger.warning(f"Từ chối đổi trạng thái. Không tìm thấy user ID: {user_id}")
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        updated_user = crud_user.update_user_fields(db, user, request.model_dump())
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
    logger.info(f"Yêu cầu tạo Telegram Deep Link cho user ID: {current_user.user_id}")
    try:
        bot = db.query(Bot).filter(Bot.channel_type == 'telegram', Bot.name == 'ptit_adcs_bot').first()
        if not bot:
            logger.warning("Không tìm thấy cấu hình Telegram Bot 'ptit_adcs_bot' trong Database")
            raise HTTPException(status_code=404, detail="Chưa cấu hình Telegram Bot trong hệ thống")

        payload = str(current_user.user_id)
        deep_link = f"https://t.me/{bot.name}?start={payload}"
        
        logger.info(f"Tạo Deep Link thành công cho user ID: {current_user.user_id}")
        return {
            "bot_name": bot.name,
            "link": deep_link
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi tạo link Telegram cho user {current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi khởi tạo liên kết Telegram")