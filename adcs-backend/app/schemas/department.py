from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class DepartmentCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class DepartmentResponse(BaseModel):
    department_id: UUID
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DepartmentTreeResponse(DepartmentResponse):
    children: List["DepartmentTreeResponse"] = []

    class Config:
        from_attributes = True


DepartmentTreeResponse.model_rebuild()


class MessageResponse(BaseModel):
    message: str