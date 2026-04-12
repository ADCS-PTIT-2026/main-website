from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from datetime import datetime
from app.utils.document_websocket import department_list
from app.crud.document import get_document_by_id, update_document_metadata, get_document_stats, get_documents
from app.core.http_client import http_client
from app.db.session import SessionLocal
from app.models.document import Document
from app.utils.document_websocket import manager
from app.models.department import Department
import httpx
import json

import os
from dotenv import load_dotenv

load_dotenv()
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")
DATA_SERVICE_SEARCH_URL = os.getenv("DATA_SERVICE_SEARCH_URL")
DATA_SERVICE_DELETE_URL = os.getenv("DATA_SERVICE_DELETE_URL")


async def send_to_ai_service(file_content: bytes, filename: str, is_save_file: bool):
    """Gửi file sang AI Service"""
    files = {"file": (filename, file_content)}
    data = {
        "save_document": "true" if is_save_file else "false", 
        "department_list": json.dumps(department_list, ensure_ascii=False)
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(AI_SERVICE_URL, files=files, data=data)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Lỗi gọi AI Service: {e}")
        return None

async def process_document_background(
    document_id: str, 
    file_content: bytes, 
    filename: str, 
    is_save_file: bool, 
    client_id: str
):
    """Hàm chạy nền: Gửi file cho AI, lưu toàn bộ kết quả vào Database, và gửi tin nhắn WebSocket"""
    db = SessionLocal()
    try:
        ai_res = await send_to_ai_service(file_content, filename, is_save_file)
        
        doc = db.query(Document).filter(Document.document_id == document_id).first()
        if not doc:
            return

        if ai_res and ai_res.get("trang_thai") == "success":
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
            
            de_xuat = ai_res.get("de_xuat_thoi_han_xu_ly", {})
            if de_xuat.get("ngay_het_han_du_kien"):
                try:
                    doc.ngay_het_han = datetime.strptime(de_xuat["ngay_het_han_du_kien"], "%Y-%m-%d").date()
                except (ValueError, TypeError): 
                    pass
            
            db.commit()

            await manager.send_personal_message({
                "type": "DOCUMENT_PROCESSED",
                "document_id": str(document_id),
                "status": "success",
                "message": "AI đã xử lý xong tài liệu!"
            }, client_id)
            
        else:
            doc.status = "failed"
            db.commit()
            await manager.send_personal_message({
                "type": "DOCUMENT_FAILED",
                "document_id": str(document_id),
                "status": "failed",
                "message": "AI Service gặp lỗi hoặc trả về kết quả không thành công."
            }, client_id)
            
    except Exception as e:
        print(f"Lỗi background task process_document_background: {e}")
        db.rollback()
        # Cập nhật trạng thái lỗi vào DB nếu có lỗi crash
        try:
            doc = db.query(Document).filter(Document.document_id == document_id).first()
            if doc:
                doc.status = "failed"
                db.commit()
        except: 
            pass
    finally:
        db.close()

def update_ai_result(db: Session, document_id: str, payload: dict):
    document = get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu (Document not found)")

    payload["updated_at"] = datetime.utcnow()
    if "status" not in payload:
        payload["status"] = "success"

    try:
        updated_document = update_document_metadata(db, document, payload)
        return updated_document
    except SQLAlchemyError as e:
        db.rollback()
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

async def search_ai_service(query: str, start_date: str = None, end_date: str = None, muc: str = None):
    payload = {
        "query": query,
        "from_date": start_date,
        "to_date": end_date,
        "muc": muc,
    }
    
    try:
        response = await http_client.client.post(
            DATA_SERVICE_SEARCH_URL, 
            json=payload, 
            timeout=60
        )
        response.raise_for_status()

        print(response.json())
        return response.json()
    except httpx.HTTPStatusError as e:
        print(f"AI Service Error: {e.response.text}")
        return {"error": "AI Service không phản hồi đúng cách"}
    except Exception as e:
        print(f"Connection Error: {str(e)}")
        return {"error": "Không thể kết nối đến AI Service"}
        
async def delete_in_document_service(document_id: str):
    try:
        url = f"{DATA_SERVICE_DELETE_URL}/{document_id}"

        response = await http_client.client.delete(
            url, 
            timeout=10.0
        )
        
        response.raise_for_status()
        
        return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Data Service error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi hệ thống xử lý dữ liệu: {str(e)}"
        )
     