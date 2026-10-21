import io
import zipfile
import hashlib
import os
from pathlib import Path
from fastapi import HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.crud import translation as crud_translation
from app.core.logger import logger
from app.core.authorization import is_system_admin

load_dotenv()

def get_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


async def handle_translation_upload(files, user_id, db, background_tasks=None, source_lang="vi", target_lang="en"):
    from uuid import uuid4
    from sqlalchemy import text
    from app.core.data_service import enabled
    from app.models.translation import TranslationLog
    from app.services.integration_service import enqueue_processing
    if not enabled('DS_TRANSLATION_JOBS_ENABLED') or not enabled('INTEGRATION_WORKER_ENABLED') or not enabled('DS_JOB_IDEMPOTENCY_CONFIRMED'):
        raise HTTPException(503, 'Dịch bất đồng bộ chưa được bật hoặc chưa xác nhận hợp đồng chống tạo job lặp')
    languages = {'vi', 'en', 'zh', 'fr', 'ru'}
    if source_lang not in languages | {'auto'} or target_lang not in languages or source_lang == target_lang:
        raise HTTPException(422, 'Ngôn ngữ nguồn/đích không hợp lệ')
    root = Path(os.getenv('TRANSLATION_INPUT_DIR', '/mnt/data2tb/adcs/uploads/translations')).resolve()
    root.mkdir(parents=True, exist_ok=True)
    processed, duplicates, written = [], 0, []
    try:
        # Serializes same-user concurrent uploads; uniqueness includes language pair.
        db.execute(text('SELECT pg_advisory_xact_lock(hashtext(:user))'), {'user': 'translation:'+str(user_id)})
        for file in files:
            content = await file.read(int(os.getenv('TRANSLATION_MAX_BYTES', '52428800')) + 1)
            if not content or len(content) > int(os.getenv('TRANSLATION_MAX_BYTES', '52428800')):
                raise HTTPException(413, 'Tệp rỗng hoặc vượt giới hạn dung lượng')
            ext = Path(file.filename or '').suffix.lower()
            if ext not in {'.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'}:
                raise HTTPException(422, 'Định dạng tệp không được hỗ trợ')
            digest = get_file_hash(content)
            db.flush()
            duplicate = db.query(TranslationLog).filter_by(user_id=str(user_id), file_hash=digest,
                source_language=source_lang, target_language=target_lang).filter(TranslationLog.status.notin_(['failed', 'cancelled'])).first()
            if duplicate:
                duplicates += 1
                continue
            ref = uuid4()
            path = root / f'{ref}{ext}'
            path.write_bytes(content)
            path.chmod(0o600)
            written.append(path)
            log = TranslationLog(id=ref, user_id=user_id, filename=Path(file.filename).name, file_type=ext[1:],
                file_hash=digest, source_language=source_lang, target_language=target_lang, input_path=str(path), status='pending', job_status='queued')
            db.add(log)
            enqueue_processing(db, ref, kind='translation', priority=2)
            processed.append(log)
        db.commit()
    except Exception:
        db.rollback()
        for path in written:
            path.unlink(missing_ok=True)
        raise
    return {'message': 'Đã tiếp nhận tài liệu vào hàng đợi', 'duplicate_count': duplicates, 'processed_files': processed}


async def cancel_translation(db, log_id, current_user):
    from app.core.data_service import data_service
    from app.models.integration import ProcessingJob
    log = _authorized_translation_log(db, log_id, current_user)
    job = db.query(ProcessingJob).filter_by(reference_id=log.id).with_for_update().first()
    if not job or job.status not in ('queued', 'processing', 'retry_wait'):
        raise HTTPException(409, 'Chỉ hủy được bản dịch đang chờ')
    if log.ds_job_id:
        await data_service.post(f'/api/v1/translate/jobs/{log.ds_job_id}/cancel')
    elif job.status != 'queued':
        raise HTTPException(409, 'Job đang được gửi; vui lòng thử lại sau khi có trạng thái')
    log.status = log.job_status = 'cancelled'
    job.status = 'cancelled'
    db.commit()
    return {'message': 'Đã hủy bản dịch'}

