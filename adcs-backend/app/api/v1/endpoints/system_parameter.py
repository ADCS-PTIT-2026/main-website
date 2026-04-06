from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict
from app.db.session import get_db
from app.crud import system_parameter as crud_sysparam
from app.core.dependency import RoleChecker

router = APIRouter(prefix="/api/system-parameters", tags=["System Parameters"])
require_admin = RoleChecker(['admin'])

@router.get("", response_model=Dict[str, str])
def get_system_parameters(db: Session = Depends(get_db)):
    """Lấy toàn bộ cấu hình hệ thống"""
    return crud_sysparam.get_all_parameters(db)

@router.put("", response_model=Dict[str, str])
def update_system_parameters(
    payload: Dict[str, str], 
    db: Session = Depends(get_db),
    dependencies=[Depends(require_admin)]
):
    return crud_sysparam.upsert_parameters(db, payload)