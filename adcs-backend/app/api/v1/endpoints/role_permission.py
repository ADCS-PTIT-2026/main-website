from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from app.db.session import get_db
from app.db.session import SessionLocal
from app.schemas.role_permission import RoleCreate, RoleUpdate, RoleResponse, PermissionCreate, PermissionUpdate, PermissionResponse, MatrixUpdateResponse
from app.crud import role_permisson as crud
from app.models.role_permission import Role, Permission

router = APIRouter()

# ----------------- ROLES -----------------
# 1. lấy danh sách roles
@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return crud.get_all_roles(db)

# 2. thêm role mới
@router.post("/roles", response_model=RoleResponse)
def add_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return crud.create_role(db, payload.model_dump())

# 3. sửa role
@router.put("/roles/{role_id}", response_model=RoleResponse)
def edit_role(role_id: str, payload: RoleUpdate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền")
    return crud.update_role(db, role, payload.model_dump())

# 4. xóa role
@router.delete("/roles/{role_id}")
def remove_role(role_id: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền")
    crud.delete_role(db, role)
    return {"message": "Đã xóa nhóm quyền thành công"}

# ----------------- PERMISSIONS -----------------
# 5. lấy permissions
@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(db: Session = Depends(get_db)):
    return crud.get_all_permissions(db)

# 6. thêm permission mới
@router.post("/permissions", response_model=PermissionResponse)
def add_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    return crud.create_permission(db, payload.model_dump())

# 7. sửa permission
@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
def edit_permission(permission_id: str, payload: PermissionUpdate, db: Session = Depends(get_db)):
    permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Không tìm thấy quyền")
    return crud.update_permission(db, permission, payload.model_dump())

# 8. xóa permission
@router.delete("/permissions/{permission_id}")
def remove_permission(permission_id: str, db: Session = Depends(get_db)):
    permission = db.query(permission).filter(permission.permission_id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Không tìm thấy quyền")
    crud.delete_permission(db, permission)
    return {"message": "Đã xóa quyền thành công"}

# ----------------- MATRIX -----------------
# 9. lấy ma trận phân quyền
@router.get("/roles/permissions-matrix", response_model=Dict[str, bool])
def get_matrix(db: Session = Depends(get_db)):
    """
    Trả về cho frontend dạng: {"READ_DOC_role1": true, "EDIT_DOC_role2": true}
    """
    return crud.get_permission_matrix(db)

# 10. sửa ma trận phân quyền
@router.put("/roles/permissions-matrix", response_model=MatrixUpdateResponse)
def update_matrix(payload: Dict[str, bool], db: Session = Depends(get_db)):
    """
    Nhận payload từ frontend: {"READ_DOC_role1": true, "READ_DOC_role2": false}
    """
    crud.update_permission_matrix(db, payload)
    return {"message": "Cập nhật ma trận phân quyền thành công"}