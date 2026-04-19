from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.responses import FileResponse

from app.db.session import get_db
from app.schemas.document import UploadResponse, AIResultUpdateRequest, DocumentResponse, DashboardStatsResponse, ActionResponse
from app.services.document_service import *
from app.services.telegram_service import send_telegram_ai_result
from app.core.dependency import get_current_user
from app.models.user import User
from app.models.telegram_bot import Bot
from app.core.document_websocket import manager, is_uuid
from app.crud.document import create_document_entry, delete_document
from app.core.dependency import RoleChecker, get_current_user
from app.core.logger import request_id_var, logger

router = APIRouter()

require_role = RoleChecker(['admin'])

# Lấy thông tin thống kê
@router.get("/stats", response_model=DashboardStatsResponse)
def get_document_stats_api(db: Session = Depends(get_db)):
    """API lấy dữ liệu thống kê tổng quát cho Dashboard"""
    return get_dashboard_stats_service(db)

# Lấy tài liệu gần đây
@router.get("", response_model=List[DocumentResponse])
def get_documents_api(
    limit: int = Query(5, description="Số lượng tài liệu cần lấy"),
    db: Session = Depends(get_db)
):
    """API lấy danh sách tài liệu gần đây"""
    return get_recent_documents_service(db, limit=limit)

# Lấy tất cả tài liệu
@router.get("/all", response_model=List[DocumentResponse])
def get_all_documents_api(db: Session = Depends(get_db)):
    return get_all_documents(db)

# Tìm kiếm tài liệu
@router.get("/search")
async def search_document_api(
    query: str = Query(..., description="Nội dung câu hỏi hoặc từ khóa tìm kiếm"),
    start_date: Optional[str] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        results = await search_in_data_service(query, start_date, end_date)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tìm kiếm AI: {str(e)}")

# Lấy chi tiết tài liệu
@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_detail(document_id: str, db: Session = Depends(get_db)):
    if not is_uuid(document_id):
        results = await get_detail_document_in_data_service(document_id)

        return results
    else:
        doc = get_document_by_id(db, document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return doc
    
# Lấy file raw
@router.get("/{document_id}/file")
async def get_document_raw_file(document_id: str):
    detail = await get_detail_document_in_data_service(document_id)
    
    if "error" in detail:
        raise HTTPException(status_code=400, detail=detail["error"])

    local_path = detail.get("local_path")
    logger.info(f"get path: {local_path}")
    if not local_path or not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file vật lý trên máy chủ.")

    return FileResponse(local_path)

# xóa tài liệu
@router.delete("/{document_id}", response_model=ActionResponse, dependencies=[Depends(require_role)])
async def delete_document_api(
    document_id: str, 
    db: Session = Depends(get_db)
):
    try: 
        if is_uuid(document_id):
            doc = get_document_by_id(db, document_id)
            if not doc:
                raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
            delete_document(db, doc)
            return {"message": "success"}
        else:
            results = await delete_in_data_service(document_id)
        
            return results

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Lỗi khi xóa tài liệu: {str(e)}"
        )

@router.put("/{document_id}/ai-result")
def update_ai_result_api(
    document_id: str,
    request: AIResultUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    update_data = request.model_dump(exclude_unset=True)
    updated_doc = update_ai_result(db, document_id, update_data)

    bot = db.query(Bot).filter(Bot.channel_type == 'telegram', Bot.name == 'ptit_adcs_bot').first()
    bot_token = bot.token if bot else None

    telegram_status = "not_configured"

    if bot_token:
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

# websocket upload tài liệu
@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(client_id)

@router.post("/upload", response_model=UploadResponse)
async def upload_file_api(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    is_save_file: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_req_id = request_id_var.get()

    user_id = str(current_user.user_id) if 'current_user' in locals() else "system_user"
    doc = create_document_entry(db, user_id=user_id)
    file_content = await file.read()

    background_tasks.add_task(
        process_document_background,
        document_id=str(doc.document_id),
        file_content=file_content,
        filename=file.filename,
        is_save_file=is_save_file,
        client_id=user_id,
        request_id=current_req_id
    )

    return {
        "document_id": str(doc.document_id), 
        "status": "pending"
    }