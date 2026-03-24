from sqlalchemy.orm import Session
from app.models.document import Document, DocumentFile
from typing import Optional, Dict, Any

def create_document_entry(db: Session, source_id: Optional[str] = None) -> Document:
    """Tạo một bản ghi văn bản trống (envelope) để chờ nhận file và kết quả AI."""
    doc = Document(
        status="pending",
        source_id=source_id,
        is_chua_doc=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def create_document_file(db: Session, file_data: Dict[str, Any]) -> DocumentFile:
    """Lưu thông tin tệp tin vật lý vào bảng document_files."""
    db_file = DocumentFile(**file_data)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

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

def update_file_ocr_result(db: Session, file_id: str, ocr_text: str, status: str = "Completed") -> Optional[DocumentFile]:
    """Cập nhật kết quả OCR riêng cho từng file cụ thể."""
    db_file = db.query(DocumentFile).filter(DocumentFile.file_id == file_id).first()
    if db_file:
        db_file.ocr_text = ocr_text
        db_file.ocr_status = status
        db.commit()
        db.refresh(db_file)
    return db_file