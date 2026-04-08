from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.db.session import get_db
from app.schemas.document import UploadResponse, AIResultUpdateRequest, AIResultUpdateResponse, DocumentResponse, DashboardStatsResponse
from app.services.document_service import update_ai_result, get_dashboard_stats_service, get_recent_documents_service, get_document_by_id, get_all_documents
from app.services.telegram_service import send_telegram_ai_result
from app.core.dependency import get_current_user
from app.models.user import User
from app.models.telegram_bot import Bot
from app.models.document import Document
from app.utils.document_websocket import manager
from app.services.document_service import send_to_ai_service
from app.crud.document import create_document_entry

router = APIRouter()

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
        from app.services.document_service import search_ai_service
        
        results = await search_ai_service(query, start_date, end_date)
        
        return {
            "status": "success",
            "query": query,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tìm kiếm AI: {str(e)}")

# Lấy chi tiết tài liệu
@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_detail(document_id: str, db: Session = Depends(get_db)):
    doc = get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return doc

@router.put("/{document_id}/ai-result", response_model=AIResultUpdateResponse)
def update_ai_result_api(
    document_id: str,
    request: AIResultUpdateRequest,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    update_data = request.model_dump(exclude_unset=True)
    
    updated_doc = update_ai_result(db, document_id, update_data)

    bot = db.query(Bot).filter(Bot.channel_type == 'telegram', Bot.name == 'ptit_adcs_bot').first()
    bot_token = bot.token if bot else None

    if bot_token:
        background_tasks.add_task(
            send_telegram_ai_result, 
            bot_token=bot_token,
            user=current_user, 
            document=updated_doc
        )
    else:
        print("[Telegram Warning] Không tìm thấy cấu hình Bot trong cơ sở dữ liệu.")

    return {
        "message": "Cập nhật thông tin tài liệu thành công!",
        "document": updated_doc
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

async def process_document_background(
    document_id: str, 
    file_content: bytes, 
    filename: str, 
    is_save_file: bool, 
    client_id: str,
    db: Session
):
    try:
        ai_res = await send_to_ai_service(file_content, filename, is_save_file)
        
        doc = db.query(Document).filter(Document.document_id == document_id).first()
        if doc and ai_res and ai_res.get("trang_thai") == "success":
            doc.status = "processed"
            doc.summary = ai_res.get("tom_tat")
            doc.key_points = ai_res.get("key_points")
            doc.confidence = ai_res.get("diem_tin_cay")
            doc.muc_tin_cay = ai_res.get("muc_tin_cay")
            
            ext = ai_res.get("extracted_fields", {})
            doc.so_ky_hieu = ext.get("so_hieu_van_ban")
            doc.don_vi_ban_hanh = ext.get("co_quan_ban_hanh")
            doc.trich_yeu = ext.get("trich_yeu")
            doc.do_khan = ext.get("do_khan")
            doc.nguoi_ky = ext.get("nguoi_ky")
            doc.chuc_vu_nguoi_ky = ext.get("chuc_vu_nguoi_ky")
            doc.noi_nhan = ext.get("noi_nhan")
            doc.can_cu_phap_ly = ext.get("can_cu_phap_ly")
            doc.yeu_cau_han_dong = ext.get("yeu_cau_han_dong")
            
            if ext.get("ngay_ban_hanh"):
                try:
                    doc.ngay_van_ban = datetime.strptime(ext["ngay_ban_hanh"], "%Y-%m-%d").date()
                except (ValueError, TypeError): pass

            loai_vb = ai_res.get("loai_van_ban", {})
            doc.loai_van_ban_text = loai_vb.get("nhan")
            
            de_xuat = ai_res.get("de_xuat_thoi_han_xu_ly", {})
            doc.de_xuat_xu_ly = de_xuat
            if de_xuat.get("ngay_het_han_du_kien"):
                try:
                    doc.ngay_het_han = datetime.strptime(de_xuat["ngay_het_han_du_kien"], "%Y-%m-%d").date()
                except (ValueError, TypeError): pass
            
            goi_y_pb = ai_res.get("goi_y_phong_ban", {})
            doc.goi_y_phong_ban = goi_y_pb
            doc.assigned_department_id = goi_y_pb.get("phong_ban")

            meta = ai_res.get("metadata", {})
            doc.tong_so_chunk = meta.get("tong_so_chunk")
            doc.processing_time = meta.get("thoi_gian_xu_ly_giay")
            
            db.commit()
            
            await manager.send_personal_message({
                "type": "DOCUMENT_PROCESSED",
                "document_id": str(document_id),
                "status": "success",
                "message": "AI đã xử lý xong tài liệu!"
            }, client_id)
            
        else:
            if doc:
                doc.status = "failed"
                db.commit()
            await manager.send_personal_message({
                "type": "DOCUMENT_FAILED",
                "document_id": str(document_id),
                "status": "failed",
                "message": "AI Service gặp lỗi."
            }, client_id)
            
    except Exception as e:
        print(f"Lỗi background task: {e}")

@router.post("/upload", response_model=UploadResponse)
async def upload_file_api(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    is_save_file: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = create_document_entry(db, user_id=str(current_user.user_id))
    db.commit()
    db.refresh(doc)

    file_content = await file.read()

    background_tasks.add_task(
        process_document_background,
        document_id=doc.document_id,
        file_content=file_content,
        filename=file.filename,
        is_save_file=is_save_file,
        client_id=str(current_user.user_id),
        db=db
    )

    return {
        "document_id": str(doc.document_id), 
        "status": "processing"
    }