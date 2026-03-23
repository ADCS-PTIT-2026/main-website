from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.document import UploadResponse, AIResultUpdateRequest, AIResultUpdateResponse, DocumentResponse
from app.services.document_service import upload_document, receive_ai_result
from app.crud.document import get_document_by_id

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{document_id}")
def get_document_detail(document_id: str, db: Session = Depends(get_db)):
    doc = get_document_by_id(db, document_id)
    if not doc:
        return {"detail": "Document not found"}

    return {
        "document_id": doc.document_id,
        "title": doc.title,
        "document_number": doc.document_number,
        "signed_date": doc.signed_date,
        "assigned_department_id": doc.assigned_department_id,
        "assigned_user_id": doc.assigned_user_id,
        "priority": doc.priority,
        "confidence": doc.confidence,
        "summary": doc.summary,
        "status": doc.status,
        "updated_at": doc.updated_at,
    }


@router.post("/upload", response_model=UploadResponse)
async def upload_file_api(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return await upload_document(db, file)

@router.put("/{document_id}/ai-result", response_model=AIResultUpdateResponse)
def update_ai_result_api(
    document_id: str,
    request: AIResultUpdateRequest,
    db: Session = Depends(get_db)
):
    result = receive_ai_result(db, document_id, request.dict())
    doc = result["document"]

    return {
        "message": result["message"],
        "document": {
            "document_id": doc.document_id,
            "title": doc.title,
            "document_number": doc.document_number,
            "signed_date": doc.signed_date,
            "assigned_department_id": doc.assigned_department_id,
            "assigned_user_id": doc.assigned_user_id,
            "priority": doc.priority,
            "confidence": doc.confidence,
            "summary": doc.summary,
            "status": doc.status,
            "updated_at": doc.updated_at,
        }
    }