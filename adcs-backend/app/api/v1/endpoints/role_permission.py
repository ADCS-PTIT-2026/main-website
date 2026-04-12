from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict

from app.db.session import get_db
from app.schemas.role_permission import RoleCreate, RoleUpdate, RoleResponse, PermissionCreate, PermissionUpdate, PermissionResponse, MatrixUpdateResponse

from app.services.role_permission import (
    get_all_roles_service, create_role_service, update_role_service, delete_role_service,
    get_all_permissions_service, create_permission_service, update_permission_service, delete_permission_service,
    get_matrix_service, update_matrix_service
)

router = APIRouter()

# ----------------- ROLES -----------------
@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return get_all_roles_service(db)

@router.post("/roles", response_model=RoleResponse)
def add_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return create_role_service(db, payload)

@router.put("/roles/{role_id}", response_model=RoleResponse)
def edit_role(role_id: str, payload: RoleUpdate, db: Session = Depends(get_db)):
    return update_role_service(db, role_id, payload)

@router.delete("/roles/{role_id}")
def remove_role(role_id: str, db: Session = Depends(get_db)):
    return delete_role_service(db, role_id)


# ----------------- PERMISSIONS -----------------
@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(db: Session = Depends(get_db)):
    return get_all_permissions_service(db)

@router.post("/permissions", response_model=PermissionResponse)
def add_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    return create_permission_service(db, payload)

@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
def edit_permission(permission_id: str, payload: PermissionUpdate, db: Session = Depends(get_db)):
    return update_permission_service(db, permission_id, payload)

@router.delete("/permissions/{permission_id}")
def remove_permission(permission_id: str, db: Session = Depends(get_db)):
    return delete_permission_service(db, permission_id)


# ----------------- MATRIX -----------------
@router.get("/roles/permissions-matrix", response_model=Dict[str, bool])
def get_matrix(db: Session = Depends(get_db)):
    """Trả về cho frontend dạng: {"READ_DOC_role1": true, "EDIT_DOC_role2": true}"""
    return get_matrix_service(db)

@router.put("/roles/permissions-matrix", response_model=MatrixUpdateResponse)
def update_matrix(payload: Dict[str, bool], db: Session = Depends(get_db)):
    """Nhận payload từ frontend: {"READ_DOC_role1": true, "READ_DOC_role2": false}"""
    return update_matrix_service(db, payload)