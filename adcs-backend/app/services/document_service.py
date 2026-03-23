from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from datetime import datetime
from app.utils.file_handler import save_file
from app.crud.document import create_document, get_document_by_id, update_document_ai_result

# giả lập AI service
def send_to_ai_service(file_path: str):
    print(f"[AI SERVICE] Processing file: {file_path}")


async def upload_document(db: Session, file: UploadFile):
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    # lưu file vật lý
    file_path, file_name = save_file(file)

    # lưu DB
    document = create_document(db, file_name, file_path)

    # gửi sang AI service (async hoặc background)
    send_to_ai_service(file_path)

    return {
        "document_id": str(document.document_id),
        "status": document.status
    }


def receive_ai_result(db: Session, document_id: str, payload: dict):
    document = get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = {
        "title": payload.get("title"),
        "document_number": payload.get("document_number"),
        "signed_date": payload.get("signed_date"),
        "document_type_id": payload.get("document_type_id"),
        "assigned_department_id": payload.get("assigned_department_id"),
        "assigned_user_id": payload.get("assigned_user_id"),
        "priority": payload.get("priority"),
        "confidence": payload.get("confidence"),
        "summary": payload.get("summary"),
        "status": payload.get("status", "success"),
        "updated_at": datetime.utcnow(),
    }

    updated_document = update_document_ai_result(db, document, update_data)

    return {
        "message": "AI result updated successfully",
        "document": updated_document
    }