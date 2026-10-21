import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.session import Base


class IntegrationOutbox(Base):
    __tablename__ = "integration_outbox"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence = Column(Integer, nullable=False)
    document_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    operation = Column(String(20), nullable=False)
    payload = Column(JSONB, nullable=False)
    status = Column(String(24), nullable=False, default="pending")
    attempts = Column(Integer, nullable=False, default=0)
    available_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    error_code = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    __table_args__ = (UniqueConstraint("document_id", "sequence"),)


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind = Column(String(20), nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    priority = Column(Integer, nullable=False)
    status = Column(String(24), nullable=False, default="queued")
    lease_until = Column(DateTime(timezone=True))
    error_code = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CrawlerSourceMapping(Base):
    __tablename__ = "crawler_source_mappings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_name = Column(Text, nullable=False)
    section = Column(Text, nullable=False, default="")
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.department_id"), nullable=False)
    __table_args__ = (UniqueConstraint("source_name", "section"),)
