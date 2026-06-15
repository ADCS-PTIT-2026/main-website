from sqlalchemy.orm import Session
from app.models.department import Department

def get_department_by_id(db: Session, department_id):
    return db.query(Department).filter(Department.department_id == department_id).first()

def get_department_by_external_id(db: Session, external_id: int):
    return db.query(Department).filter(Department.id == external_id).first()

def get_department_by_name(db: Session, name: str):
    return db.query(Department).filter(Department.name == name).first()

def get_department_by_code(db: Session, code: str):
    return db.query(Department).filter(Department.code == code).first()

def list_departments(db: Session):
    return db.query(Department).order_by(Department.level_number.asc().nulls_last(), Department.created_at.asc()).all()

def create_department(db: Session, payload):
    dept = Department(
        id=payload.id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
        ten_viet_tat=payload.ten_viet_tat,
        ten_hien_thi=payload.ten_hien_thi,
        loai_don_vi=payload.loai_don_vi,
        cap_don_vi=payload.cap_don_vi,
        level_number=payload.level_number,
        is_formal=payload.is_formal,
        has_seal=payload.has_seal,
        parent_name=payload.parent_name,
        child_count=payload.child_count,
        parent_id=payload.parent_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

def update_department(db: Session, department: Department, payload):
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(department, key, value)

    db.commit()
    db.refresh(department)
    return department

def delete_department(db: Session, department):
    db.delete(department)
    db.commit()

def has_child_departments(db: Session, external_id: int):
    if external_id is None:
        return False
    return db.query(Department).filter(Department.parent_id == external_id).first() is not None