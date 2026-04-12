from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.department import (
    get_department_by_id,
    get_department_by_name,
    get_department_by_code,
    list_departments,
    create_department,
    update_department,
    has_child_departments,
    delete_department
)
from app.core.logger import logger

def build_department_tree(departments):
    dept_map = {
        dept.department_id: {
            "department_id": dept.department_id,
            "name": dept.name,
            "code": dept.code,
            "description": dept.description,
            "parent_id": dept.parent_id,
            "created_at": dept.created_at,
            "children": []
        }
        for dept in departments
    }

    roots = []
    for dept in departments:
        node = dept_map[dept.department_id]
        if dept.parent_id and dept.parent_id in dept_map:
            dept_map[dept.parent_id]["children"].append(node)
        else:
            roots.append(node)

    return roots


def get_all_departments_service(db: Session):
    logger.info("Fetching all departments")

    departments = list_departments(db)
    result = build_department_tree(departments)

    logger.info(f"Built department tree with {len(result)} root nodes")
    return result


def create_department_service(db: Session, payload):
    try:
        logger.info(f"Creating department name={payload.name}, code={payload.code}")

        if get_department_by_name(db, payload.name):
            logger.warning(f"Department name already exists: {payload.name}")
            raise HTTPException(status_code=400, detail="Department name already exists")

        if payload.code and get_department_by_code(db, payload.code):
            logger.warning(f"Department code already exists: {payload.code}")
            raise HTTPException(status_code=400, detail="Department code already exists")

        if payload.parent_id:
            parent = get_department_by_id(db, payload.parent_id)
            if not parent:
                logger.warning(f"Parent not found: {payload.parent_id}")
                raise HTTPException(status_code=404, detail="Parent department not found")

        if payload.parent_id is not None:
            if str(payload.parent_id) == "__self__":
                logger.warning("Invalid parent_id = __self__")
                raise HTTPException(status_code=400, detail="Invalid parent_id")

        dept = create_department(db, payload)

        logger.info(f"Department created id={dept.department_id}")
        return dept

    except Exception as e:
        logger.error(f"Error creating department: {str(e)}", exc_info=True)
        raise

def update_department_service(db: Session, department_id, payload):
    try:
        logger.info(f"Updating department id={department_id}")

        department = get_department_by_id(db, department_id)
        if not department:
            logger.warning(f"Department not found: {department_id}")
            raise HTTPException(status_code=404, detail="Department not found")

        if payload.name is not None and payload.name != department.name:
            existed = get_department_by_name(db, payload.name)
            if existed and existed.department_id != department.department_id:
                logger.warning(f"Duplicate name: {payload.name}")
                raise HTTPException(status_code=400, detail="Department name already exists")

        if payload.code is not None and payload.code != department.code:
            existed = get_department_by_code(db, payload.code)
            if existed and existed.department_id != department.department_id:
                logger.warning(f"Duplicate code: {payload.code}")
                raise HTTPException(status_code=400, detail="Department code already exists")

        if payload.parent_id is not None:
            if str(payload.parent_id) == str(department.department_id):
                logger.warning(f"Department cannot be its own parent: {department_id}")
                raise HTTPException(status_code=400, detail="A department cannot be its own parent")

            parent = get_department_by_id(db, payload.parent_id)
            if not parent:
                logger.warning(f"Parent not found: {payload.parent_id}")
                raise HTTPException(status_code=404, detail="Parent department not found")

        updated = update_department(db, department, payload)

        logger.info(f"Department updated id={department_id}")
        return updated

    except Exception as e:
        logger.error(f"Error updating department id={department_id}: {str(e)}", exc_info=True)
        raise


def delete_department_service(db: Session, department_id):
    try:
        logger.info(f"Deleting department id={department_id}")

        department = get_department_by_id(db, department_id)
        if not department:
            logger.warning(f"Department not found: {department_id}")
            raise HTTPException(status_code=404, detail="Department not found")

        if has_child_departments(db, department_id):
            logger.warning(f"Cannot delete, has children: {department_id}")
            raise HTTPException(
                status_code=400,
                detail="Cannot delete department because it has child departments"
            )

        delete_department(db, department)

        logger.info(f"Department deleted id={department_id}")
        return {"message": "Delete department successful"}

    except Exception as e:
        logger.error(f"Error deleting department id={department_id}: {str(e)}", exc_info=True)
        raise