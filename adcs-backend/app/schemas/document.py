from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import date, datetime

class UploadResponse(BaseModel):
    document_id: UUID
    status: str

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


class AIResultUpdateResponse(BaseModel):
    message: str
    document: DocumentResponse