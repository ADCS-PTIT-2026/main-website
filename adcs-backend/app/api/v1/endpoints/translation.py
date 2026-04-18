from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List
import hashlib

from app.db.session import get_db
from app.models.translation import TranslationLog
from app.schemas.translation import UploadTranslationResponse, TranslationResponse, CommentUpdateRequest
from app.services.translation_service import process_translation_background
from app.core.dependency import get_current_user

router = APIRouter()

def get_file_hash(content: bytes) -> str:
    """Tạo mã băm MD5 để kiểm tra nội dung file có trùng lặp không."""
    return hashlib.md5(content).hexdigest()

@router.post("/upload", response_model=UploadTranslationResponse)
async def upload_for_translation(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Bước 1 & 2: Nhận file, lọc trùng lặp và đẩy vào tiến trình dịch."""
    user_id = current_user.user_id

    existing_logs = db.query(TranslationLog).filter(TranslationLog.user_id == user_id).all()
    existing_hashes = {log.file_hash for log in existing_logs if log.file_hash}
    
    duplicate_count = 0
    processed_files = []

    for file in files:
        content = await file.read()
        file_hash = get_file_hash(content)

        if file_hash in existing_hashes:
            duplicate_count += 1
            continue

        file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown'
        new_log = TranslationLog(
            user_id=user_id,
            filename=file.filename,
            file_type=file_ext,
            file_hash=file_hash,
            status="pending"
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
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
    """Lấy danh sách các file đang dịch/đã dịch để hiển thị lên bảng."""
    logs = db.query(TranslationLog).filter(TranslationLog.user_id == user_id).order_by(TranslationLog.created_at.desc()).all()
    return logs

@router.put("/{log_id}/comment")
def update_translation_comment(
    log_id: str, 
    payload: CommentUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Lưu nhận xét của người dùng vào Relational DB."""
    log = db.query(TranslationLog).filter(TranslationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")

    log.comment = payload.comment
    db.commit()
    
    return {"message": "Đã lưu nhận xét thành công"}