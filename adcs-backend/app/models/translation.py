import uuid
from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.session import Base

class TranslationLog(Base):
    __tablename__ = "translation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_hash = Column(String(255), index=True, nullable=True)
    
    status = Column(String(50), default="pending") # pending, translating, success, failed
    comment = Column(Text, nullable=True)
    
    source_language = Column(String(50), default="vi")
    target_language = Column(String(50), default="en")
    
    result_file_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    input_path = Column(Text)
    ds_job_id = Column(UUID(as_uuid=True))
    job_status = Column(String(32), nullable=False, default="queued", server_default="queued")
    step = Column(String(80))
    progress_done = Column(Integer, nullable=False, default=0, server_default="0")
    progress_total = Column(Integer, nullable=False, default=0, server_default="0")
    queue_position = Column(Integer)
    error_code = Column(String(100))
    error_message = Column(Text)
