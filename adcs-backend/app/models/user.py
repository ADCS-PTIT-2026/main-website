from sqlalchemy import Column, String, Boolean
import uuid
from ..db.session import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    username = Column(String)
    password_hash = Column(String)
    role_id = Column(String)
    is_active = Column(Boolean, default=True)