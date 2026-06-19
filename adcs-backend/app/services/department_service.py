from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.department import (
    get_department_by_id,
    get_department_by_external_id,
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
    dept_map = {}
    for dept in departments:
        node = {
            "department_id": dept.department_id,
            "id": dept.id,
            "name": dept.name,
            "code": dept.code,
            "description": dept.description,
            "ten_viet_tat": dept.ten_viet_tat,
            "ten_hien_thi": dept.ten_hien_thi,
            "loai_don_vi": dept.loai_don_vi,
            "cap_don_vi": dept.cap_don_vi,
            "level_number": dept.level_number,
            "is_formal": dept.is_formal,
            "has_seal": dept.has_seal,
            "parent_name": dept.parent_name,
            "child_count": dept.child_count,
            "parent_id": dept.parent_id,
            "created_at": dept.created_at,
            "children": []
        }
        if dept.id is not None:
            dept_map[dept.id] = node
        dept_map[str(dept.department_id)] = node

    roots = []
    for dept in departments:
        node = dept_map[str(dept.department_id)]
        
        if dept.parent_id is not None and dept.parent_id in dept_map:
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

        if payload.id is not None and get_department_by_external_id(db, payload.id):
            raise HTTPException(status_code=400, detail="Department external ID already exists")

        if get_department_by_name(db, payload.name):
            raise HTTPException(status_code=400, detail="Department name already exists")

        if payload.code and get_department_by_code(db, payload.code):
            raise HTTPException(status_code=400, detail="Department code already exists")

        if payload.parent_id is not None:
            if payload.id is not None and payload.parent_id == payload.id:
                raise HTTPException(status_code=400, detail="A department cannot be its own parent")

            parent = get_department_by_external_id(db, payload.parent_id)
            if not parent:
                raise HTTPException(status_code=404, detail="Parent department not found by ID")

        dept = create_department(db, payload)
        return dept

    except Exception as e:
        logger.error(f"Error creating department: {str(e)}", exc_info=True)
        raise

def update_department_service(db: Session, department_id, payload):
    try:
        logger.info(f"Updating department id={department_id}")

        department = get_department_by_id(db, department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

        if payload.id is not None and payload.id != department.id:
            if get_department_by_external_id(db, payload.id):
                raise HTTPException(status_code=400, detail="Department external ID already exists")

        if payload.name is not None and payload.name != department.name:
            existed = get_department_by_name(db, payload.name)
            if existed and existed.department_id != department.department_id:
                raise HTTPException(status_code=400, detail="Department name already exists")

        if payload.code is not None and payload.code != department.code:
            existed = get_department_by_code(db, payload.code)
            if existed and existed.department_id != department.department_id:
                raise HTTPException(status_code=400, detail="Department code already exists")

        if payload.parent_id is not None:
            current_id = payload.id if payload.id is not None else department.id
            if current_id is not None and payload.parent_id == current_id:
                raise HTTPException(status_code=400, detail="A department cannot be its own parent")

            parent = get_department_by_external_id(db, payload.parent_id)
            if not parent:
                raise HTTPException(status_code=404, detail="Parent department not found")

        updated = update_department(db, department, payload)
        return updated

    except Exception as e:
        logger.error(f"Error updating department id={department_id}: {str(e)}", exc_info=True)
        raise


def delete_department_service(db: Session, department_id):
    try:
        logger.info(f"Deleting department id={department_id}")

        department = get_department_by_id(db, department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

        if department.id is not None and has_child_departments(db, department.id):
            raise HTTPException(
                status_code=400,
                detail="Cannot delete department because it has child departments"
            )

        delete_department(db, department)
        return {"message": "Delete department successful"}

    except Exception as e:
        logger.error(f"Error deleting department id={department_id}: {str(e)}", exc_info=True)
        raise

def get_departments_by_region_service(db: Session, region: str):
    region = region.lower()
    if region not in ['north', 'south', 'all']:
        raise HTTPException(status_code=400, detail="Region parameter must be 'north', 'south', or 'all'")

    all_deps = list_departments(db)
    
    children_map = {}
    for d in all_deps:
        if d.parent_id not in children_map:
            children_map[d.parent_id] = []
        children_map[d.parent_id].append(d)
        
    def get_all_descendants(root_id):
        descendants = []
        queue = children_map.get(root_id, [])
        while queue:
            current = queue.pop(0)
            descendants.append(current)
            queue.extend(children_map.get(current.id, []))
        return descendants

    def map_unit(u):
        return {
            "ma_don_vi": u.code,
            "id": u.id,
            "ten_hien_thi": u.ten_hien_thi if u.ten_hien_thi else u.name,
            "nhom": u.loai_don_vi,
            "mo_ta": u.description
        }

    results = []
    
    if region in ['north', 'all']:
        north_units = get_all_descendants(40)
        results.append({
            "region": "north",
            "label": "Học viện - Cơ sở phía Bắc",
            "units": [map_unit(u) for u in north_units]
        })
        
    if region in ['south', 'all']:
        south_units = get_all_descendants(39)
        results.append({
            "region": "south",
            "label": "Học viện - Cơ sở phía Nam",
            "units": [map_unit(u) for u in south_units]
        })
        
    if region != 'all' and len(results) == 1:
        return results[0]
        
    return results