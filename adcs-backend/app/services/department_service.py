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
)


def build_department_tree(departments):
    dept_map = {}
    roots = []

    for dept in departments:
        dept_map[dept.department_id] = {
            "department_id": dept.department_id,
            "name": dept.name,
            "code": dept.code,
            "description": dept.description,
            "parent_id": dept.parent_id,
            "created_at": dept.created_at,
            "children": []
        }

    for dept in departments:
        node = dept_map[dept.department_id]
        if dept.parent_id and dept.parent_id in dept_map:
            dept_map[dept.parent_id]["children"].append(node)
        else:
            roots.append(node)

    return roots


def get_all_departments_service(db: Session):
    departments = list_departments(db)
    return build_department_tree(departments)


def create_department_service(db: Session, payload):
    if get_department_by_name(db, payload.name):
        raise HTTPException(status_code=400, detail="Department name already exists")

    if payload.code and get_department_by_code(db, payload.code):
        raise HTTPException(status_code=400, detail="Department code already exists")

    if payload.parent_id:
        parent = get_department_by_id(db, payload.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent department not found")

    if payload.parent_id is not None:
        if str(payload.parent_id) == "__self__":
            raise HTTPException(status_code=400, detail="Invalid parent_id")

    dept = create_department(db, payload)
    return dept


def update_department_service(db: Session, department_id, payload):
    department = get_department_by_id(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    if payload.name is not None and payload.name != department.name:
        existed = get_department_by_name(db, payload.name)
        if existed and existed.department_id != department.department_id:
            raise HTTPException(status_code=400, detail="Department name already exists")

    if payload.code is not None and payload.code != department.code:
        existed = get_department_by_code(db, payload.code)
        if existed and existed.department_id != department.department_id:
            raise HTTPException(status_code=400, detail="Department code already exists")

    if payload.parent_id is not None:
        if str(payload.parent_id) == str(department.department_id):
            raise HTTPException(status_code=400, detail="A department cannot be its own parent")

        parent = get_department_by_id(db, payload.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent department not found")

    updated = update_department(db, department, payload)
    return updated


def delete_department_service(db: Session, department_id):
    department = get_department_by_id(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    if has_child_departments(db, department_id):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete department because it has child departments"
        )

    db.delete(department)
    db.commit()
    return {"message": "Delete department successful"}