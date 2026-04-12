from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Dict
from app.core.logger import logger
from app.crud import system_parameter as crud_sysparam

def get_system_parameters_service(db: Session) -> Dict[str, str]:
    logger.info("Yêu cầu lấy toàn bộ cấu hình hệ thống (System Parameters)")
    try:
        params = crud_sysparam.get_all_parameters(db)
        logger.info(f"Lấy thành công {len(params)} tham số cấu hình")
        return params
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi lấy cấu hình: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Lỗi hệ thống khi lấy cấu hình"
        )

def update_system_parameters_service(db: Session, payload: Dict[str, str]) -> Dict[str, str]:
    logger.info("Yêu cầu cập nhật cấu hình hệ thống")
    try:
        updated_params = crud_sysparam.upsert_parameters(db, payload)
        logger.info("Cập nhật cấu hình hệ thống thành công")
        return updated_params
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật cấu hình: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Lỗi hệ thống khi cập nhật cấu hình"
        )