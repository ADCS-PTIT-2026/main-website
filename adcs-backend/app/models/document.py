import uuid
from sqlalchemy import Column, String, Date, DateTime, Integer, Float, Boolean
from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"
    
    # --- Định danh hệ thống ---
    document_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    assigned_department_id = Column(String, nullable=True)
    uploaded_by_user_id = Column(String, nullable=True)

    # --- Thông tin trích xuất chi tiết (từ extracted_fields) ---
    so_den = Column(String(255), nullable=True)
    so_ky_hieu = Column(String(255), nullable=True) # so_hieu_van_ban
    trich_yeu = Column(Text, nullable=True)
    hinh_thuc = Column(String(100), nullable=True)
    loai_van_ban_text = Column(String(100), nullable=True) # nhan
    don_vi_ban_hanh = Column(Text, nullable=True) # co_quan_ban_hanh
    nguoi_ky = Column(String(255), nullable=True)
    chuc_vu_nguoi_ky = Column(String(255), nullable=True)
    ngay_van_ban = Column(Date, nullable=True) # ngay_ban_hanh
    ngay_den = Column(DateTime(timezone=True), nullable=True)
    ngay_het_han = Column(Date, nullable=True)
    do_khan = Column(String(50), nullable=True)
    
    # Các trường danh sách trích xuất từ AI
    noi_nhan = Column(JSONB, nullable=True) # string[]
    can_cu_phap_ly = Column(JSONB, nullable=True) # string[]
    yeu_cau_han_dong = Column(Text, nullable=True)

    # --- Kết quả phân tích AI & Trạng thái ---
    status = Column(String, nullable=True)
    summary = Column(Text, nullable=True) # tom_tat
    key_points = Column(JSONB, nullable=True) # string[]
    confidence = Column(Float, nullable=True) # diem_tin_cay tổng
    muc_tin_cay = Column(String(50), nullable=True) # high, medium...
    
    # Lưu nguyên trạng đề xuất để Frontend dễ hiển thị
    de_xuat_xu_ly = Column(JSONB, nullable=True) # de_xuat_thoi_han_xu_ly object
    goi_y_phong_ban = Column(JSONB, nullable=True) # goi_y_phong_ban object
    
    # Metadata vận hành AI
    tong_so_chunk = Column(Integer, nullable=True)
    processing_time = Column(Float, nullable=True)
    is_chua_doc = Column(Boolean, default=True)
    thong_tin_ky_so = Column(JSONB, nullable=True)

    # --- Metadata thời gian ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
