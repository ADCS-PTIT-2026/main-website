from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependency import get_current_user, PermissionChecker
from app.schemas.department import (
    DepartmentCreateRequest,
    DepartmentUpdateRequest,
    DepartmentResponse,
    DepartmentTreeResponse,
    MessageResponse,
    RegionSearchResponse
)
from app.services.department_service import (
    get_all_departments_service,
    create_department_service,
    update_department_service,
    delete_department_service,
    get_departments_by_region_service,
    get_mock_departments_by_region_service
)

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[DepartmentTreeResponse])
def get_departments(db: Session = Depends(get_db)):
    return get_all_departments_service(db)


@router.post("", response_model=DepartmentResponse, dependencies=[Depends(PermissionChecker("department.create"))])
def create_department(
    request: DepartmentCreateRequest,
    db: Session = Depends(get_db)
):
    return create_department_service(db, request)


@router.put("/{id}", response_model=DepartmentResponse, dependencies=[Depends(PermissionChecker("department.update"))])
def update_department(
    id: str,
    request: DepartmentUpdateRequest,
    db: Session = Depends(get_db)
):
    return update_department_service(db, id, request)


@router.delete("/{id}", response_model=MessageResponse, dependencies=[Depends(PermissionChecker("department.delete"))])
def delete_department(
    id: str,
    db: Session = Depends(get_db)
):
    return delete_department_service(db, id)

@router.get("/region", response_model=RegionSearchResponse | list[RegionSearchResponse])
def search_departments_by_region(
    region: str = Query("all", description="Filter by region: 'north', 'south', or 'all'"),
    db: Session = Depends(get_db)
):
    return get_departments_by_region_service(db, region)


@router.get("/mock_region", response_model=RegionSearchResponse | list[RegionSearchResponse])
def search_mock_departments_by_region(
    region: str = Query("all", description="Filter by region: 'north', 'south', or 'all'")
):
    return get_mock_departments_by_region_service(region)
