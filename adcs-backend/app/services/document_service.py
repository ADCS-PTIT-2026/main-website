import os
import json
import httpx
import re
from datetime import datetime, date
from typing import Optional, Any
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from app.core.logger import logger, request_id_var
from app.services.department_service import get_active_departments_for_ai
from app.crud.document import get_document_by_id, update_document_metadata, get_document_stats, get_documents
from app.core.http_client import http_client
from app.db.session import SessionLocal
from app.models.document import Document
from app.core.document_websocket import manager
from app.models.department import Department
from app.models.human_resource import HumanResource
from app.models.user import User

load_dotenv()
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")
DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")
DATA_SERVICE_SEARCH_URL = f"{DATA_SERVICE_URL}/api/v1/search/documents"
DATA_SERVICE_DOCUMENT_URL = f"{DATA_SERVICE_URL}/api/v1/documents"


def parse_date_string(date_str: Any) -> Optional[date]:
    """
    Parse chuỗi ngày tháng từ nhiều định dạng khác nhau sang datetime.date.
    Hỗ trợ:
      - YYYY-MM-DD
      - DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, DD-MM-YY
      - "ngày DD tháng MM năm YYYY" hoặc "DD tháng MM năm YYYY" (có thể có khoảng trắng thừa)
    Trả về None nếu không parse được hoặc giá trị không hợp lệ.
    """
    if not date_str:
        return None
        
    if isinstance(date_str, datetime):
        return date_str.date()
    if isinstance(date_str, date):
        return date_str
        
    if not isinstance(date_str, str):
        return None
        
    date_str = date_str.strip().lower()
    
    # 1. Thử parse định dạng ISO YYYY-MM-DD
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        pass

    # 2. Thử parse định dạng DD/MM/YYYY hoặc DD-MM-YYYY
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
            
    # 3. Thử parse dạng tiếng Việt: "ngày 28 tháng 2 năm 2017" hoặc "28 tháng 2 năm 2017"
    match = re.search(r'(?:ngày\s+)?(\d+)\s+tháng\s+(\d+)\s+năm\s+(\d+)', date_str)
    if match:
        day = int(match.group(1))
        month = int(match.group(2))
        year = int(match.group(3))
        try:
            return date(year, month, day)
        except ValueError:
            pass
            
    return None


def repair_truncated_json(json_str: str) -> str:
    """
    Sửa các chuỗi JSON bị cắt cụt do LLM trả về, ví dụ thiếu dấu ngoặc kép hoặc ngoặc nhọn.
    """
    json_str = json_str.strip()
    if not json_str:
        return "{}"
        
    temp_str = json_str.replace('\\"', '')
    quote_count = temp_str.count('"')
    
    if quote_count % 2 != 0:
        json_str += '"'
        
    json_str = json_str.rstrip()
    if json_str.endswith(','):
        json_str = json_str[:-1].rstrip()
        
    bracket_stack = []
    in_string = False
    escaped = False
    for char in json_str:
        if char == '"' and not escaped:
            in_string = not in_string
        elif char == '\\' and in_string:
            escaped = not escaped
        else:
            escaped = False
            
        if not in_string:
            if char in ('{', '['):
                bracket_stack.append(char)
            elif char in ('}', ']'):
                if bracket_stack:
                    top = bracket_stack[-1]
                    if (char == '}' and top == '{') or (char == ']' and top == '['):
                        bracket_stack.pop()
                        
    while bracket_stack:
        top = bracket_stack.pop()
        if top == '{':
            json_str += '}'
        elif top == '[':
            json_str += ']'
            
    return json_str


def normalize_ai_response(result):
    """Unwrap legacy JSON without accepting a truncated summary as full analysis."""
    if not isinstance(result, dict):
        return None
    result = dict(result)
    storage = result.get('storage_info') or {}
    if storage.get('action') == 'duplicate' or storage.get('is_duplicate'):
        return result
    nested = result.get('key_information')
    invalid_json = False
    if isinstance(nested, str) and nested.strip():
        raw = nested.strip()
        if raw.startswith('```'):
            raw = '\n'.join(raw.splitlines()[1:])
            raw = raw.removesuffix('```').strip()
        try:
            parsed = json.loads(raw)
        except (ValueError, TypeError):
            try:
                parsed = json.loads(repair_truncated_json(raw))
            except (ValueError, TypeError):
                parsed = None
        if isinstance(parsed, dict):
            result.update(parsed)
        else:
            invalid_json = True
        # Repair can recover the summary alone while the metadata was never generated.
        invalid_json = invalid_json or not isinstance(result.get('extracted_fields'), dict) or (
            isinstance(parsed, dict) and 'extracted_fields' not in parsed and not result.get('extracted_fields')
        )
        if invalid_json and not result.get('extracted_fields'):
            result.update(trang_thai='error', error_code='AI_INVALID_RESPONSE')
    return result


