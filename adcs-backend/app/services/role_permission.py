from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.logger import logger
from app.models.role_permission import Role, Permission
from app.crud import role_permisson as crud

# ----------------- ROLES -----------------
def get_all_roles_service(db: Session):
    logger.info("Yêu cầu lấy danh sách nhóm quyền (Roles)")
    try:
        roles = crud.get_all_roles(db)
        logger.info(f"Lấy thành công {len(roles)} nhóm quyền")
        return roles
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi lấy danh sách Roles: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi lấy danh sách nhóm quyền")

def create_role_service(db: Session, payload):
    logger.info(f"Yêu cầu tạo nhóm quyền mới: {payload.name}")
    try:
        new_role = crud.create_role(db, payload.model_dump())
        logger.info(f"Tạo nhóm quyền thành công. ID: {new_role.role_id}")
        return new_role
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi tạo Role: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi tạo nhóm quyền")

def update_role_service(db: Session, role_id: str, payload):
    logger.info(f"Yêu cầu cập nhật nhóm quyền ID: {role_id}")
    try:
        role = db.query(Role).filter(Role.role_id == role_id).first()
        if not role:
            logger.warning(f"Từ chối cập nhật. Không tìm thấy nhóm quyền ID: {role_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhóm quyền")

        updated_role = crud.update_role(db, role, payload.model_dump())
        logger.info(f"Cập nhật nhóm quyền thành công ID: {role_id}")
        return updated_role
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật Role {role_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi cập nhật nhóm quyền")

def delete_role_service(db: Session, role_id: str):
    logger.info(f"Yêu cầu xóa nhóm quyền ID: {role_id}")
    try:
        role = db.query(Role).filter(Role.role_id == role_id).first()
        if not role:
            logger.warning(f"Từ chối xóa. Không tìm thấy nhóm quyền ID: {role_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhóm quyền")

        crud.delete_role(db, role)
        logger.info(f"Xóa nhóm quyền thành công ID: {role_id}")
        return {"message": "Đã xóa nhóm quyền thành công"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi xóa Role {role_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi xóa nhóm quyền")


# ----------------- PERMISSIONS -----------------
def get_all_permissions_service(db: Session):
    logger.info("Yêu cầu lấy danh sách các Quyền (Permissions)")
    try:
        permissions = crud.get_all_permissions(db)
        logger.info(f"Lấy thành công {len(permissions)} quyền")
        return permissions
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi lấy danh sách Permissions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi lấy danh sách quyền")

def create_permission_service(db: Session, payload):
    logger.info(f"Yêu cầu tạo quyền mới: {payload.name if hasattr(payload, 'name') else 'Unknown'}")
    try:
        new_permission = crud.create_permission(db, payload.model_dump())
        logger.info(f"Tạo quyền thành công. ID: {new_permission.permission_id}")
        return new_permission
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi tạo Permission: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi tạo quyền")

def update_permission_service(db: Session, permission_id: str, payload):
    logger.info(f"Yêu cầu cập nhật quyền ID: {permission_id}")
    try:
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        if not permission:
            logger.warning(f"Từ chối cập nhật. Không tìm thấy quyền ID: {permission_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy quyền")

        updated_permission = crud.update_permission(db, permission, payload.model_dump())
        logger.info(f"Cập nhật quyền thành công ID: {permission_id}")
        return updated_permission
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật Permission {permission_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi cập nhật quyền")

def delete_permission_service(db: Session, permission_id: str):
    logger.info(f"Yêu cầu xóa quyền ID: {permission_id}")
    try:
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        if not permission:
            logger.warning(f"Từ chối xóa. Không tìm thấy quyền ID: {permission_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy quyền")

        crud.delete_permission(db, permission)
        logger.info(f"Xóa quyền thành công ID: {permission_id}")
        return {"message": "Đã xóa quyền thành công"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi xóa Permission {permission_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi xóa quyền")


# ----------------- MATRIX -----------------
def get_matrix_service(db: Session):
    logger.info("Yêu cầu lấy Ma trận phân quyền (Permissions Matrix)")
    try:
        matrix = crud.get_permission_matrix(db)
        logger.info("Lấy ma trận phân quyền thành công")
        return matrix
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi lấy Permission Matrix: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi lấy ma trận phân quyền")

def update_matrix_service(db: Session, payload: dict):
    logger.info("Yêu cầu cập nhật Ma trận phân quyền")
    try:
        crud.update_permission_matrix(db, payload)
        logger.info("Cập nhật ma trận phân quyền thành công")
        return {"message": "Cập nhật ma trận phân quyền thành công"}
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật Permission Matrix: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi hệ thống khi cập nhật ma trận phân quyền")