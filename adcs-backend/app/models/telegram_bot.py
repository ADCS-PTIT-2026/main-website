import uuid
from sqlalchemy import Column, String, Boolean
from app.db.session import Base

class Bot(Base):
    __tablename__ = "bots"

    bot_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True)
    token = Column(String)
    channel_type = Column(String)