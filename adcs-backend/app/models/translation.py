import uuid
from sqlalchemy import Column, String, DateTime, Text
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