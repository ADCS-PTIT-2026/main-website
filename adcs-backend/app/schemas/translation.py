from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class TranslationResponse(BaseModel):
    id: UUID
    filename: str
    file_type: str
    status: str
    comment: Optional[str] = None
    result_file_url: Optional[str] = None
    job_status: str = 'queued'
    step: Optional[str] = None
    progress_done: int = 0
    progress_total: int = 0
    queue_position: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    source_language: str = 'vi'
    target_language: str = 'en'
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UploadTranslationResponse(BaseModel):
    message: str
    duplicate_count: int
    processed_files: List[TranslationResponse]

class CommentUpdateRequest(BaseModel):
    comment: str