async def send_to_ai_service(
    file_content: bytes, 
    filename: str, 
    is_save_file: bool, 
    timeout: float = 300.0,
    db: Session = None,
    document_id: str = None,
    page_count: int = None
):
    """Gửi file sang AI Service với danh mục phòng ban động từ CSDL và timeout linh hoạt"""
    req_id = request_id_var.get()
    logger.info(f"Bắt đầu gửi file '{filename}' tới AI Service (save_document={is_save_file}, timeout={timeout:.1f}s, document_id={document_id})")
    
    # Lấy danh mục phòng ban động từ CSDL
    if db:
        departments_payload = get_active_departments_for_ai(db)
    else:
        temp_db = SessionLocal()
        try:
            departments_payload = get_active_departments_for_ai(temp_db)
        finally:
            temp_db.close()

    files = {"file": (filename, file_content)}
    data = {
        "save_document": "true" if is_save_file else "false", 
        "department_list": json.dumps(departments_payload, ensure_ascii=False)
    }
    if document_id:
        data["document_id"] = str(document_id)
    if page_count:
        data["page_count"] = str(page_count)

    # Lấy cấu hình tham số AI từ CSDL (W13)
    try:
        from app.crud import system_parameter as crud_sysparam
        if db:
            ai_config = crud_sysparam.get_all_parameters(db)
        else:
            temp_db_param = SessionLocal()
            try:
                ai_config = crud_sysparam.get_all_parameters(temp_db_param)
            finally:
                temp_db_param.close()

        ai_params = {
            "temperature": float(ai_config.get("temperature", 0.7)),
            "max_tokens": int(ai_config.get("maxTokens", 2048)),
            "top_p": float(ai_config.get("topP", 0.9)),
            "top_k": int(ai_config.get("topK", 40)),
            "system_prompt": ai_config.get("promptTemplate", "")
        }
        data["ai_parameters"] = json.dumps(ai_params, ensure_ascii=False)
        logger.info(f"Đã nạp ai_parameters vào payload gửi AI: {ai_params}")
    except Exception as cfg_err:
        logger.warning(f"Không thể nạp cấu hình ai_parameters từ DB, dùng mặc định: {cfg_err}")

    headers = {"X-Request-ID": req_id}
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
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

