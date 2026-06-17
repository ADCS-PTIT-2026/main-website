from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List
import hashlib

from app.db.session import get_db
from app.schemas.translation import UploadTranslationResponse, TranslationResponse, CommentUpdateRequest
from app.services.translation_service import process_translation_background
from app.core.dependency import get_current_user
from app.crud import translation as crud_translation

router = APIRouter()

def get_file_hash(content: bytes) -> str:
    return hashlib.md5(content).hexdigest()

@router.post("/upload", response_model=UploadTranslationResponse)
async def upload_for_translation(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.user_id

    existing_hashes = crud_translation.get_user_translation_hashes(db, user_id)
    
    duplicate_count = 0
    processed_files = []

    for file in files:
        content = await file.read()
        file_hash = get_file_hash(content)

        if file_hash in existing_hashes:
            duplicate_count += 1
            continue

        file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown'
        
        new_log = crud_translation.create_translation_log(
            db=db, 
            user_id=user_id, 
            filename=file.filename, 
            file_type=file_ext, 
            file_hash=file_hash
        )
        
        processed_files.append(new_log)
        existing_hashes.add(file_hash)

        background_tasks.add_task(
            process_translation_background,
            log_id=str(new_log.id),
            file_content=content,
            filename=file.filename,
            client_id=user_id
        )

    return {
        "message": "Đã tiếp nhận danh sách tài liệu",
        "duplicate_count": duplicate_count,
        "processed_files": processed_files
    }

@router.get("/", response_model=List[TranslationResponse])
def get_translation_list(user_id: str, db: Session = Depends(get_db)):
    return crud_translation.get_translation_logs_by_user(db, user_id)

@router.put("/{log_id}/comment")
def update_translation_comment_api(
    log_id: str, 
    payload: CommentUpdateRequest, 
    db: Session = Depends(get_db)
):
    log = crud_translation.get_translation_log_by_id(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")

    crud_translation.update_translation_comment(db, log, payload.comment)
    return {"message": "Đã lưu nhận xét thành công"}