def get_user_translation_list(db: Session, current_user, user_id=None):
    """Lấy danh sách bản dịch của user."""
    target = str(user_id) if user_id else str(current_user.user_id)
    if target != str(current_user.user_id) and not is_system_admin(current_user):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem bản dịch của tài khoản này")
    return crud_translation.get_translation_logs_by_user(db, target)


def _authorized_translation_log(db: Session, log_id, current_user):
    log = crud_translation.get_translation_log_by_id(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
    if str(log.user_id) != str(current_user.user_id) and not is_system_admin(current_user):
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập bản dịch này")
    return log

def update_translation_comment_service(db: Session, log_id: str, comment: str, current_user):
    """Cập nhật nhận xét cho bản dịch."""
    log = _authorized_translation_log(db, log_id, current_user)
    if not log:
        logger.warning(f"Thất bại khi cập nhật nhận xét: Không tìm thấy log_id {log_id}")
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")

    crud_translation.update_translation_comment(db, log, comment)
    logger.info(f"Đã cập nhật nhận xét thành công cho log_id: {log_id}")
    return {"message": "Đã lưu nhận xét thành công"}

def delete_translation_service(db: Session, log_id: str, current_user):
    """Xóa bản ghi dịch thuật."""
    log = _authorized_translation_log(db, log_id, current_user)
    if not log:
        logger.warning(f"Thất bại khi xóa: Không tìm thấy log_id {log_id}")
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
    
    from app.models.integration import ProcessingJob
    job = db.query(ProcessingJob).filter_by(reference_id=log.id).first()
    if job and job.status in ('queued', 'processing', 'retry_wait', 'needs_review'):
        raise HTTPException(409, 'Hãy hủy hoặc đối soát tác vụ trước khi xóa')
    if job:
        db.delete(job)
    crud_translation.delete_translation_log(db, log_id)
    logger.info(f"Đã xóa thành công bản ghi dịch thuật log_id: {log_id}")
    return {"message": "Đã xóa tài liệu thành công"}

def _download_path(value: str):
    root = Path(os.getenv("TRANSLATION_DOWNLOAD_DIR", "static/downloads")).resolve()
    path = Path(value.lstrip("/") if value.startswith("/static/downloads/") else value).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise HTTPException(status_code=404, detail="File kết quả không tồn tại")
    return str(path)


def get_download_file_info(db: Session, log_id: str, current_user):
    """Xử lý logic kiểm tra và lấy đường dẫn vật lý của file dịch thuật."""
    log = _authorized_translation_log(db, log_id, current_user)
    if not log or not log.result_file_url:
        logger.warning(f"Tải file thất bại: Không tìm thấy log_id {log_id} hoặc chưa có kết quả")
        raise HTTPException(status_code=404, detail="File kết quả chưa sẵn sàng hoặc không tồn tại")
    
    file_path = _download_path(log.result_file_url)
    
    if not os.path.exists(file_path):
        logger.error(f"Tải file thất bại: Không tìm thấy file vật lý tại {file_path}")
        raise HTTPException(status_code=404, detail="File vật lý không tồn tại trên máy chủ")
        
    return file_path, log.filename

def get_all_translated_files_zip(db: Session, current_user):
    """Gom tất cả các file đã dịch thành công của user thành 1 file ZIP trong bộ nhớ."""
    user_id = str(current_user.user_id)
    logs = crud_translation.get_translation_logs_by_user(db, user_id)
    
    success_logs = [log for log in logs if log.status == "success" and log.result_file_url]

    if not success_logs:
        logger.warning(f"Tải ZIP thất bại: User {user_id} không có file nào thành công.")
        raise HTTPException(status_code=404, detail="Không có tài liệu nào để tải về.")

    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for log in success_logs:
            try:
                file_path = _download_path(log.result_file_url)
            except HTTPException:
                continue
            
            if os.path.exists(file_path):
                safe_id = str(log.id)[:8]
                arcname = f"Translated_{safe_id}_{os.path.basename(log.filename)}"
                zip_file.write(file_path, arcname)
            else:
                logger.error(f"Lỗi khi nén ZIP: Không tìm thấy file vật lý {file_path}")

    zip_buffer.seek(0)
    return zip_buffer
