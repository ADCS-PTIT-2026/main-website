import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.session import Base

class ProcessingAttempt(Base):
    __tablename__ = 'processing_attempts'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.document_id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), nullable=True)
    request_id = Column(String(64), nullable=False, index=True)
    status = Column(String(24), nullable=False, default='running')
    error = Column(JSONB(none_as_null=True))
    warnings = Column(JSONB(none_as_null=True))
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    finished_at = Column(DateTime(timezone=True))

