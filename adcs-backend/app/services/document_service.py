import os
import json
import httpx
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from app.core.logger import logger, request_id_var
from app.core.document_websocket import department_list
from app.crud.document import get_document_by_id, update_document_metadata, get_document_stats, get_documents
from app.core.http_client import http_client
from app.db.session import SessionLocal
from app.models.document import Document
from app.core.document_websocket import manager
from app.models.department import Department

load_dotenv()
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")
DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")
DATA_SERVICE_SEARCH_URL = f"{DATA_SERVICE_URL}/api/v1/search/documents"
DATA_SERVICE_DOCUMENT_URL = f"{DATA_SERVICE_URL}/api/v1/documents"


async def send_to_ai_service(file_content: bytes, filename: str, is_save_file: bool):
    """Gửi file sang AI Service"""
    req_id = request_id_var.get()
    logger.info(f"Bắt đầu gửi file '{filename}' tới AI Service (save_document={is_save_file})")
    
    files = {"file": (filename, file_content)}
    data = {
        "save_document": "true" if is_save_file else "false", 
        "department_list": json.dumps(department_list, ensure_ascii=False)
    }
    headers = {"X-Request-ID": req_id}
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(AI_SERVICE_URL, files=files, data=data, headers=headers)
            response.raise_for_status()
            logger.info(f"AI Service phản hồi thành công cho file '{filename}'")
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Lỗi HTTP từ AI Service ({e.response.status_code}): {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Lỗi kết nối httpx tới AI Service: {str(e)}", exc_info=True)
        return None

async def process_document_background(
    document_id: str, 
    file_content: bytes, 
    filename: str, 
    is_save_file: bool, 
    client_id: str,
    request_id: str
):
    """Hàm chạy nền: Gửi file cho AI, lưu toàn bộ kết quả vào Database, và gửi tin nhắn WebSocket"""

    token = request_id_var.set(request_id)
    logger.info(f"Bắt đầu tiến trình xử lý ngầm (Background Task) cho document_id={document_id}")
    db = SessionLocal()
    try:
        ai_res = await send_to_ai_service(file_content, filename, is_save_file)
        logger.info(f"AI results: {ai_res}")
        
        doc = db.query(Document).filter(Document.document_id == document_id).first()
        if not doc:
            logger.warning(f"Không tìm thấy tài liệu trong DB để cập nhật. document_id={document_id}")
            return

        if ai_res and ai_res.get("trang_thai") == "success":
            logger.info(f"Tiến hành parse kết quả AI và lưu DB cho document_id={document_id}")
            doc.status = "processed"
            doc.summary = ai_res.get("tom_tat")
            doc.key_points = ai_res.get("key_points")
            doc.confidence = ai_res.get("diem_tin_cay")
            doc.muc_tin_cay = ai_res.get("muc_tin_cay")
            
            doc.loai_van_ban = ai_res.get("loai_van_ban")
            doc.de_xuat_xu_ly = ai_res.get("de_xuat_thoi_han_xu_ly")
            doc.storage_info = ai_res.get("storage_info")
            
            ext = ai_res.get("extracted_fields", {})
            doc.so_ky_hieu = ext.get("so_hieu_van_ban")
            doc.don_vi_ban_hanh = ext.get("co_quan_ban_hanh")
            doc.trich_yeu = ext.get("trich_yeu")
            doc.do_khan = ext.get("do_khan")
            doc.nguoi_ky = ext.get("nguoi_ky")
            doc.chuc_vu_nguoi_ky = ext.get("chuc_vu_nguoi_ky")
            doc.noi_nhan = ext.get("noi_nhan")
            doc.can_cu_phap_ly = ext.get("can_cu_phap_ly")
            doc.yeu_cau_hanh_dong = ext.get("yeu_cau_hanh_dong") 

            goi_y_pb = ai_res.get("goi_y_phong_ban", {})
            doc.goi_y_phong_ban = goi_y_pb
            ten_phong_ban_ai_de_xuat = goi_y_pb.get("ten_hien_thi")

            if ten_phong_ban_ai_de_xuat:
                department = db.query(Department).filter(
                    Department.name.ilike(f"%{ten_phong_ban_ai_de_xuat}%")
                ).first()
                
                if department:
                    doc.assigned_department_id = str(department.department_id)
                else:
                    doc.assigned_department_id = None 
            else:
                doc.assigned_department_id = None
            
            if ext.get("ngay_ban_hanh"):
                try:
                    doc.ngay_van_ban = datetime.strptime(ext["ngay_ban_hanh"], "%Y-%m-%d").date()
                except (ValueError, TypeError): 
                    pass

            if ai_res.get("loai_van_ban"):
                doc.loai_van_ban_text = ai_res.get("loai_van_ban", {}).get("nhan")

            doc.tong_so_chunk = ai_res.get("tong_so_chunk")
            doc.total_chunks_processed = ai_res.get("total_chunks_processed")
            doc.source_pages = ai_res.get("source_pages")
            doc.processing_time = ai_res.get("processing_time")

            doc.related_documents = ai_res.get("related_documents", [])
            
            de_xuat = ai_res.get("de_xuat_thoi_han_xu_ly", {})
            if de_xuat.get("ngay_het_han_du_kien"):
                try:
                    doc.ngay_het_han = datetime.strptime(de_xuat["ngay_het_han_du_kien"], "%Y-%m-%d").date()
                except (ValueError, TypeError): 
                    pass
            
            db.commit()
            logger.info(f"Đã lưu thành công dữ liệu phân tích AI vào DB. document_id={document_id}")

            await manager.send_personal_message({
                "type": "DOCUMENT_PROCESSED",
                "document_id": str(document_id),
                "status": "success",
                "message": "AI đã xử lý xong tài liệu!"
            }, client_id)
            
        else:
            logger.warning(f"AI Service xử lý thất bại hoặc không trả về kết quả hợp lệ. document_id={document_id}")
            doc.status = "failed"
            db.commit()
            await manager.send_personal_message({
                "type": "DOCUMENT_FAILED",
                "document_id": str(document_id),
                "status": "failed",
                "message": "AI Service gặp lỗi hoặc trả về kết quả không thành công."
            }, client_id)
            
    except Exception as e:
        logger.error(f"Crash hệ thống trong background task xử lý tài liệu (id={document_id}): {str(e)}", exc_info=True)
        db.rollback()
        try:
            doc = db.query(Document).filter(Document.document_id == document_id).first()
            if doc:
                doc.status = "failed"
                db.commit()
                logger.info(f"Đã fallback cập nhật trạng thái 'failed' cho document_id={document_id}")
        except Exception as rollback_err: 
            logger.error(f"Lỗi khi cố gắng rollback status tài liệu: {str(rollback_err)}")
    finally:
        db.close()
        request_id_var.reset(token)
        logger.info(f"Đã đóng phiên Session DB cho tiến trình ngầm document_id={document_id}")


def update_ai_result(db: Session, document_id: str, payload: dict):
    logger.info(f"Người dùng yêu cầu cập nhật (Approve) kết quả AI cho document_id={document_id}")
    document = get_document_by_id(db, document_id)
    if not document:
        logger.warning(f"Cập nhật thất bại. Không tìm thấy document_id={document_id}")
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu (Document not found)")

    payload["updated_at"] = datetime.utcnow()
    if "status" not in payload:
        payload["status"] = "success"

    try:
        updated_document = update_document_metadata(db, document, payload)
        logger.info(f"Đã cập nhật thủ công thành công document_id={document_id}")
        return updated_document
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Lỗi Database khi cập nhật thủ công document_id={document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi cơ sở dữ liệu khi cập nhật thông tin từ AI!"
        )
    
def get_dashboard_stats_service(db: Session):
    return get_document_stats(db)

def get_recent_documents_service(db: Session, limit: int=5):
    return get_documents(db, limit=limit)

def get_all_documents(db: Session):
    return get_documents(db)


async def search_in_data_service(query: str, start_date: str = None, end_date: str = None, muc: str = None):
    req_id = request_id_var.get()
    logger.info(f"Gửi yêu cầu tìm kiếm tới Data Service. query='{query}'")
    
    payload = {"query": query, "from_date": start_date, "to_date": end_date, "muc": muc}
    headers = {"X-Request-ID": req_id}
    
    try:
        response = await http_client.client.post(
            DATA_SERVICE_SEARCH_URL, 
            json=payload, 
            timeout=60,
            headers=headers
        )
        response.raise_for_status()
        logger.info(f"Tìm kiếm AI thành công.")
        return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Lỗi HTTP từ Data Service (Search): {e.response.text}")
        return {"error": "Data Service không phản hồi đúng cách"}
    except Exception as e:
        logger.error(f"Lỗi kết nối khi gọi Data Service (Search): {str(e)}", exc_info=True)
        return {"error": "Không thể kết nối đến Data Service"}
        

async def delete_in_data_service(document_id: str):
    req_id = request_id_var.get()
    logger.info(f"Yêu cầu xóa tài liệu khỏi Vector DB. document_id={document_id}")
    
    headers = {"X-Request-ID": req_id}
    try:
        url = f"{DATA_SERVICE_DOCUMENT_URL}/{document_id}"

        response = await http_client.client.delete(
            url, 
            timeout=10.0,
            headers=headers
        )
        response.raise_for_status()
        
        logger.info(f"Xóa tài liệu thành công trên Data Service. document_id={document_id}")
        return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"Data Service từ chối xóa tài liệu {document_id}. Lỗi: {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Data Service error: {e.response.text}"
        )
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cố gắng gọi API xóa tài liệu {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi hệ thống xử lý dữ liệu: {str(e)}"
        )
    
async def get_detail_document_in_data_service(document_id: str):
    req_id = request_id_var.get()
    logger.info(f"Gửi yêu cầu lấy chi tiết tài liệu tới Data Service. document_id={document_id}")

    headers = {"X-Request-ID": req_id}
    
    try:
        url = f"{DATA_SERVICE_DOCUMENT_URL}/{document_id}/detail"
        response = await http_client.client.get(
            url, 
            timeout=10,
            headers=headers
        )
        response.raise_for_status()

        logger.info(f"Lấy chi tiết tài liệu thành công trên Data Service. document_id={document_id}")
        return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Lỗi HTTP từ Data Service (Search): {e.response.text}")
        return {"error": "Data Service không phản hồi đúng cách"}
    except Exception as e:
        logger.error(f"Lỗi kết nối khi gọi Data Service (Search): {str(e)}", exc_info=True)
        return {"error": "Không thể kết nối đến Data Service"}