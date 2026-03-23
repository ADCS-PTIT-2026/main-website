from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import UploadFile, HTTPException, status
from datetime import datetime
from app.utils.file_handler import save_file
from app.crud.document import create_document, get_document_by_id, update_document_ai_result

# giả lập AI service
def send_to_ai_service(file_path: str):
    print(f"[AI SERVICE] Processing file: {file_path}")

async def upload_document(db: Session, file: UploadFile):
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    try:
        file_path, file_name = await save_file(file)

        document = create_document(db, file_name, file_path)

        # gửi sang AI service
        send_to_ai_service(file_path)

        return document
    except SQLAlchemyError as e:
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
        updated_document = update_document_ai_result(db, document, payload)
        return updated_document
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi cơ sở dữ liệu khi cập nhật thông tin từ AI!"
        )