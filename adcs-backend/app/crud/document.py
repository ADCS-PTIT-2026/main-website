from sqlalchemy.orm import Session
from app.models.document import Document

def create_document(db: Session, file_name: str, file_path: str):
    doc = Document(
        file_name=file_name,
        file_path=file_path,
        status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc