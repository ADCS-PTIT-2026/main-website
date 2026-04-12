from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.department import Department

def get_department_by_id(db: Session, department_id):
    return db.query(Department).filter(Department.department_id == department_id).first()

def get_department_by_name(db: Session, name: str):
    return db.query(Department).filter(Department.name == name).first()

def get_department_by_code(db: Session, code: str):
    return db.query(Department).filter(Department.code == code).first()

def list_departments(db: Session):
    return db.query(Department).order_by(Department.created_at.asc()).all()

def create_department(db: Session, payload):
    dept = Department(
        name=payload.name,
        code=payload.code,
        description=payload.description,
        parent_id=payload.parent_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

def update_department(db: Session, department: Department, payload):
    if payload.name is not None:
        department.name = payload.name
    if payload.code is not None:
        department.code = payload.code
    if payload.description is not None:
        department.description = payload.description
    if payload.parent_id is not None or payload.parent_id is None:
        department.parent_id = payload.parent_id

    db.commit()
    db.refresh(department)
    return department

def delete_department(db: Session, department):
    db.delete(department)
    db.commit()

def has_child_departments(db: Session, department_id):
    return db.query(Department).filter(Department.parent_id == department_id).first() is not None