from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.document import UploadResponse, AIResultUpdateRequest, AIResultUpdateResponse, DocumentResponse, DocumentAIResultResponse
from app.services.document_service import upload_document, receive_ai_result
from app.crud.document import get_document_by_id

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_detail(document_id: str, db: Session = Depends(get_db)):
    doc = get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return doc

@router.post("/upload", response_model=UploadResponse)
async def upload_file_api(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    document = await upload_document(db, file)
    return document

@router.put("/{document_id}/ai-result", response_model=AIResultUpdateResponse)
def update_ai_result_api(
    document_id: str,
    request: AIResultUpdateRequest,
    db: Session = Depends(get_db)
):
    # Lấy các field thực sự được request cập nhật (bỏ qua None)
    update_data = request.model_dump(exclude_unset=True)
    
    updated_doc = receive_ai_result(db, document_id, update_data)

    return {
        "message": "AI result updated successfully",
        "document": updated_doc
    }

@router.get("/{document_id}/ai-result", response_model=DocumentAIResultResponse)
def get_document_ai_result(
    document_id: str, 
    db: Session = Depends(get_db)
):
    doc = get_document_by_id(db, document_id)
    
    if not doc:
        raise HTTPException(
            status_code=404, 
            detail="Không tìm thấy tài liệu (Document not found)"
        )
    
    return doc