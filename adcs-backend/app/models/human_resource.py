import uuid
from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base

class HumanResource(Base):
    __tablename__ = "human_resources"

    human_resource_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    id = Column(Integer, unique=True, nullable=False)
    
    name = Column(Text, nullable=False)
    login = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    ma_can_bo = Column(Text, nullable=True)
    ten_hien_thi = Column(Text, nullable=True)
    chuc_danh = Column(Text, nullable=True)
    oauth_uid = Column(Text, nullable=True)
    is_role_qlvb = Column(Boolean, default=False)
    active = Column(Boolean, default=True)

    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    department = relationship("Department", backref="employees")