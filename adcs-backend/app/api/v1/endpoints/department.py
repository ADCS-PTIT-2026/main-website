from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.department import (
    DepartmentCreateRequest,
    DepartmentUpdateRequest,
    DepartmentResponse,
    DepartmentTreeResponse,
    MessageResponse,
)
from app.services.department_service import (
    get_all_departments_service,
    create_department_service,
    update_department_service,
    delete_department_service,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[DepartmentTreeResponse])
def get_departments(db: Session = Depends(get_db)):
    return get_all_departments_service(db)


@router.post("", response_model=DepartmentResponse)
def create_department(
    request: DepartmentCreateRequest,
    db: Session = Depends(get_db)
):
    return create_department_service(db, request)


@router.put("/{id}", response_model=DepartmentResponse)
def update_department(
    id: str,
    request: DepartmentUpdateRequest,
    db: Session = Depends(get_db)
):
    return update_department_service(db, id, request)


@router.delete("/{id}", response_model=MessageResponse)
def delete_department(
    id: str,
    db: Session = Depends(get_db)
):
    return delete_department_service(db, id)