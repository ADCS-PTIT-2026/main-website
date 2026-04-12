from fastapi import APIRouter, Depends, Query
from app.services.history_service import fetch_processing_history
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.core.dependency import get_current_user 
from app.models.user import User

router = APIRouter()

@router.get("")
def get_history_api(
    limit: int = Query(10, ge=1, le=100, description="Số lượng bản ghi trên một trang"),
    search: str = Query(None, description="Từ khóa tìm kiếm tài liệu"),
    action: str = Query(None, description="Lọc theo hành động (Tải lên, Xử lý AI, Xóa)"),
    time_filter: str = Query(None, description="Lọc theo thời gian (7 ngày qua, Tháng này...)"),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách lịch sử xử lý tài liệu (Có hỗ trợ phân trang và bộ lọc).
    """

    
    data = fetch_processing_history(
        limit=limit,
        search=search,
        action=action,
        time_filter=time_filter
    )
    
    return data