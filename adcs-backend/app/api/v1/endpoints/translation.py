from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, Query, Form
from fastapi.responses import FileResponse, StreamingResponse 
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.schemas.translation import UploadTranslationResponse, TranslationResponse, CommentUpdateRequest
from app.services import translation_service
from app.core.dependency import get_current_user

router = APIRouter()

@router.post("/upload", response_model=UploadTranslationResponse)
async def upload_for_translation(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    source_lang: str = Form("vi"),
    target_lang: str = Form("en"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return await translation_service.handle_translation_upload(
        files=files,
        user_id=current_user.user_id,
        db=db,
        background_tasks=background_tasks,
        source_lang=source_lang, target_lang=target_lang
    )

@router.get("/", response_model=List[TranslationResponse])
def get_translation_list(user_id: UUID | None = Query(None), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return translation_service.get_user_translation_list(db, current_user, user_id)

@router.get("/capabilities")
def translation_capabilities(current_user=Depends(get_current_user)):
    from app.core.data_service import enabled
    is_enabled = (
        enabled('DS_TRANSLATION_JOBS_ENABLED')
        and enabled('INTEGRATION_WORKER_ENABLED')
        and enabled('DS_JOB_IDEMPOTENCY_CONFIRMED')
    )
    msg = None if is_enabled else "Chức năng dịch tạm ngừng hoạt động do dịch vụ dữ liệu đang bảo trì hoặc chưa hoàn tất đồng bộ."
    return {"enabled": is_enabled, "message": msg}

@router.put("/{log_id}/comment")
def update_translation_comment_api(
    log_id: UUID,
    payload: CommentUpdateRequest, 
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return translation_service.update_translation_comment_service(db, log_id, payload.comment, current_user)

@router.delete("/{log_id}")
def delete_translation_api(log_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return translation_service.delete_translation_service(db, log_id, current_user)

@router.get("/{log_id}/download")
def download_translated_file(log_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Tải file kết quả dịch thuật."""
    
    file_path, original_filename = translation_service.get_download_file_info(db, log_id, current_user)
        
    return FileResponse(
        path=file_path, 
        filename=f"Translated_{original_filename}",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@router.get("/download-all/zip")
def download_all_translated_files(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Tải toàn bộ file đã dịch thành công dưới dạng .zip"""
    
    zip_buffer = translation_service.get_all_translated_files_zip(db, current_user)
    
    return StreamingResponse(
        zip_buffer, 
        media_type="application/zip", 
        headers={"Content-Disposition": "attachment; filename=Tat_ca_ban_dich_PTIT.zip"}
    )

@router.post("/{log_id}/cancel")
async def cancel_translation_api(log_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await translation_service.cancel_translation(db, log_id, current_user)
