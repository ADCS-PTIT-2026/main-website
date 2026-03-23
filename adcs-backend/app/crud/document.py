from sqlalchemy.orm import Session
from app.models.document import Document

def create_document(db: Session, file_name: str, file_path: str) -> Document:
    doc = Document(
        file_name=file_name,
        file_path=file_path,
        status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def get_document_by_id(db: Session, document_id: str) -> Document | None:
    return db.query(Document).filter(Document.document_id == str(document_id)).first()

def update_document_ai_result(db: Session, document: Document, data: dict) -> Document:
    for field, value in data.items():
        if hasattr(document, field):
            setattr(document, field, value)

    db.add(document)
    db.commit()
    db.refresh(document)
    return document