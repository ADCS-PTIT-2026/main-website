from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text, case
from fastapi import HTTPException
from app.models.document import Document
from app.models.user import User
from app.models.role_permission import Role
from typing import Optional, Dict, Any, List
import uuid
from uuid import UUID
from datetime import datetime

def build_document_scope_query(db: Session, user: Optional[User] = None):
    """
    Xây dựng query Document lọc theo scope người dùng:
    - Nếu không có user hoặc user là admin: xem toàn bộ.
    - Nếu user có phòng ban: xem văn bản do mình upload HOẶC được gán cho phòng ban của mình.
    - Nếu user không có phòng ban: chỉ xem văn bản do mình upload.
    """
    query = db.query(Document)
    if not user:
        return query

    role_name = getattr(user, "role_name", None)
    if role_name == "admin":
        return query

    conditions = [Document.uploaded_by_user_id == str(user.user_id)]
    if user.department_id:
        conditions.append(Document.assigned_department_id == str(user.department_id))

    return query.filter(or_(*conditions))

def can_user_access_document(document: Document, user: User) -> bool:
    """Kiểm tra người dùng có quyền truy cập văn bản cụ thể hay không."""
    if not user:
        return False
    if getattr(user, "role_name", None) == "admin":
        return True
    
    # Người upload có toàn quyền truy cập
    if str(document.uploaded_by_user_id) == str(user.user_id):
        return True
    
    # Người cùng phòng ban được gán
    if user.department_id and str(document.assigned_department_id) == str(user.department_id):
        return True
        
    return False

