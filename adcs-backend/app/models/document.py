import uuid
from sqlalchemy import Column, String, Date, DateTime, Integer, Float, Boolean
from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"
    
    # Định danh hệ thống
    document_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String, nullable=True)
    document_type_id = Column(String, nullable=True)
    assigned_department_id = Column(String, nullable=True)
    assigned_user_id = Column(String, nullable=True)

    # Các trường nghiệp vụ chi tiết
    so_den = Column(String(255), nullable=True)
    so_ky_hieu = Column(String(255), nullable=True)
    trich_yeu = Column(String, nullable=True)
    hinh_thuc = Column(String(100), nullable=True)
    loai_van_ban_text = Column(String(100), nullable=True)
    muc = Column(String(100), nullable=True)
    do_khan = Column(String(50), nullable=True)
    do_mat = Column(String(50), nullable=True)
    don_vi_ban_hanh = Column(String, nullable=True)
    ngay_van_ban = Column(Date, nullable=True)
    ngay_den = Column(DateTime(timezone=True), nullable=True)
    ngay_het_han = Column(Date, nullable=True)
    vai_tro = Column(String(100), nullable=True)

    # Trạng thái và AI
    status = Column(String, nullable=True)
    priority = Column(Integer, default=0)
    confidence = Column(Float, nullable=True)
    summary = Column(String, nullable=True)
    is_chua_doc = Column(Boolean, default=True)
    thong_tin_ky_so = Column(JSONB, nullable=True)

    # Metadata thời gian
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    files = relationship("DocumentFile", back_populates="document", cascade="all, delete-orphan")

class DocumentFile(Base):
    __tablename__ = "document_files"

    file_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.document_id", ondelete="CASCADE"))
    file_name = Column(String)
    file_path = Column(String)
    mime_type = Column(String)
    size_bytes = Column(BigInteger)
    page_count = Column(Integer)
    checksum = Column(String)
    
    # Các trường OCR
    ocr_status = Column(String(50), default="Pending")
    ocr_text = Column(Text)
    
    uploaded_by = Column(String, ForeignKey("users.user_id", ondelete="SET NULL"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ ngược lại với Document
    document = relationship("Document", back_populates="files")