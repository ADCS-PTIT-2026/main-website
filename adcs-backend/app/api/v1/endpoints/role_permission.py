from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from app.db.session import SessionLocal
from app.schemas.role_permission import RoleCreate, RoleUpdate, RoleResponse, PermissionResponse, MatrixUpdateResponse
from app.crud import role_permisson as crud
from app.models.role_permission import Role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- ROLES -----------------
@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return crud.get_all_roles(db)

@router.post("/roles", response_model=RoleResponse)
def add_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return crud.create_role(db, payload.model_dump())

@router.put("/roles/{role_id}", response_model=RoleResponse)
def edit_role(role_id: str, payload: RoleUpdate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền")
    return crud.update_role(db, role, payload.model_dump())

@router.delete("/roles/{role_id}")
def remove_role(role_id: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền")
    crud.delete_role(db, role)
    return {"message": "Đã xóa nhóm quyền thành công"}

# ----------------- PERMISSIONS -----------------
@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(db: Session = Depends(get_db)):
    return crud.get_all_permissions(db)

# ----------------- MATRIX -----------------
@router.get("/roles/permissions-matrix", response_model=Dict[str, bool])
def get_matrix(db: Session = Depends(get_db)):
    """
    Trả về cho frontend dạng: {"READ_DOC_role1": true, "EDIT_DOC_role2": true}
    """
    return crud.get_permission_matrix(db)

@router.put("/roles/permissions-matrix", response_model=MatrixUpdateResponse)
def update_matrix(payload: Dict[str, bool], db: Session = Depends(get_db)):
    """
    Nhận payload từ frontend: {"READ_DOC_role1": true, "READ_DOC_role2": false}
    """
    crud.update_permission_matrix(db, payload)
    return {"message": "Cập nhật ma trận phân quyền thành công"}