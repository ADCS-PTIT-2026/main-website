from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, Any
from datetime import date, datetime

class UploadResponse(BaseModel):
    document_id: UUID
    status: str
    model_config = ConfigDict(from_attributes=True)

class AIResultUpdateRequest(BaseModel):
    # Mapping các trường từ AI trả về
    so_den: Optional[str] = None
    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    hinh_thuc: Optional[str] = None
    loai_van_ban_text: Optional[str] = None
    don_vi_ban_hanh: Optional[str] = None
    ngay_van_ban: Optional[date] = None
    ngay_den: Optional[datetime] = None
    ngay_het_han: Optional[date] = None
    
    # Metadata và trạng thái
    document_type_id: Optional[UUID] = None
    assigned_department_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    priority: Optional[int] = None
    confidence: Optional[float] = None
    summary: Optional[str] = None
    status: Optional[str] = None

class DocumentResponse(BaseModel):
    document_id: UUID
    so_den: Optional[str] = None
    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    ngay_van_ban: Optional[date] = None
    status: Optional[str] = None
    assigned_department_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    priority: Optional[int] = None
    confidence: Optional[float] = None
    is_chua_doc: bool
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class DocumentAIResultResponse(BaseModel):
    document_id: UUID
    assigned_department_id: Optional[UUID] = None
    document_type_id: Optional[UUID] = None
    
    # Thông tin AI trích xuất chi tiết
    loai_van_ban_text: Optional[str] = None
    don_vi_ban_hanh: Optional[str] = None
    so_den: Optional[str] = None
    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    hinh_thuc: Optional[str] = None
    muc: Optional[str] = None
    do_khan: Optional[str] = None
    do_mat: Optional[str] = None
    vai_tro: Optional[str] = None
    
    # Ngày tháng
    ngay_van_ban: Optional[date] = None
    ngay_den: Optional[datetime] = None
    ngay_het_han: Optional[date] = None
    
    # Kết quả AI
    summary: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None
    thong_tin_ky_so: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

class AIResultUpdateResponse(BaseModel):
    message: str
    document: DocumentResponse

class DashboardStatsResponse(BaseModel):
    total_documents: int
    pending_documents: int
    ai_accuracy: float
    new_users: int