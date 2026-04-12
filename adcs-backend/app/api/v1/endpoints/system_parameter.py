from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from app.db.session import get_db
from app.core.dependency import RoleChecker

from app.services.system_parameter import (
    get_system_parameters_service,
    update_system_parameters_service
)

router = APIRouter()
require_admin = RoleChecker(['admin'])

@router.get("", response_model=Dict[str, str])
def get_system_parameters(db: Session = Depends(get_db)):
    """Lấy toàn bộ cấu hình hệ thống"""
    return get_system_parameters_service(db)

@router.put("", response_model=Dict[str, str], dependencies=[Depends(require_admin)])
def update_system_parameters(
    payload: Dict[str, str], 
    db: Session = Depends(get_db)
):
    """Cập nhật cấu hình hệ thống (Yêu cầu quyền Admin)"""
    return update_system_parameters_service(db, payload)