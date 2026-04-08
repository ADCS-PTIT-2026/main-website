from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.document import Document
from app.models.user import User
from typing import Optional, Dict, Any

def create_document_entry(db: Session, user_id: Optional[str] = None) -> Document:
    """Tạo một bản ghi văn bản trống (envelope) để chờ nhận file và kết quả AI."""
    doc = Document(
        status="pending",
        uploaded_by_user_id=user_id,
        is_chua_doc=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document_by_id(db: Session, document_id: str) -> Optional[Document]:
    """Lấy thông tin văn bản kèm theo danh sách các file đính kèm."""
    return db.query(Document).filter(Document.document_id == str(document_id)).first()

def update_document_metadata(db: Session, document: Document, data: Dict[str, Any]) -> Document:
    """Cập nhật các trường nghiệp vụ (so_den, trich_yeu, summary...) cho bản ghi Document."""
    for field, value in data.items():
        if hasattr(document, field) and value is not None:
            setattr(document, field, value)

    db.add(document)
    db.commit()
    db.refresh(document)
    return document

def get_document_stats(db: Session) -> dict:
    """Truy vấn thống kê tổng quan cho Dashboard"""
    total_docs = db.query(Document).count()
    
    pending_docs = db.query(Document).filter(Document.status == 'pending').count()
    
    avg_confidence = db.query(func.avg(Document.confidence)).scalar() or 0.0
    ai_accuracy = round(avg_confidence * 100, 1) if avg_confidence <= 1.0 else round(avg_confidence, 1)
    
    new_users = db.query(User).filter(User.is_active == True).count()

    return {
        "total_documents": total_docs,
        "pending_documents": pending_docs,
        "ai_accuracy": ai_accuracy,
        "new_users": new_users
    }

def get_documents(db: Session, limit: int = None):
    """Lấy danh sách các tài liệu"""
    if limit:
        return db.query(Document).order_by(Document.updated_at.desc()).limit(limit).all()
    else:
        return db.query(Document).order_by(Document.updated_at.desc()).all()