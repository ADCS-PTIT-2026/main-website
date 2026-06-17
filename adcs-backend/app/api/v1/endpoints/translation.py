from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.translation import UploadTranslationResponse, TranslationResponse, CommentUpdateRequest
from app.services import translation_service
from app.core.dependency import get_current_user

router = APIRouter()

@router.post("/upload", response_model=UploadTranslationResponse)
async def upload_for_translation(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return await translation_service.handle_translation_upload(
        files=files,
        user_id=current_user.user_id,
        db=db,
        background_tasks=background_tasks
    )

@router.get("/", response_model=List[TranslationResponse])
def get_translation_list(user_id: str, db: Session = Depends(get_db)):
    return translation_service.get_user_translation_list(db, user_id)

@router.put("/{log_id}/comment")
def update_translation_comment_api(
    log_id: str, 
    payload: CommentUpdateRequest, 
    db: Session = Depends(get_db)
):
    return translation_service.update_translation_comment_service(db, log_id, payload.comment)

@router.delete("/{log_id}")
def delete_translation_api(log_id: str, db: Session = Depends(get_db)):
    return translation_service.delete_translation_service(db, log_id)