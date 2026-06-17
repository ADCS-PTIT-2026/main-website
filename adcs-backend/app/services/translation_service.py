import httpx
import asyncio
import hashlib
import os
from fastapi import BackgroundTasks, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv

from app.db.session import SessionLocal
from app.core.document_websocket import manager
from app.crud import translation as crud_translation
from app.core.logger import logger

load_dotenv()
DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")
DATA_SERVICE_TRANSLATE_URL = f"{DATA_SERVICE_URL}/api/v1/translate"

def get_file_hash(content: bytes) -> str:
    """Tạo mã băm MD5 để kiểm tra nội dung file có trùng lặp không."""
    return hashlib.md5(content).hexdigest()

async def handle_translation_upload(
    files: List[UploadFile],
    user_id: str,
    db: Session,
    background_tasks: BackgroundTasks
):
    """Xử lý logic tải file lên, kiểm tra trùng lặp và đẩy vào hàng đợi dịch thuật."""
    logger.info(f"Bắt đầu xử lý upload {len(files)} file dịch thuật cho user_id: {user_id}")
    
    existing_hashes = crud_translation.get_user_translation_hashes(db, user_id)
    
    duplicate_count = 0
    processed_files = []

    for file in files:
        content = await file.read()
        file_hash = get_file_hash(content)

        if file_hash in existing_hashes:
            duplicate_count += 1
            logger.info(f"Bỏ qua file trùng lặp: {file.filename} (Hash: {file_hash})")
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
        
        logger.info(f"Đã tạo bản ghi dịch thuật: {new_log.id} cho file {file.filename}")

        background_tasks.add_task(
            process_translation_background,
            log_id=str(new_log.id),
            file_content=content,
            filename=file.filename,
            client_id=user_id
        )

    logger.info(f"Hoàn tất upload cho user_id {user_id}. Thành công: {len(processed_files)}, Trùng lặp: {duplicate_count}")
    return {
        "message": "Đã tiếp nhận danh sách tài liệu",
        "duplicate_count": duplicate_count,
        "processed_files": processed_files
    }

def get_user_translation_list(db: Session, user_id: str):
    """Lấy danh sách bản dịch của user."""
    logger.info(f"Truy vấn danh sách dịch thuật cho user_id: {user_id}")
    return crud_translation.get_translation_logs_by_user(db, user_id)

def update_translation_comment_service(db: Session, log_id: str, comment: str):
    """Cập nhật nhận xét cho bản dịch."""
    log = crud_translation.get_translation_log_by_id(db, log_id)
    if not log:
        logger.warning(f"Thất bại khi cập nhật nhận xét: Không tìm thấy log_id {log_id}")
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")

    crud_translation.update_translation_comment(db, log, comment)
    logger.info(f"Đã cập nhật nhận xét thành công cho log_id: {log_id}")
    return {"message": "Đã lưu nhận xét thành công"}

def delete_translation_service(db: Session, log_id: str):
    """Xóa bản ghi dịch thuật."""
    log = crud_translation.get_translation_log_by_id(db, log_id)
    if not log:
        logger.warning(f"Thất bại khi xóa: Không tìm thấy log_id {log_id}")
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
    
    crud_translation.delete_translation_log(db, log_id)
    logger.info(f"Đã xóa thành công bản ghi dịch thuật log_id: {log_id}")
    return {"message": "Đã xóa tài liệu thành công"}

async def process_translation_background(log_id: str, file_content: bytes, filename: str, client_id: str):
    """Background Task: Giao tiếp với Data Service để dịch thuật."""
    db = SessionLocal()
    logger.info(f"[Background Task] Bắt đầu xử lý dịch thuật cho log_id: {log_id} ({filename})")
    
    try:
        log = crud_translation.get_translation_log_by_id(db, log_id)
        if not log: 
            logger.error(f"[Background Task] Không tìm thấy log_id {log_id} trong DB")
            return

        crud_translation.update_translation_status(db, log, status="translating")

        async with httpx.AsyncClient(timeout=600.0) as client:
            files = {"file": (filename, file_content)}
            data = {"source_lang": log.source_language, "target_lang": log.target_language}
            
            logger.info(f"[Background Task] Đang gửi {filename} sang Data Service...")
            response = await client.post(DATA_SERVICE_TRANSLATE_URL, files=files, data=data)
            response.raise_for_status()
            
            res_data = response.json()
            result_url = res_data.get("download_url")

        await asyncio.sleep(5) 
        result_url = f"/static/downloads/translated_{log_id}.docx"

        crud_translation.update_translation_status(db, log, status="success", result_url=result_url)
        logger.info(f"[Background Task] Hoàn tất dịch thuật log_id: {log_id}. Trạng thái: success")

        await manager.send_personal_message({"type": "TRANSLATION_SUCCESS", "id": log_id}, client_id)

    except httpx.HTTPStatusError as e:
        logger.error(f"[Background Task] Lỗi HTTP từ Data Service (log_id: {log_id}): {e.response.status_code} - {e.response.text}")
        log = crud_translation.get_translation_log_by_id(db, log_id)
        if log:
            crud_translation.update_translation_status(db, log, status="failed")
    except Exception as e:
        logger.error(f"[Background Task] Lỗi hệ thống khi xử lý dịch thuật (log_id: {log_id}): {str(e)}", exc_info=True)
        log = crud_translation.get_translation_log_by_id(db, log_id)
        if log:
            crud_translation.update_translation_status(db, log, status="failed")
    finally:
        db.close()