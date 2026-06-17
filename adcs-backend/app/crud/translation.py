from sqlalchemy.orm import Session
from app.models.translation import TranslationLog
from typing import List, Set

def get_user_translation_hashes(db: Session, user_id: str) -> Set[str]:
    """Lấy danh sách mã hash các file đã tải lên của user."""
    logs = db.query(TranslationLog.file_hash).filter(TranslationLog.user_id == user_id).all()
    return {log.file_hash for log in logs if log.file_hash}

def create_translation_log(db: Session, user_id: str, filename: str, file_type: str, file_hash: str) -> TranslationLog:
    """Tạo mới một bản ghi nhật ký dịch thuật."""
    new_log = TranslationLog(
        user_id=user_id,
        filename=filename,
        file_type=file_type,
        file_hash=file_hash,
        status="pending"
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

def get_translation_logs_by_user(db: Session, user_id: str) -> List[TranslationLog]:
    """Lấy danh sách dịch thuật sắp xếp mới nhất của user."""
    return db.query(TranslationLog).filter(TranslationLog.user_id == user_id)\
             .order_by(TranslationLog.created_at.desc()).all()

def get_translation_log_by_id(db: Session, log_id: str) -> TranslationLog:
    """Tìm bản ghi dịch thuật theo khóa chính (ID)."""
    return db.query(TranslationLog).filter(TranslationLog.id == log_id).first()

def update_translation_status(db: Session, log: TranslationLog, status: str, result_url: str = None) -> TranslationLog:
    """Cập nhật trạng thái tiến trình và link tải file kết quả."""
    log.status = status
    if result_url:
        log.result_file_url = result_url
    db.commit()
    db.refresh(log)
    return log

def update_translation_comment(db: Session, log: TranslationLog, comment: str) -> TranslationLog:
    """Cập nhật ghi chú/nhận xét của người dùng."""
    log.comment = comment
    db.commit()
    db.refresh(log)
    return log

def delete_translation_log(db: Session, log_id: str) -> bool:
    """Xóa bản ghi nhật ký dịch thuật."""
    log = get_translation_log_by_id(db, log_id)
    if log:
        db.delete(log)
        db.commit()
        return True
    return False