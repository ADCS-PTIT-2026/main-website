from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import date, datetime

class UploadResponse(BaseModel):
    document_id: UUID
    status: str

    model_config = ConfigDict(from_attributes=True)

class AIResultUpdateRequest(BaseModel):
    title: Optional[str] = None
    document_number: Optional[str] = None
    signed_date: Optional[date] = None
    document_type_id: Optional[UUID] = None
    assigned_department_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    priority: Optional[int] = None
    confidence: Optional[float] = None
    summary: Optional[str] = None
    status: Optional[str] = None

class DocumentResponse(BaseModel):
    document_id: UUID
    title: Optional[str] = None
    document_number: Optional[str] = None
    signed_date: Optional[date] = None
    assigned_department_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    priority: Optional[int] = None
    confidence: Optional[float] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AIResultUpdateResponse(BaseModel):
    message: str
    document: DocumentResponse

class DocumentAIResultResponse(BaseModel):
    document_id: UUID
    assigned_department_id: Optional[UUID] = None
    
    # Thông tin AI trích xuất (Metadata)
    document_type_id: Optional[UUID] = None
    loai_van_ban_text: Optional[str] = None  # Loại văn bản thô AI đọc được
    don_vi_ban_hanh: Optional[str] = None
    so_den: Optional[str] = None
    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    
    # Ngày tháng
    ngay_van_ban: Optional[date] = None
    ngay_het_han: Optional[date] = None
    
    # Đánh giá của AI
    summary: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None

    # Bật tính năng tự động map từ SQLAlchemy model sang Pydantic
    model_config = ConfigDict(from_attributes=True)