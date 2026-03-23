from sqlalchemy import Column, String, Date, DateTime, Integer, Float, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(String, primary_key=True, index=True)

    source_id = Column(String, nullable=True)
    title = Column(String, nullable=True)
    document_number = Column(String, nullable=True)
    signed_date = Column(Date, nullable=True)
    received_date = Column(DateTime, nullable=True)

    document_type_id = Column(String, nullable=True)
    assigned_department_id = Column(String, nullable=True)
    assigned_user_id = Column(String, nullable=True)

    priority = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)
    summary = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    file_name = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    status = Column(String, default="pending")