from fastapi import APIRouter, Depends, Query
from app.services.history_service import (
    fetch_processing_history,
    fetch_history_detail,
    send_history_telegram_notification,
    fetch_document_processing_detail,
    send_document_telegram_notification
)
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.core.dependency import get_current_user 
from app.models.user import User

router = APIRouter()

@router.get("")
async def get_history_api(
    limit: int = Query(10, ge=1, le=100, description="Số lượng bản ghi trên một trang"),
    search: str = Query(None, description="Từ khóa tìm kiếm tài liệu"),
    action: str = Query(None, description="Lọc theo hành động (Tải lên, Xử lý AI, Xóa)"),
    time_filter: str = Query(None, description="Lọc theo thời gian (7 ngày qua, Tháng này...)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách lịch sử xử lý tài liệu (Có hỗ trợ phân trang và bộ lọc).
    - Với User thường: Chỉ hiển thị lịch sử của chính user đó.
    - Với Admin: Hiển thị toàn bộ lịch sử hệ thống.
    """
    data = await fetch_processing_history(
        limit=limit,
        search=search,
        action=action,
        time_filter=time_filter,
        user=current_user,
        db=db
    )
    return data

@router.get("/document/{document_id}/detail")
async def get_document_history_detail_api(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết một tài liệu dưới dạng ProcessingDetail (dùng cho Bảng điều khiển Dashboard).
    """
    return await fetch_document_processing_detail(document_id, db, current_user)

@router.post("/document/{document_id}/send-telegram")
async def send_document_telegram_api(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Gửi thông báo kết quả chi tiết của tài liệu tới Telegram của người dùng.
    """
    return await send_document_telegram_notification(document_id, current_user, db)

@router.get("/{history_id}/detail")
async def get_history_detail_api(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết kết quả của một lượt xử lý tài liệu trong lịch sử.
    """
    return await fetch_history_detail(history_id, db)

@router.post("/{history_id}/send-telegram")
async def send_history_telegram_api(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Gửi thông báo kết quả xử lý của một lượt trong lịch sử tới Telegram của người dùng.
    """
    return await send_history_telegram_notification(history_id, current_user, db)