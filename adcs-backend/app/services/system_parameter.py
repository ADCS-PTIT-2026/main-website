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

def validate_system_parameters(payload: Dict[str, str]):
    """Kiểm tra tính hợp lệ của các tham số cấu hình AI (W13)"""
    if "temperature" in payload:
        try:
            val = float(payload["temperature"])
            if not (0.0 <= val <= 1.0):
                raise HTTPException(status_code=400, detail="Temperature phải là số thực từ 0.0 đến 1.0")
        except ValueError:
            raise HTTPException(status_code=400, detail="Temperature không hợp lệ")

    if "topP" in payload or "top_p" in payload:
        key = "topP" if "topP" in payload else "top_p"
        try:
            val = float(payload[key])
            if not (0.0 <= val <= 1.0):
                raise HTTPException(status_code=400, detail="Top P phải là số thực từ 0.0 đến 1.0")
        except ValueError:
            raise HTTPException(status_code=400, detail="Top P không hợp lệ")

    if "maxTokens" in payload or "max_tokens" in payload:
        key = "maxTokens" if "maxTokens" in payload else "max_tokens"
        try:
            val = int(payload[key])
            if not (256 <= val <= 8192):
                raise HTTPException(status_code=400, detail="Max Tokens phải là số nguyên từ 256 đến 8192")
        except ValueError:
            raise HTTPException(status_code=400, detail="Max Tokens không hợp lệ")

    if "topK" in payload or "top_k" in payload:
        key = "topK" if "topK" in payload else "top_k"
        try:
            val = int(payload[key])
            if not (1 <= val <= 100):
                raise HTTPException(status_code=400, detail="Top K phải là số nguyên từ 1 đến 100")
        except ValueError:
            raise HTTPException(status_code=400, detail="Top K không hợp lệ")

    if "promptTemplate" in payload:
        val = payload["promptTemplate"].strip()
        if len(val) < 10:
            raise HTTPException(status_code=400, detail="Mẫu câu lệnh hệ thống (Prompt Template) phải có tối thiểu 10 ký tự")

def update_system_parameters_service(db: Session, payload: Dict[str, str]) -> Dict[str, str]:
    logger.info("Yêu cầu cập nhật cấu hình hệ thống")
    validate_system_parameters(payload)
    try:
        updated_params = crud_sysparam.upsert_parameters(db, payload)
        logger.info("Cập nhật cấu hình hệ thống thành công")
        return updated_params
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật cấu hình: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Lỗi hệ thống khi cập nhật cấu hình"
        )