async def send_document_to_qlvb(db: Session, doc: Document, file_content: bytes, filename: str):
    """Gửi file raw và kết quả phân tích sang hệ thống QLVB (test.qlvb.ript.vn)"""
    qlvb_api_key = os.getenv("QLVB_API_KEY")
    if not qlvb_api_key:
        logger.warning("Chưa cấu hình khóa QLVB; bỏ qua đồng bộ")
        return
    qlvb_base_url = os.getenv("QLVB_BASE_URL", "https://test.qlvb.ript.vn")
    url = f"{qlvb_base_url}/api/qlvb/van-ban-den"
    
    headers = {
        "x-gw-api-key": qlvb_api_key
    }
    
    # 1. Định dạng ngày tháng
    # ngay_van_ban: YYYY-MM-DD
    ngay_van_ban_str = None
    if doc.ngay_van_ban:
        if isinstance(doc.ngay_van_ban, str):
            ngay_van_ban_str = doc.ngay_van_ban
        else:
            ngay_van_ban_str = doc.ngay_van_ban.strftime('%Y-%m-%d')
            
    # ngay_den: YYYY-MM-DD
    ngay_den_str = None
    if doc.ngay_den:
        if isinstance(doc.ngay_den, str):
            ngay_den_str = doc.ngay_den[:10]
        else:
            ngay_den_str = doc.ngay_den.strftime('%Y-%m-%d')
    else:
        ngay_den_str = datetime.now().strftime('%Y-%m-%d')
        
    # han_van_ban: DD/MM/YYYY
    han_van_ban_str = None
    if doc.ngay_het_han:
        if isinstance(doc.ngay_het_han, str):
            han_van_ban_str = doc.ngay_het_han
        else:
            han_van_ban_str = doc.ngay_het_han.strftime('%d/%m/%Y')

    # 2. Lấy thông tin lãnh đạo được trình từ bảng human_resources
    lanh_dao_duoc_trinh = []
    try:
        leader = db.query(HumanResource).filter(HumanResource.is_role_qlvb == True).first()
        if leader:
            lanh_dao_duoc_trinh.append({
                "name": leader.name,
                "ma_can_bo": leader.ma_can_bo or ""
            })
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin lãnh đạo từ human_resources: {str(e)}")
        
    # 3. Xây dựng payload
    payload = {
        "so_ky_hieu": doc.so_ky_hieu or "",
        "trich_yeu": doc.trich_yeu or "",
        "ngay_van_ban": ngay_van_ban_str,
        "ngay_den": ngay_den_str,
        "han_van_ban": han_van_ban_str,
        "signer": doc.nguoi_ky or "",
        "van_ban_loai": "thuong",
        "so_den": doc.so_den or "",
        "don_vi_gui": doc.don_vi_ban_hanh or "",
        "don_vi_phat_hanh": doc.don_vi_ban_hanh or "",
        "loai_van_ban": doc.loai_van_ban_text or "",
        "do_khan": doc.do_khan or "",
        "do_mat": "Thường",
        "so_van_ban": f"Sổ văn bản đến {datetime.now().year}",
        "don_vi_tao": {
            "name": "Học viện Công nghệ BCVT",
            "ma_don_vi": "HVCNBCVT"
        },
        "lanh_dao_duoc_trinh": lanh_dao_duoc_trinh
    }
    
    # Xác định content-type cho file đính kèm
    content_type = "application/octet-stream"
    if filename.lower().endswith(".pdf"):
        content_type = "application/pdf"
    elif filename.lower().endswith(".docx"):
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.lower().endswith(".doc"):
        content_type = "application/msword"
        
    files = {
        "attachments": (filename, file_content, content_type)
    }
    
    data = {
        "payload": json.dumps(payload, ensure_ascii=False)
    }
    
    logger.info(f"Đang gửi dữ liệu văn bản sang QLVB (Endpoint: {url})...")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, data=data, files=files, headers=headers)
            response.raise_for_status()
            logger.info(f"Gửi văn bản sang QLVB thành công! Response: {response.text}")
    except httpx.HTTPStatusError as e:
        logger.error(f"Lỗi HTTP khi gửi sang QLVB ({e.response.status_code}): {e.response.text}")
    except Exception as e:
        logger.error(f"Lỗi kết nối khi gửi sang QLVB: {str(e)}", exc_info=True)


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
        ai_res = normalize_ai_response(ai_res)

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
            doc.ngay_van_ban = parse_date_string(ext.get("ngay_ban_hanh"))
            doc.trich_yeu = ext.get("trich_yeu")
            doc.do_khan = ext.get("do_khan")
            doc.nguoi_ky = ext.get("nguoi_ky")
            doc.chuc_vu_nguoi_ky = ext.get("chuc_vu_nguoi_ky")
            doc.noi_nhan = ext.get("noi_nhan")
            doc.can_cu_phap_ly = ext.get("can_cu_phap_ly")
            doc.yeu_cau_hanh_dong = ext.get("yeu_cau_hanh_dong") 

            goi_y_pb = ai_res.get("goi_y_phong_ban", {})
            doc.goi_y_phong_ban = goi_y_pb
            
            suggested_code = None
            suggested_name = None
            if isinstance(goi_y_pb, dict):
                suggested_code = goi_y_pb.get("department_code") or goi_y_pb.get("code") or goi_y_pb.get("ma_phong_ban")
                suggested_name = goi_y_pb.get("ten_hien_thi") or goi_y_pb.get("name") or goi_y_pb.get("ten_phong_ban")

            suggested_list = ai_res.get("suggested_departments", [])
            if suggested_list and isinstance(suggested_list, list) and len(suggested_list) > 0:
                first_pick = suggested_list[0]
                if isinstance(first_pick, dict):
                    suggested_code = suggested_code or first_pick.get("department_code") or first_pick.get("code")
                    suggested_name = suggested_name or first_pick.get("department_name") or first_pick.get("name")

            department = None
            if suggested_code:
                department = db.query(Department).filter(Department.code == str(suggested_code).strip()).first()
                if not department and str(suggested_code).isdigit():
                    department = db.query(Department).filter(Department.id == int(suggested_code)).first()

            if not department and suggested_name:
                department = db.query(Department).filter(
                    (Department.name.ilike(f"%{suggested_name}%")) | 
                    (Department.ten_hien_thi.ilike(f"%{suggested_name}%"))
                ).first()

            if department:
                doc.assigned_department_id = str(department.department_id)
            else:
                doc.assigned_department_id = None
            
            # Top-3 Suggested Departments
            if not suggested_list and (department or goi_y_pb):
                pb_name = (department.name if department else suggested_name) or "Phòng ban chuyên trách"
                pb_code = (department.code if department else suggested_code) or ""
                pb_score = doc.confidence or 0.88
                pb_reason = goi_y_pb.get("ly_do") or goi_y_pb.get("reasoning") or f"Văn bản phù hợp với chức năng nhiệm vụ tiếp nhận và xử lý của {pb_name}."
                suggested_list = [{
                    "department_code": pb_code,
                    "department_name": pb_name,
                    "confidence_score": pb_score,
                    "reasoning": pb_reason
                }]
            doc.suggested_departments = suggested_list

            # Proposed Assignees
            proposed_assignees = ai_res.get("proposed_assignees", [])
            if not proposed_assignees and department and department.id:
                try:
                    from app.models.human_resource import HumanResource
                    hr_list = db.query(HumanResource).filter(
                        HumanResource.department_id == department.id,
                        HumanResource.active == True
                    ).limit(3).all()
                    if hr_list:
                        proposed_assignees = [
                            {
                                "name": hr.ten_hien_thi or hr.name,
                                "position": hr.chuc_danh or "Cán bộ chuyên môn",
                                "department_code": department.code or str(department.id),
                                "email": hr.email,
                                "reasoning": f"Cán bộ chuyên trách thuộc {department.name}"
                            }
                            for hr in hr_list
                        ]
                except Exception as hr_err:
                    logger.warning(f"Lỗi tìm cán bộ đề xuất: {hr_err}")
            doc.proposed_assignees = proposed_assignees
            
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

            try:
                await send_document_to_qlvb(db, doc, file_content, filename)
            except Exception as qlvb_err:
                logger.error(f"Lỗi khi gửi văn bản sang hệ thống QLVB: {str(qlvb_err)}", exc_info=True)

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
    
def get_dashboard_stats_service(db: Session, user: Optional[User] = None):
    return get_document_stats(db, user=user)

def get_recent_documents_service(db: Session, limit: int = 5, user: Optional[User] = None):
    from app.services.integration_service import serialize_document
    return [serialize_document(db, doc, user) for doc in get_documents(db, limit=limit, user=user)]

def get_all_documents(db: Session, user: Optional[User] = None):
    from app.services.integration_service import serialize_document
    return [serialize_document(db, doc, user) for doc in get_documents(db, user=user)]


async def search_in_data_service(query: str, start_date=None, end_date=None, muc=None):
    from app.core.data_service import data_service
    return (await data_service.post('/api/v1/search/documents', json={
        'query': query, 'from_date': start_date, 'to_date': end_date, 'muc': muc})).json()


async def delete_in_data_service(document_id: str):
    from app.core.data_service import data_service
    return (await data_service.delete(f'/api/v1/documents/{document_id}')).json()


async def get_detail_document_in_data_service(document_id: str):
    from app.core.data_service import data_service
    return (await data_service.get(f'/api/v1/documents/{document_id}/detail')).json()


def search_documents_combined_service(
    db: Session,
    current_user: User,
    query: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    department_id: Optional[str] = None,
    document_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    sort_by: Optional[str] = "newest",
    source_type=None, document_status=None, do_khan=None
):
    from app.crud.document import build_document_scope_query
    from sqlalchemy import or_, func
    import math

    db_query = build_document_scope_query(db, current_user)

    # Lọc theo từ khóa
    if query and query.strip():
        q_term = f"%{query.strip()}%"
        db_query = db_query.filter(
            or_(
                Document.trich_yeu.ilike(q_term),
                Document.so_ky_hieu.ilike(q_term),
                Document.don_vi_ban_hanh.ilike(q_term),
                Document.original_filename.ilike(q_term),
                Document.summary.ilike(q_term),
                Document.nguoi_ky.ilike(q_term)
            )
        )

    # Lọc theo khoảng ngày (ngay_van_ban hoặc created_at)
    if start_date:
        try:
            s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            db_query = db_query.filter(
                or_(
                    Document.ngay_van_ban >= s_date,
                    func.date(Document.created_at) >= s_date
                )
            )
        except Exception:
            pass

    if end_date:
        try:
            e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            db_query = db_query.filter(
                or_(
                    Document.ngay_van_ban <= e_date,
                    func.date(Document.created_at) <= e_date
                )
            )
        except Exception:
            pass

    # Lọc theo phòng ban
    if department_id and department_id.strip():
        db_query = db_query.filter(Document.assigned_department_id == department_id.strip())

    # Lọc theo loại văn bản
    if document_type and document_type.strip() and document_type.lower() != "all":
        db_query = db_query.filter(Document.loai_van_ban_text.ilike(f"%{document_type.strip()}%"))

    if source_type:
        db_query = db_query.filter(Document.source_type == source_type)
    if document_status:
        db_query = db_query.filter(Document.status == document_status)
    if do_khan:
        db_query = db_query.filter(Document.do_khan == do_khan)
    total = db_query.count()

    # Sắp xếp
    if sort_by == "confidence":
        db_query = db_query.order_by(Document.confidence.desc().nullslast(), Document.created_at.desc())
    else:
        db_query = db_query.order_by(Document.created_at.desc())

    # Phân trang
    offset = (page - 1) * page_size
    items = db_query.offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "status": "success",
        "query": query or "",
        "data": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
