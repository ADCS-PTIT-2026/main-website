from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.session import get_db
from app.schemas.document import UploadResponse, AIResultUpdateRequest, AIResultUpdateResponse, DocumentResponse, DocumentAIResultResponse
from app.services.document_service import upload_document, receive_ai_result
from app.crud.document import get_document_by_id
from app.core.dependency import get_current_user
from app.models.user import User

router = APIRouter()

# 1. Lấy tài liệu
@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_detail(document_id: str, db: Session = Depends(get_db)):
    doc = get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return doc

# 2. upload tài liệu
@router.post("/upload", response_model=UploadResponse)
async def upload_file_api(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = await upload_document(db, file, user_id=current_user.user_id)
    return document

# 3. Cập nhật kết quả xử lý từ AI service
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

# 4. Lấy thông tin tài liệu
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