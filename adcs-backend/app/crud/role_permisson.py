from sqlalchemy.orm import Session
from app.models.role_permission import Role, Permission, RolePermission
from typing import Dict

# --- QUẢN LÝ ROLE ---
def get_all_roles(db: Session):
    return db.query(Role).all()

def create_role(db: Session, data: dict):
    role = Role(**data)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def update_role(db: Session, role: Role, data: dict):
    for key, value in data.items():
        setattr(role, key, value)
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role: Role):
    db.delete(role)
    db.commit()

# --- QUẢN LÝ PERMISSION & MATRIX ---
def get_all_permissions(db: Session):
    return db.query(Permission).all()

def create_permission(db: Session, data: dict):
    permission = Permission(**data)
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission

def update_permission(db: Session, permission: Permission, data: dict):
    for key, value in data.items():
        setattr(permission, key, value)
    db.commit()
    db.refresh(permission)
    return permission

def delete_permission(db: Session, permission: Permission):
    db.delete(permission)
    db.commit()

def get_permission_matrix(db: Session) -> Dict[str, bool]:
    # Trả về format: {"PERMISSION_CODE_ROLE_ID": True}
    mappings = (
        db.query(RolePermission.role_id, Permission.code)
        .join(Permission, RolePermission.permission_id == Permission.permission_id)
        .all()
    )
    
    matrix = {}
    for role_id, perm_code in mappings:
        matrix[f"{perm_code}_{role_id}"] = True
        
    return matrix

def update_permission_matrix(db: Session, matrix_payload: Dict[str, bool]):
    # Lấy danh sách permission để map code -> id
    permissions = db.query(Permission).all()
    code_to_id = {p.code: p.permission_id for p in permissions}

    for key, is_checked in matrix_payload.items():
        parts = key.rsplit('_', 1)
        if len(parts) != 2:
            continue
            
        code, role_id = parts
        perm_id = code_to_id.get(code)
        
        if not perm_id:
            continue

        existing = db.query(RolePermission).filter_by(role_id=role_id, permission_id=perm_id).first()

        if is_checked and not existing:
            db.add(RolePermission(role_id=role_id, permission_id=perm_id))
        elif not is_checked and existing:
            db.delete(existing)

    db.commit()