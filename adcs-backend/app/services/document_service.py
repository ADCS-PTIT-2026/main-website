from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import UploadFile, HTTPException, status
from datetime import datetime
from app.utils.document_websocket import department_list
from app.crud.document import get_document_by_id, create_document_entry, update_document_metadata, get_document_stats, get_recent_documents
import httpx
import json

import os
from dotenv import load_dotenv

load_dotenv()
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")


async def send_to_ai_service(file_content: bytes, filename: str, is_save_file: bool, document_id: str):
    """Gửi file và cờ lưu trữ sang AI Service"""
    files = {"file": (filename, file_content)}
    data = {"save_document": "true" if is_save_file else "false", 
            "document_id": document_id, 
            "department_list": json.dumps(department_list, ensure_ascii=False)
    }
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            response = await client.post(AI_SERVICE_URL, files=files, data=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"AI Service trả về lỗi: {e.response.status_code}")
            return None
        except Exception as e:
            print(f"Lỗi kết nối httpx: {e}")
            return None

async def upload_document(db: Session, file: UploadFile, user_id: str, is_save_file: bool):
    try:
        doc = create_document_entry(db)

        file_content = await file.read()
        ai_res = await send_to_ai_service(file_content, file.filename, is_save_file, str(doc.document_id))

        if ai_res and ai_res.get("trang_thai") == "success":
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
            
        else:
            doc.status = "failed"
            print(f"AI Service trả về kết quả không thành công cho file {file.filename}")

        db.commit()
        db.refresh(doc)
        return doc

    except Exception as e:
        db.rollback()
        print(f"Lỗi trong quá trình xử lý tài liệu: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Lỗi hệ thống khi xử lý AI và lưu dữ liệu"
        )

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

def get_recent_documents_service(db: Session, limit: int):
    return get_recent_documents(db, limit=limit)