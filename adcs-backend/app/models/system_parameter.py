from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class SystemParameter(Base):
    __tablename__ = "system_parameters"

    param_key = Column(String, primary_key=True, index=True)
    param_value = Column(String, nullable=True)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())