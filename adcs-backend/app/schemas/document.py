from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator
from uuid import UUID
from typing import Optional, Any, List, Dict
from datetime import date, datetime
from typing import Literal

class UploadResponse(BaseModel):
    document_id: UUID
    status: str
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    @field_validator('sync_warnings', 'duplicate_reasons', mode='before')
    @classmethod
    def normalize_nullable_integration_lists(cls, value):
        # Existing rows and documents not yet synced store SQL NULL for these optional lists.
        return [] if value is None else value

    similarity: Optional[float] = None
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
    yeu_cau_hanh_dong: Optional[str] = Field(default=None, validation_alias=AliasChoices('yeu_cau_hanh_dong', 'yeu_cau_han_dong'))

    source_type: Optional[str] = None
    source_name: Optional[str] = None
    sync_status: Optional[str] = None
    sync_warnings: List[str] = []
    duplicate_document_id: Optional[UUID] = None
    duplicate_reasons: List[str] = []
    possible_duplicate_count: int = 0
    status: Optional[str] = None
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    next_attempt_at: Optional[datetime] = None
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    confidence: Optional[float] = None
    muc_tin_cay: Optional[str] = None
    
    de_xuat_xu_ly: Optional[Dict[str, Any]] = None
    goi_y_phong_ban: Optional[Dict[str, Any]] = None
    suggested_departments: Optional[List[Dict[str, Any]]] = None
    proposed_assignees: Optional[List[Dict[str, Any]]] = None
    
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
    @field_validator('assigned_department_id', 'assigned_user_id', 'ngay_van_ban', 'ngay_den', 'ngay_het_han', mode='before')
    @classmethod
    def normalize_empty_optional_inputs(cls, value):
        return None if isinstance(value, str) and not value.strip() else value

    status: Optional[Literal["approved"]] = None
    assigned_department_id: Optional[UUID] = None
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
    yeu_cau_hanh_dong: Optional[str] = Field(default=None, validation_alias=AliasChoices('yeu_cau_hanh_dong', 'yeu_cau_han_dong'))

    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    confidence: Optional[float] = None
    muc_tin_cay: Optional[str] = None
    
    de_xuat_xu_ly: Optional[Dict[str, Any]] = None
    goi_y_phong_ban: Optional[Dict[str, Any]] = None
    suggested_departments: Optional[List[Dict[str, Any]]] = None
    proposed_assignees: Optional[List[Dict[str, Any]]] = None

    # updated_at is server-owned; legacy clients may still send it as an ignored extra.

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
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    sync_status: Optional[str] = None
    sync_warnings: List[str] = []
    duplicate_document_id: Optional[UUID] = None
    duplicate_reasons: List[str] = []
    possible_duplicate_count: int = 0
    status: Optional[str] = None
    thong_tin_ky_so: Optional[Any] = None
    suggested_departments: Optional[List[Dict[str, Any]]] = None
    proposed_assignees: Optional[List[Dict[str, Any]]] = None

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

class MyDocumentItemResponse(BaseModel):
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    sync_status: Optional[str] = None
    duplicate_document_id: Optional[UUID] = None
    duplicate_reasons: List[str] = []
    possible_duplicate_count: int = 0
    sync_warnings: List[str] = []
    document_id: UUID
    original_filename: Optional[str] = None
    file_size_bytes: Optional[int] = None
    page_count: Optional[int] = None
    status: str
    queue_position: Optional[int] = None
    priority: int = 1
    retry_count: int = 0
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    next_attempt_at: Optional[datetime] = None
    warnings: List[Any] = []

    so_ky_hieu: Optional[str] = None
    trich_yeu: Optional[str] = None
    don_vi_ban_hanh: Optional[str] = None
    loai_van_ban_text: Optional[str] = None
    summary: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MyDocumentsListResponse(BaseModel):
    items: List[MyDocumentItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class DocumentSearchResponse(BaseModel):
    warnings: List[str] = []
    status: str
    query: str
    data: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