def create_queued_document(
    db: Session,
    user_id: str,
    original_filename: str,
    file_path: str,
    file_size_bytes: int,
    page_count: int = 1,
    priority: int = 1
) -> Document:
    """Tạo một bản ghi văn bản mới với trạng thái queued đưa vào hàng đợi."""
    doc = Document(
        document_id=uuid.uuid4(),
        status="queued",
        uploaded_by_user_id=user_id,
        original_filename=original_filename,
        file_path=file_path,
        file_size_bytes=file_size_bytes,
        page_count=page_count,
        priority=priority,
        retry_count=0,
        is_chua_doc=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def count_user_pending_documents(db: Session, user_id: str) -> int:
    """Đếm số lượng văn bản đang trong hàng đợi hoặc đang xử lý của một người dùng."""
    return db.query(Document).filter(
        Document.uploaded_by_user_id == str(user_id),
        Document.status.in_(["queued", "processing", "pending"])
    ).count()

def claim_next_document_for_processing(db: Session) -> Optional[Document]:
    """
    Lấy và khóa 1 văn bản có độ ưu tiên cao nhất, chờ lâu nhất trong hàng đợi
    sử dụng PostgreSQL FOR UPDATE SKIP LOCKED để tránh xung đột giữa các worker.
    """
    sql = text("""
        SELECT document_id FROM documents
        WHERE status = 'queued' AND retry_count < 3
        ORDER BY priority ASC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    """)
    result = db.execute(sql).fetchone()
    if not result:
        return None

    doc_id = result[0]
    doc = db.query(Document).filter(Document.document_id == doc_id).first()
    if doc:
        doc.status = "processing"
        doc.processing_started_at = datetime.utcnow()
        db.commit()
        db.refresh(doc)
        return doc
    return None

def recover_interrupted_documents(db: Session) -> int:
    """
    Khôi phục các văn bản bị kẹt trạng thái 'processing' do server restart.
    Chuyển lại về 'queued' nếu retry_count < 3, nếu quá 3 lần thì đánh dấu 'failed'.
    """
    stuck_docs = db.query(Document).filter(Document.status == "processing").all()
    count = 0
    for doc in stuck_docs:
        doc.retry_count = (doc.retry_count or 0) + 1
        if doc.retry_count < 3:
            doc.status = "queued"
            doc.error_message = "Tiến trình bị ngắt do khởi động lại hệ thống, tự động xếp hàng thử lại."
        else:
            doc.status = "failed"
            doc.error_message = "Quá số lần thử lại tối đa sau sự cố hệ thống."
        count += 1
    db.commit()
    return count

def get_document_by_id(db: Session, document_id: str) -> Optional[Document]:
    """Lấy thông tin văn bản theo ID."""
    return db.query(Document).filter(Document.document_id == str(document_id)).first()

def update_document_metadata(db: Session, document: Document, data: Dict[str, Any]) -> Document:
    """Cập nhật các trường nghiệp vụ cho bản ghi Document."""
    for field, value in data.items():
        if hasattr(document, field) and value is not None:
            setattr(document, field, value)

    db.add(document)
    db.commit()
    db.refresh(document)
    return document

def get_document_stats(db: Session, user: Optional[User] = None) -> dict:
    """Truy vấn thống kê tổng quan lọc theo quyền của người dùng"""
    query = build_document_scope_query(db, user)
    
    total_docs = query.count()
    pending_docs = query.filter(Document.status.in_(["pending", "queued", "processing"])).count()
    
    avg_confidence = query.with_entities(func.avg(Document.confidence)).scalar() or 0.0
    ai_accuracy = round(avg_confidence * 100, 1) if avg_confidence <= 1.0 else round(avg_confidence, 1)
    
    new_users = db.query(User).filter(User.is_active == True).count()

    return {
        "total_documents": total_docs,
        "pending_documents": pending_docs,
        "ai_accuracy": ai_accuracy,
        "new_users": new_users
    }

def get_documents(db: Session, limit: int = None, user: Optional[User] = None):
    """Lấy danh sách các tài liệu theo phạm vi quyền của user"""
    query = build_document_scope_query(db, user).order_by(Document.created_at.desc())
    if limit:
        return query.limit(limit).all()
    return query.all()
    
def delete_document(db: Session, document: Document):
    db.delete(document)
    db.commit()

def get_my_documents(
    db: Session,
    user_id: UUID,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None
) -> dict:
    """Lấy danh sách các tài liệu do chính user tải lên kèm vị trí hàng đợi"""
    query = db.query(Document).filter(Document.uploaded_by_user_id == user_id)

    if status and status.strip() != "" and status.lower() != "all":
        query = query.filter(Document.status == status.strip().lower())

    if search and search.strip() != "":
        s = f"%{search.strip()}%"
        query = query.filter(
            (Document.original_filename.ilike(s)) |
            (Document.trich_yeu.ilike(s)) |
            (Document.so_ky_hieu.ilike(s)) |
            (Document.don_vi_ban_hanh.ilike(s))
        )

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    # Ưu tiên các tài liệu đang chờ hoặc đang xử lý lên đầu, sau đó theo created_at giảm dần
    documents = query.order_by(
        case(
            (Document.status == "processing", 1),
            (Document.status == "queued", 2),
            else_=3
        ),
        Document.created_at.desc()
    ).offset(offset).limit(page_size).all()

    items = []
    for doc in documents:
        queue_pos = None
        if doc.status == "queued":
            # Tính vị trí của tài liệu này trong hàng đợi
            queue_pos = db.query(func.count(Document.document_id)).filter(
                Document.status == "queued",
                (Document.priority < doc.priority) |
                ((Document.priority == doc.priority) & (Document.created_at <= doc.created_at))
            ).scalar() or 1

        items.append({
            "document_id": doc.document_id,
            "original_filename": doc.original_filename or f"tailieu_{str(doc.document_id)[:8]}.pdf",
            "file_size_bytes": doc.file_size_bytes,
            "page_count": doc.page_count,
            "status": doc.status,
            "queue_position": queue_pos,
            "priority": doc.priority or 1,
            "retry_count": doc.retry_count or 0,
            "error_message": doc.error_message,
            "so_ky_hieu": doc.so_ky_hieu,
            "trich_yeu": doc.trich_yeu,
            "don_vi_ban_hanh": doc.don_vi_ban_hanh,
            "loai_van_ban_text": doc.loai_van_ban_text,
            "summary": doc.summary,
            "confidence": doc.confidence,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

def retry_my_document(db: Session, document_id: UUID, user: User) -> Document:
    """Thử lại xử lý văn bản bị lỗi"""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu!")

    # Kiểm tra quyền: chỉ chủ sở hữu hoặc admin
    is_admin = False
    if user.role_id:
        role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
        if role and role.name.lower() == "admin":
            is_admin = True

    if not is_admin and doc.uploaded_by_user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện lại xử lý cho tài liệu này!")

    if doc.status not in ["failed", "error"]:
        raise HTTPException(status_code=400, detail="Chỉ có thể thử lại các văn bản đang ở trạng thái lỗi (failed)!")

    doc.status = "queued"
    doc.retry_count = 0
    doc.error_message = None
    doc.processing_started_at = None
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc

def cancel_my_document(db: Session, document_id: UUID, user: User) -> Document:
    """Hủy văn bản đang chờ trong hàng đợi"""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu!")

    is_admin = False
    if user.role_id:
        role = db.query(Role).filter(Role.role_id == str(user.role_id)).first()
        if role and role.name.lower() == "admin":
            is_admin = True

    if not is_admin and doc.uploaded_by_user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền hủy tài liệu này!")

    if doc.status != "queued":
        raise HTTPException(status_code=400, detail="Chỉ có thể hủy văn bản khi đang ở trạng thái chờ trong hàng đợi (queued)!")

    doc.status = "failed"
    doc.error_message = "Đã hủy bởi người dùng"
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc