from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, Any, List, Dict
from datetime import date, datetime

class UploadResponse(BaseModel):
    document_id: UUID
    status: str
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    document_id: UUID
    assigned_department_id: Optional[UUID] = None
    uploaded_by_user_id: Optional[UUID] = None

    so_den: Optional[str] = None
    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    hinh_thuc: Optional[str] = None
    loai_van_ban_text: Optional[str] = None
    don_vi_ban_hanh: Optional[str] = None
    nguoi_ky: Optional[str] = None
    chuc_vu_nguoi_ky: Optional[str] = None
    ngay_van_ban: Optional[date] = None
    ngay_den: Optional[datetime] = None
    ngay_het_han: Optional[date] = None
    do_khan: Optional[str] = None
    
    noi_nhan: Optional[List[str]] = None
    can_cu_phap_ly: Optional[List[str]] = None
    yeu_cau_han_dong: Optional[str] = None

    status: Optional[str] = None
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    confidence: Optional[float] = None
    muc_tin_cay: Optional[str] = None
    
    de_xuat_xu_ly: Optional[Dict[str, Any]] = None
    goi_y_phong_ban: Optional[Dict[str, Any]] = None
    
    priority: int = 0
    is_chua_doc: bool
    tong_so_chunk: Optional[int] = None
    processing_time: Optional[float] = None
    thong_tin_ky_so: Optional[Dict[str, Any]] = None
    
    created_at: datetime
    updated_at: datetime

    attachments: Optional[List[Dict]] = None
    local_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AIResultUpdateRequest(BaseModel):
    assigned_department_id: Optional[str] = None
    assigned_user_id: Optional[UUID] = None

    so_den: Optional[str] = None    
    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    hinh_thuc: Optional[str] = None
    loai_van_ban_text: Optional[str] = None
    don_vi_ban_hanh: Optional[str] = None
    nguoi_ky: Optional[str] = None
    chuc_vu_nguoi_ky: Optional[str] = None
    ngay_van_ban: Optional[date] = None
    ngay_den: Optional[datetime] = None
    ngay_het_han: Optional[date] = None
    do_khan: Optional[str] = None
    
    noi_nhan: Optional[List[str]] = None
    can_cu_phap_ly: Optional[List[str]] = None
    yeu_cau_han_dong: Optional[str] = None

    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    confidence: Optional[float] = None
    muc_tin_cay: Optional[str] = None
    
    de_xuat_xu_ly: Optional[Dict[str, Any]] = None
    goi_y_phong_ban: Optional[Dict[str, Any]] = None

    updated_at: datetime = None

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

class ActionResponse(BaseModel):
    message: str