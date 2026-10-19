import os
import io
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, Form, WebSocket, WebSocketDisconnect, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.document import (
    UploadResponse,
    AIResultUpdateRequest,
    DocumentResponse,
    DashboardStatsResponse,
    ActionResponse,
    MyDocumentsListResponse,
    DocumentSearchResponse
)
from app.services.document_service import (
    get_dashboard_stats_service,
    get_recent_documents_service,
    get_all_documents,
    search_in_data_service,
    get_detail_document_in_data_service,
    delete_in_data_service,
    update_ai_result,
    search_documents_combined_service
)
from app.services.telegram_service import send_telegram_ai_result
from app.core.dependency import get_current_user, RoleChecker, PermissionChecker, require_permission
from app.models.user import User
from app.core.authorization import is_system_admin
from app.core.document_websocket import manager, is_uuid
from app.crud.document import (
    get_document_by_id,
    delete_document,
    can_user_access_document,
    create_queued_document,
    count_user_pending_documents,
    get_my_documents,
    retry_my_document,
    cancel_my_document
)
from app.services.document_queue_service import document_queue
from app.core.logger import request_id_var, logger

router = APIRouter()
require_role = RoleChecker(['admin'])

# 1. Lấy thông tin thống kê (Bắt buộc đăng nhập, lọc theo quyền của user)
@router.get("/stats", response_model=DashboardStatsResponse)
def get_document_stats_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    """API lấy dữ liệu thống kê tổng quát theo phạm vi quyền của người dùng"""
    return get_dashboard_stats_service(db, user=current_user)

