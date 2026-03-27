from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import UploadFile, HTTPException, status
from datetime import datetime
from app.utils.file_handler import save_file
from app.crud.document import get_document_by_id, create_document_entry, create_document_file, update_document_metadata, get_document_stats, get_recent_documents
import logging

# giả lập AI service
def send_to_ai_service(file_path: str):
    print(f"[AI SERVICE] Processing file: {file_path}")

async def upload_document(db: Session, file: UploadFile, user_id: str):
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    try:
        doc = create_document_entry(db)
        file_path, file_name = await save_file(file)

        file_info = {
            "document_id": doc.document_id,
            "file_name": file_name,
            "file_path": file_path,
            "size_bytes": file.size,
            "uploaded_by": user_id,
            "ocr_status": "Processing"
        }

        create_document_file(db, file_info)
        # gửi sang AI service
        send_to_ai_service(file_path)

        return doc
    
    except SQLAlchemyError as e:
        print(e)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống khi lưu tài liệu!"
        )

def receive_ai_result(db: Session, document_id: str, payload: dict):
    document = get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu (Document not found)")

    payload["updated_at"] = datetime.utcnow()
    if "status" not in payload:
        payload["status"] = "success"

    try:
        updated_document = update_document_metadata(db, document, payload)
        return updated_document
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi cơ sở dữ liệu khi cập nhật thông tin từ AI!"
        )
    
def get_dashboard_stats_service(db: Session):
    return get_document_stats(db)

def get_recent_documents_service(db: Session, limit: int):
    return get_recent_documents(db, limit=limit)