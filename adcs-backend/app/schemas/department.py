from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    id: Optional[int] = None
    code: Optional[str] = None
    description: Optional[str] = None
    ten_viet_tat: Optional[str] = None
    ten_hien_thi: Optional[str] = None
    loai_don_vi: Optional[str] = None
    cap_don_vi: Optional[str] = None
    level_number: Optional[int] = None
    is_formal: Optional[bool] = None
    has_seal: Optional[bool] = None
    parent_name: Optional[str] = None
    child_count: Optional[int] = 0
    parent_id: Optional[int] = None

class DepartmentCreateRequest(DepartmentBase):
    description: str = Field(..., min_length=10, description="Mô tả chức năng nhiệm vụ bắt buộc phục vụ AI phân luồng")

class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = None
    id: Optional[int] = None
    code: Optional[str] = None
    description: Optional[str] = Field(None, min_length=10, description="Mô tả chức năng nhiệm vụ")
    ten_viet_tat: Optional[str] = None
    ten_hien_thi: Optional[str] = None
    loai_don_vi: Optional[str] = None
    cap_don_vi: Optional[str] = None
    level_number: Optional[int] = None
    is_formal: Optional[bool] = None
    has_seal: Optional[bool] = None
    parent_name: Optional[str] = None
    child_count: Optional[int] = None
    parent_id: Optional[int] = None

class DepartmentResponse(DepartmentBase):
    department_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DepartmentTreeResponse(DepartmentResponse):
    children: List["DepartmentTreeResponse"] = []

DepartmentTreeResponse.model_rebuild()

class MessageResponse(BaseModel):
    message: str

class RegionUnitResponse(BaseModel):
    ma_don_vi: Optional[str] = None
    id: Optional[int] = None
    ten_hien_thi: Optional[str] = None
    nhom: Optional[str] = None
    mo_ta: Optional[str] = None

class RegionSearchResponse(BaseModel):
    region: str
    label: str
    units: List[RegionUnitResponse] = []