# 2. Lấy tài liệu gần đây (Bắt buộc đăng nhập, chỉ thấy tài liệu của mình hoặc phòng mình)
@router.get("", response_model=List[DocumentResponse])
def get_documents_api(
    limit: int = Query(5, description="Số lượng tài liệu cần lấy"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    """API lấy danh sách tài liệu gần đây theo phạm vi của người dùng"""
    return get_recent_documents_service(db, limit=limit, user=current_user)

# 3. Lấy tất cả tài liệu (Bắt buộc đăng nhập, lọc theo phạm vi)
@router.get("/all", response_model=List[DocumentResponse])
def get_all_documents_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    return get_all_documents(db, user=current_user)

# 4. Tìm kiếm tài liệu (W10: Hỗ trợ tìm kiếm kết hợp, bộ lọc ngày, loại VB, phòng ban, phân trang)
@router.get("/search", response_model=DocumentSearchResponse)
async def search_document_api(
    query: Optional[str] = Query(None, description="Nội dung câu hỏi hoặc từ khóa tìm kiếm"),
    start_date: Optional[str] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    department_id: Optional[str] = Query(None, description="Lọc theo phòng ban"),
    document_type: Optional[str] = Query(None, description="Lọc theo loại văn bản"),
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(20, ge=1, le=100, description="Kích thước mỗi trang"),
    sort_by: Optional[str] = Query("newest", description="Sắp xếp: newest hoặc confidence"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    try:
        results = search_documents_combined_service(
            db=db,
            current_user=current_user,
            query=query,
            start_date=start_date,
            end_date=end_date,
            department_id=department_id,
            document_type=document_type,
            page=page,
            page_size=page_size,
            sort_by=sort_by
        )
        return results
    except Exception as e:
        logger.error(f"Lỗi khi tìm kiếm tài liệu: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi khi tìm kiếm tài liệu: {str(e)}")

# 4.5. Lấy danh sách văn bản của tôi (W4 - Bắt buộc đặt trước dynamic /{document_id})
@router.get("/my", response_model=MyDocumentsListResponse)
def get_my_documents_api(
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    page_size: int = Query(20, ge=1, le=100, description="Số lượng mục mỗi trang"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái: queued, processing, processed, failed, all"),
    search: Optional[str] = Query(None, description="Từ khóa tìm kiếm theo tên file, số hiệu, trích yếu"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    """API lấy danh sách văn bản do chính user tải lên kèm vị trí hàng đợi (W4)"""
    return get_my_documents(
        db=db,
        user_id=current_user.user_id,
        page=page,
        page_size=page_size,
        status=status,
        search=search
    )

# 5. Lấy chi tiết tài liệu (Kiểm tra quyền truy cập)
@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_detail(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    doc, external = await _resolve_document_access(document_id, db, current_user)
    return doc if doc is not None else external


async def _resolve_document_access(document_id: str, db: Session, user: User):
    external = None
    canonical_id = document_id
    if not is_uuid(document_id):
        external = await get_detail_document_in_data_service(document_id)
        if not isinstance(external, dict) or "error" in external:
            raise HTTPException(status_code=502, detail="Không thể lấy tài liệu từ dịch vụ dữ liệu")
        canonical_id = external.get("web_document_id") or external.get("document_id")
    doc = get_document_by_id(db, canonical_id) if is_uuid(canonical_id) else None
    if doc:
        if not can_user_access_document(doc, user):
            raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập tài liệu này")
        return doc, external
    if external is not None and is_system_admin(user):
        return None, external
    if external is not None:
        raise HTTPException(status_code=403, detail="Không thể xác minh phạm vi truy cập tài liệu")
    raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")


@router.get("/{document_id}/file")
async def get_document_raw_file(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.read"))
):
    doc, external = await _resolve_document_access(document_id, db, current_user)
    local_path = doc.file_path if doc is not None else external.get("local_path")
    if doc is None and local_path:
        from pathlib import Path
        path = Path(local_path).resolve()
        roots = [Path(os.getenv("UPLOAD_DIR", "/mnt/data2tb/adcs/uploads")).resolve(),
                 Path(__file__).resolve().parents[4] / "static" / "uploads"]
        if not any(path.is_relative_to(root) for root in roots):
            raise HTTPException(status_code=404, detail="Không tìm thấy tệp tài liệu")
    if not local_path or not os.path.isfile(local_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp tài liệu")
    return FileResponse(local_path)

# 7. Xóa tài liệu (W11: Đồng bộ 2 nơi - Web DB & Data Service / Vector DB)
@router.delete("/{document_id}", response_model=ActionResponse)
async def delete_document_api(
    document_id: str, 
    force: bool = Query(False, description="Bỏ qua lỗi Data Service nếu Data Service ngoại tuyến"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.delete"))
):
    if force and not is_system_admin(current_user):
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên được xóa cưỡng bức")
    try: 
        doc = None
        if is_uuid(document_id):
            doc = get_document_by_id(db, document_id)
        
        # Kiểm tra quyền
        is_admin = is_system_admin(current_user)
        if doc:
            is_owner = str(doc.uploaded_by_user_id) == str(current_user.user_id)
            if not (is_admin or is_owner):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xóa tài liệu này.")
        else:
            if not is_admin:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản trị viên mới được xóa tài liệu không thuộc phạm vi.")

        # Bước 1: Gọi Data Service để xóa file và vector embedding
        try:
            await delete_in_data_service(document_id)
            logger.info(f"Đã xóa tài liệu trên Data Service: {document_id}")
        except HTTPException as d_http_err:
            if d_http_err.status_code == 404:
                # Tài liệu không tồn tại trên Data Service (hoặc chưa bao giờ sync), coi như đã xóa
                logger.info(f"Tài liệu {document_id} không có trên Data Service (404), tiếp tục xóa Web DB.")
            elif force or is_admin:
                logger.warning(f"Data Service lỗi ({d_http_err.detail}), nhưng do force=True nên vẫn tiếp tục xóa Web DB.")
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Không thể đồng bộ xóa trên Data Service: {d_http_err.detail}. Vui lòng thử lại hoặc dùng quyền quản trị viên."
                )
        except Exception as d_err:
            if force or is_admin:
                logger.warning(f"Không thể kết nối Data Service khi xóa ({d_err}), force xóa Web DB.")
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Lỗi kết nối Data Service: {str(d_err)}. Thêm param ?force=true nếu muốn xóa cưỡng bức trên Web DB."
                )

        # Bước 2: Xóa file vật lý local nếu có
        if doc:
            if doc.file_path and os.path.exists(doc.file_path):
                try:
                    os.remove(doc.file_path)
                except Exception as fe:
                    logger.warning(f"Không thể xóa file vật lý local: {fe}")

            # Bước 3: Xóa bản ghi trong Web DB
            delete_document(db, doc)
            logger.info(f"Đã xóa thành công tài liệu {document_id} khỏi Web DB.")

        return {"message": "Đã xóa tài liệu thành công đồng bộ trên cả hệ thống."}

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa tài liệu: {str(e)}")

# 8. Cập nhật kết quả AI / Phê duyệt
@router.put("/{document_id}/ai-result")
def update_ai_result_api(
    document_id: str,
    request: AIResultUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    metadata = request.model_dump(exclude_unset=True, exclude={"status", "updated_at"})
    if metadata or request.status != "approved":
        require_permission(current_user, "file.update")
    if request.status == "approved":
        require_permission(current_user, "file.approve")
    doc = get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    if not can_user_access_document(doc, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền chỉnh sửa tài liệu này.")

    update_data = request.model_dump(exclude_unset=True)
    updated_doc = update_ai_result(db, document_id, update_data)

    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")

    telegram_status = "not_configured"
    if bot_token and request.status == "approved":
        tele_res = send_telegram_ai_result(
            bot_token=bot_token,
            user=current_user, 
            document=updated_doc
        )
        telegram_status = tele_res.get("status")
    else:
        telegram_status = "bot_not_found"

    return {
        "message": "Cập nhật thông tin tài liệu thành công!",
        "document": updated_doc,
        "telegram_notification": telegram_status
    }

# 9. WebSocket cập nhật trạng thái xử lý
@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# 10. Upload tài liệu (Hàng đợi nền, lưu file đĩa ngay, trả về kết quả <200ms)
@router.post("/upload", response_model=UploadResponse)
async def upload_file_api(
    file: UploadFile = File(...),
    is_save_file: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.create"))
):
    # 1. Kiểm tra hạn ngạch số văn bản đang pending của người dùng (tối đa 5)
    pending_count = count_user_pending_documents(db, str(current_user.user_id))
    if pending_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Bạn đang có {pending_count} văn bản đang chờ xử lý. Giới hạn tối đa là 5 văn bản cùng lúc. Vui lòng đợi các văn bản trước hoàn tất."
        )

    # 2. Đọc file và kiểm tra dung lượng tối đa (50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dung lượng tệp ({file_size / (1024*1024):.1f}MB) vượt quá giới hạn tối đa 50MB."
        )

    # 3. Đếm số trang sơ bộ và kiểm tra giới hạn (tối đa 100 trang)
    page_count = 1
    if file.filename.lower().endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_content))
            page_count = len(reader.pages)
        except Exception as pe:
            logger.warning(f"Không thể đọc số trang PDF qua pypdf: {pe}")
            page_count = 1

    if page_count > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tài liệu có {page_count} trang, vượt quá giới hạn tối đa cho phép là 100 trang."
        )

    # 4. Lưu file vật lý xuống ổ đĩa máy chủ ngay lập tức
    upload_dir = "/mnt/data2tb/adcs/uploads"
    if not os.path.exists(upload_dir):
        # Fallback thư mục nội bộ
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../static/uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    target_path = os.path.join(upload_dir, safe_filename)

    with open(target_path, "wb") as f_out:
        f_out.write(file_content)

    logger.info(f"💾 Đã lưu tệp tải lên tại: {target_path} (Dung lượng: {file_size} bytes, Số trang: {page_count})")

    # 5. Tạo bản ghi Document với trạng thái 'queued' và độ ưu tiên người dùng = 1
    doc = create_queued_document(
        db=db,
        user_id=str(current_user.user_id),
        original_filename=file.filename,
        file_path=target_path,
        file_size_bytes=file_size,
        page_count=page_count,
        priority=1
    )

    # 6. Đánh thức Background Queue Worker xử lý ngay
    document_queue.notify()

    # 7. Trả về ngay lập tức cho client
    return {
        "document_id": str(doc.document_id), 
        "status": "queued"
    }

# 9. API thử lại xử lý tài liệu bị lỗi (W4)
@router.post("/{document_id}/retry")
def retry_document_api(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.create"))
):
    """Thử lại xử lý văn bản bị lỗi (W4)"""
    if not is_uuid(document_id):
        raise HTTPException(status_code=400, detail="Mã văn bản không hợp lệ")
    
    doc = retry_my_document(db, uuid.UUID(document_id), current_user)
    document_queue.notify()
    return {
        "message": "Đã đưa văn bản vào lại hàng đợi để xử lý!",
        "document_id": str(doc.document_id),
        "status": doc.status
    }

# 10. API hủy tài liệu đang chờ trong hàng đợi (W4)
@router.post("/{document_id}/cancel")
def cancel_document_api(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("file.create"))
):
    """Hủy văn bản đang chờ trong hàng đợi (W4)"""
    if not is_uuid(document_id):
        raise HTTPException(status_code=400, detail="Mã văn bản không hợp lệ")
    
    doc = cancel_my_document(db, uuid.UUID(document_id), current_user)
    return {
        "message": "Đã hủy văn bản khỏi hàng đợi thành công!",
        "document_id": str(doc.document_id),
        "status": doc.status
    }