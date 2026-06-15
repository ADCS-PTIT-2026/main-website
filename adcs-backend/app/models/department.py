from sqlalchemy import Column, Text, DateTime, ForeignKey, CheckConstraint, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db.session import Base


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    id = Column(Integer, unique=True, nullable=True) 

    name = Column(Text, nullable=False)
    code = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    ten_viet_tat = Column(Text, nullable=True)
    ten_hien_thi = Column(Text, nullable=True)
    loai_don_vi = Column(Text, nullable=True)
    cap_don_vi = Column(Text, nullable=True)
    level_number = Column(Integer, nullable=True)
    is_formal = Column(Boolean, nullable=True)
    has_seal = Column(Boolean, nullable=True)
    parent_name = Column(Text, nullable=True)
    child_count = Column(Integer, default=0)

    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sub_departments = relationship(
        "Department", 
        backref="parent_department", 
        remote_side=[id]
    )

    __table_args__ = (
        CheckConstraint(
            "parent_id IS NULL OR parent_id <> id",
            name="chk_no_self_parent"
        ),
    )