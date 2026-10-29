from app.core.data_service import data_service
import os
import html
import httpx
import mimetypes
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.logger import logger
from app.models.document import Document
from app.models.user import User
from app.crud.document import get_document_by_id, can_user_access_document
from app.core.authorization import is_system_admin
from app.core.document_websocket import is_uuid
from app.api.v1.endpoints.telegram import get_system_bot_token, send_telegram_notification

DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")

def guess_mime_type(filename: Optional[str]) -> str:
    if not filename:
        return "application/pdf"
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/pdf"

def item_matches_search(item: dict, search: Optional[str]) -> bool:
    if not search or not search.strip():
        return True
    kw = search.strip().lower()
    targets = [
        item.get("filename"),
        item.get("so_ky_hieu"),
        item.get("so_hieu_van_ban"),
        item.get("trich_yeu"),
        item.get("document_type"),
        item.get("loai_van_ban"),
        item.get("suggested_department"),
    ]
    return any(kw in str(t).lower() for t in targets if t)

async def fetch_processing_history(
    limit: int = 10,
    search: str = None,
    action: str = None,
    time_filter: str = None,
    user: Optional[User] = None,
    db: Optional[Session] = None
):
    """
    Lấy danh sách lịch sử xử lý tài liệu.
    - Với Admin: Hiển thị toàn bộ lịch sử hệ thống từ Data Service.
    - Với User thường: Chỉ hiển thị lịch sử của các văn bản do chính user đó tải lên.
    """
    url = f"{DATA_SERVICE_URL}/api/v1/history"

    is_admin = is_system_admin(user)

    fetch_limit = 200 if (is_admin and search) else (limit if is_admin else 200)
    params = {
        "limit": fetch_limit
    }

    if search:
        params["search"] = search
    
    if action and action != "Tất cả hành động":
        params["action"] = action
        
    if time_filter and time_filter != "Tùy chọn...":
        params["time_filter"] = time_filter

    logger.info(f"Đang gọi Data Service lấy lịch sử. is_admin={is_admin}, user={user.email if user else None}, params={params}")

    raw_data = {"total": 0, "results": []}
    try:
        async with data_service as client:
            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code == 200:
                raw_data = response.json()
            else:
                logger.warning(f"Data Service trả về mã {response.status_code}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, 'Phản hồi lịch sử từ Data Service không hợp lệ') from None

    # Nếu là Admin, trả về toàn bộ dữ liệu từ Data Service (lọc từ khóa nếu có)
    if is_admin:
        results = raw_data.get("results", []) if isinstance(raw_data, dict) else (raw_data if isinstance(raw_data, list) else [])
        if search:
            results = [r for r in results if item_matches_search(r, search)]
        final_results = results[:limit]
        return {
            "total": len(results),
            "limit": limit,
            "offset": 0,
            "results": final_results
        }

    # VỚI USER THƯỜNG: Lọc chỉ lấy tài liệu do user này sở hữu trong Web DB
    results = raw_data.get("results", []) if isinstance(raw_data, dict) else (raw_data if isinstance(raw_data, list) else [])
    
    user_docs = []
    if db and user:
        user_docs = db.query(Document).filter(
            Document.uploaded_by_user_id == str(user.user_id), Document.deleted_at.is_(None)
        ).order_by(Document.created_at.desc()).all()

    user_doc_ids = {str(doc.document_id).lower() for doc in user_docs}
    filtered_results = []
    seen_matched_ids = set()
    for item in results:
        did = str(item.get("web_document_id") or item.get("document_id") or "").strip().lower()
        if did in user_doc_ids:
            item = dict(item, document_id=did)
        if did in user_doc_ids:
            filtered_results.append(item)
            seen_matched_ids.add(did)

    # Bổ sung các tài liệu user đã tải lên trong Web DB mà Data Service history chưa có
    for doc in user_docs:
        if str(doc.document_id).lower() not in seen_matched_ids:
            status_val = doc.status or "queued"
            llm_stat = "success" if status_val in ["processed", "approved"] else ("failed" if status_val in ["failed", "cancelled"] else "pending")
            file_stat = "success" if status_val in ["processed", "approved"] else "pending"
            vec_stat = "success" if status_val in ["processed", "approved"] else "pending"
            
            filtered_results.append({
                "id": "web:" + str(doc.document_id),
                "request_id": str(doc.document_id)[:8],
                "action_type": "upload",
                "filename": doc.original_filename,
                "file_type": guess_mime_type(doc.original_filename),
                "status_llm": llm_stat,
                "status_save_file": file_stat,
                "status_save_vector": vec_stat,
                "document_type": doc.loai_van_ban_text or "van_ban",
                "suggested_department": (doc.goi_y_phong_ban.get("ten_hien_thi") if isinstance(doc.goi_y_phong_ban, dict) else None),
                "document_id": str(doc.document_id),
                "attachment_id": None,
                "error_message": doc.error_message,
                "created_at": str(doc.created_at) if doc.created_at else ""
            })
            seen_matched_ids.add(str(doc.document_id).lower())

    if search:
        filtered_results = [r for r in filtered_results if item_matches_search(r, search)]

    # Sắp xếp bản ghi mới nhất lên đầu
    def get_sort_key(item):
        return item.get("created_at") or ""

    filtered_results.sort(key=get_sort_key, reverse=True)

    final_results = filtered_results[:limit]
    return {
        "total": len(filtered_results),
        "limit": limit,
        "offset": 0,
        "results": final_results
    }



async def fetch_history_detail(history_id: str, db: Session, user: User) -> dict:
    if str(history_id).startswith('web:'):
        return await fetch_document_processing_detail(str(history_id)[4:], db, user)
    try:
        history_id = int(history_id)
    except (TypeError, ValueError):
        raise HTTPException(422, 'Mã lịch sử không hợp lệ')
    """
    Lấy chi tiết một lượt xử lý từ Data Service và làm giàu bằng dữ liệu từ Web DB.
    """
    url = f"{DATA_SERVICE_URL}/api/v1/history"
    raw_history_item = None

    try:
        async with data_service as client:
            # Lấy danh sách lịch sử để tìm record theo id
            res = await client.get(url, params={"limit": 200})
            if res.status_code == 200:
                data = res.json()
                results = data.get("results", []) if isinstance(data, dict) else data
                for item in results:
                    if item.get("id") == history_id:
                        raw_history_item = item
                        break
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Lỗi khi truy vấn Data Service history list: {e}")

    if not raw_history_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bản ghi lịch sử xử lý với ID: {history_id}"
        )

    # 1. Thu thập dữ liệu từ Data Service document detail (nếu có document_id)
    doc_data = {}
    doc_id = raw_history_item.get("document_id")
    if doc_id:
        try:
            doc_detail_url = f"{DATA_SERVICE_URL}/api/v1/documents/{doc_id}/detail"
            async with data_service as client:
                res_doc = await client.get(doc_detail_url)
                if res_doc.status_code == 200:
                    doc_data = res_doc.json()
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Không thể lấy chi tiết document_id={doc_id} từ Data Service: {e}")

    # Only a canonical ID can connect an external record to a local document.
    # Filenames and summaries are not evidence of ownership.
    if not isinstance(doc_data, dict):
        doc_data = {}
    canonical_id = raw_history_item.get("web_document_id") or (doc_id if is_uuid(doc_id) else (doc_data.get("web_document_id") or doc_data.get("document_id")))
    doc_web = get_document_by_id(db, canonical_id) if is_uuid(canonical_id) else None
    if not is_system_admin(user) and (not doc_web or not can_user_access_document(doc_web, user)):
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập lịch sử tài liệu này")
    filename = raw_history_item.get("filename")

    # 3. Tính toán trạng thái tổng hợp
    status_llm = raw_history_item.get("status_llm")
    status_file = raw_history_item.get("status_save_file")
    status_vector = raw_history_item.get("status_save_vector")
    err_msg = raw_history_item.get("error_message")

    if any(s in ["failed", "error"] for s in [status_llm, status_file, status_vector]) or err_msg:
        overall_status = "failed"
    elif any(s in ["pending", "processing"] for s in [status_llm, status_file, status_vector]):
        overall_status = "processing"
    else:
        overall_status = "success"

    if doc_web and doc_web.status in ["failed", "cancelled", "needs_review"]:
        status_llm = "failed" if doc_web.status in ["failed", "cancelled"] else "needs_review"

    # 4. Tổng hợp payload chi tiết
    detail = {
        "id": raw_history_item.get("id"),
        "request_id": raw_history_item.get("request_id"),
        "filename": filename or (doc_web.original_filename if doc_web else "Tài liệu không tên"),
        "file_type": raw_history_item.get("file_type") or guess_mime_type(filename or (doc_web.original_filename if doc_web else None)),
        "action_type": raw_history_item.get("action_type") or "process",
        "status": overall_status,
        "status_llm": status_llm,
        "status_save_file": status_file,
        "status_save_vector": status_vector,
        "error_message": err_msg,
        "created_at": raw_history_item.get("created_at"),
        "document_id": doc_id or (str(doc_web.document_id) if doc_web else None),
        
        # Metadata trích xuất
        "so_ky_hieu": doc_data.get("so_ky_hieu") or (doc_web.so_ky_hieu if doc_web else None),
        "so_den": doc_data.get("so_den") or (doc_web.so_den if doc_web else None),
        "trich_yeu": doc_data.get("trich_yeu") or (doc_web.trich_yeu if doc_web else None),
        "don_vi_ban_hanh": doc_data.get("don_vi_ban_hanh") or (doc_web.don_vi_ban_hanh if doc_web else None),
        "ngay_van_ban": str(doc_data.get("ngay_van_ban") or (doc_web.ngay_van_ban if doc_web else "")),
        "loai_van_ban": doc_data.get("loai_van_ban") or raw_history_item.get("document_type") or (doc_web.loai_van_ban_text if doc_web else None),
        "nguoi_ky": doc_web.nguoi_ky if doc_web else None,
        "chuc_vu_nguoi_ky": doc_web.chuc_vu_nguoi_ky if doc_web else None,
        "do_khan": doc_data.get("do_khan") or (doc_web.do_khan if doc_web else None),
        "suggested_department": raw_history_item.get("suggested_department") or (doc_web.goi_y_phong_ban.get("ten_hien_thi") if doc_web and doc_web.goi_y_phong_ban else None),
        
        # Kết quả phân tích AI
        "summary": doc_web.summary if doc_web else None,
        "key_points": doc_web.key_points if doc_web else None,
        "confidence": doc_web.confidence if doc_web else (0.95 if overall_status == "success" else None),
        "muc_tin_cay": doc_web.muc_tin_cay if doc_web else ("Cao" if overall_status == "success" else None),
        "processing_time": doc_web.processing_time if doc_web else None,
        "source_pages": (doc_web.source_pages or doc_web.page_count) if doc_web else None,
        "attachments": doc_data.get("attachments", []),
        "storage_info": doc_web.storage_info if doc_web else None
    }

    return detail


async def send_history_telegram_notification(history_id: int, user: User, db: Session) -> dict:
    """
    Gửi kết quả xử lý của một lượt trong lịch sử tới tài khoản Telegram của người dùng.
    """
    chat_id = getattr(user, "telegram_chat_id", None)
    if not chat_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản của bạn chưa được liên kết với Telegram. Vui lòng kết nối Telegram tại Bảng điều khiển trước."
        )

    # Lấy thông tin chi tiết của lượt xử lý
    detail = await fetch_history_detail(history_id, db, user)

    # Chỉ cho phép gửi nếu trạng thái hoàn tất thành công
    if detail.get("status") in ["failed", "error"] or detail.get("status_llm") in ["failed", "error"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể gửi kết quả qua Telegram cho các văn bản đã xử lý thành công."
        )

    bot_token = get_system_bot_token(db)
    if not bot_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hệ thống chưa cấu hình Telegram Bot Token."
        )

    def safe_html(text):
        if not text:
            return "Không có"
        return html.escape(str(text))

    lines = [
        "📋 <b>KẾT QUẢ XỬ LÝ VĂN BẢN (CHIA SẺ TỪ LỊCH SỬ)</b>",
        "",
        f"📄 <b>Tên tệp:</b> <code>{safe_html(detail.get('filename'))}</code>",
    ]
    if detail.get("so_ky_hieu"):
        lines.append(f"🔢 <b>Số/Ký hiệu:</b> {safe_html(detail.get('so_ky_hieu'))}")
    if detail.get("loai_van_ban"):
        lines.append(f"📑 <b>Loại văn bản:</b> {safe_html(detail.get('loai_van_ban'))}")
    if detail.get("don_vi_ban_hanh"):
        lines.append(f"🏛️ <b>Cơ quan ban hành:</b> {safe_html(detail.get('don_vi_ban_hanh'))}")
    if detail.get("nguoi_ky"):
        lines.append(f"✍️ <b>Người ký:</b> {safe_html(detail.get('nguoi_ky'))}")
    if detail.get("ngay_van_ban") and detail.get("ngay_van_ban") != "None":
        lines.append(f"📅 <b>Ngày văn bản:</b> {safe_html(detail.get('ngay_van_ban'))}")
    if detail.get("suggested_department"):
        lines.append(f"🏢 <b>Phòng ban gợi ý:</b> <b>{safe_html(detail.get('suggested_department'))}</b>")
    if detail.get("confidence"):
        try:
            val = float(detail["confidence"])
            pct = int(val * 100) if val <= 1.0 else int(val)
            lines.append(f"🎯 <b>Độ tin cậy AI:</b> {pct}% ({safe_html(detail.get('muc_tin_cay') or 'Cao')})")
        except Exception:
            pass

    if detail.get("trich_yeu"):
        lines.append(f"\n📝 <b>Trích yếu nội dung:</b>\n<i>{safe_html(detail.get('trich_yeu'))}</i>")
    if detail.get("summary"):
        lines.append(f"\n💡 <b>Tóm tắt AI:</b>\n{safe_html(detail.get('summary'))}")

    lines.append(f"\n⏱️ <b>Thời gian ghi nhận:</b> {safe_html(detail.get('created_at'))}")
    user_display = getattr(user, "display_name", None) or getattr(user, "full_name", None) or user.email
    lines.append(f"👤 <b>Người yêu cầu gửi:</b> {safe_html(user_display)}")

    message_text = "\n".join(lines)

    # Gửi qua Telegram API
    send_telegram_notification(bot_token, chat_id, message_text)

    return {
        "status": "success",
        "message": "Đã gửi kết quả xử lý văn bản tới tài khoản Telegram của bạn thành công!"
    }


async def fetch_document_processing_detail(document_id: str, db: Session, user: User) -> dict:
    """
    Lấy chi tiết một tài liệu dưới dạng ProcessingDetail để hiển thị modal chi tiết (dùng cho Dashboard).
    """
    doc_web = get_document_by_id(db, document_id)
    if not doc_web:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tài liệu với ID: {document_id}"
        )

    if not can_user_access_document(doc_web, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập vào tài liệu này."
        )

    # Thử tra cứu thông tin lượt xử lý trong Data Service
    history_item = None
    try:
        url = f"{DATA_SERVICE_URL}/api/v1/history"
        async with data_service as client:
            res = await client.get(url, params={"limit": 200})
            if res.status_code == 200:
                data = res.json()
                results = data.get("results", []) if isinstance(data, dict) else data
                for item in results:
                    if str(item.get("web_document_id") or item.get("document_id")) == str(doc_web.document_id):
                        history_item = item
                        break
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Không thể tra cứu Data Service history cho document_id={document_id}: {e}")

    overall_status = doc_web.status or "success"
    if overall_status == "processed":
        overall_status = "success"

    if overall_status in ["failed", "cancelled", "needs_review"]:
        status_llm = "failed" if overall_status in ["failed", "cancelled"] else "needs_review"
    else:
        status_llm = history_item.get("status_llm") if history_item else ("success" if overall_status in ["success", "approved"] else "processing")
    status_file = history_item.get("status_save_file") if history_item else ("success" if overall_status in ["success", "approved"] else "pending")
    status_vector = history_item.get("status_save_vector") if history_item else ("success" if overall_status in ["success", "approved"] else "pending")

    detail = {
        "id": history_item.get("id") if history_item else (hash(str(doc_web.document_id)) % 10000000),
        "request_id": history_item.get("request_id") if history_item else str(doc_web.document_id)[:8],
        "filename": doc_web.original_filename or doc_web.title or "Tài liệu",
        "file_type": guess_mime_type(doc_web.original_filename or doc_web.title),
        "action_type": history_item.get("action_type") if history_item else "upload",
        "status": overall_status,
        "status_llm": status_llm,
        "status_save_file": status_file,
        "status_save_vector": status_vector,
        "error_message": doc_web.error_message or (history_item.get("error_message") if history_item else None),
        "created_at": str(doc_web.created_at) if doc_web.created_at else "",
        "document_id": str(doc_web.document_id),
        
        "so_ky_hieu": doc_web.so_ky_hieu,
        "so_den": doc_web.so_den,
        "trich_yeu": doc_web.trich_yeu,
        "don_vi_ban_hanh": doc_web.don_vi_ban_hanh,
        "ngay_van_ban": str(doc_web.ngay_van_ban) if doc_web.ngay_van_ban else None,
        "loai_van_ban": doc_web.loai_van_ban_text,
        "nguoi_ky": doc_web.nguoi_ky,
        "chuc_vu_nguoi_ky": doc_web.chuc_vu_nguoi_ky,
        "do_khan": doc_web.do_khan,
        "suggested_department": (doc_web.goi_y_phong_ban.get("ten_hien_thi") if isinstance(doc_web.goi_y_phong_ban, dict) else None),
        
        "summary": doc_web.summary,
        "key_points": doc_web.key_points if isinstance(doc_web.key_points, list) else [],
        "confidence": doc_web.confidence or (0.95 if overall_status == "success" else None),
        "muc_tin_cay": doc_web.muc_tin_cay or ("Cao" if overall_status == "success" else None),
        "processing_time": doc_web.processing_time,
        "source_pages": doc_web.source_pages or doc_web.page_count,
        "attachments": history_item.get("attachments", []) if history_item else [],
        "storage_info": doc_web.storage_info
    }
    return detail


async def send_document_telegram_notification(document_id: str, user: User, db: Session) -> dict:
    """
    Gửi thông báo kết quả chi tiết của một tài liệu qua Telegram (dùng cho Dashboard).
    """
    chat_id = getattr(user, "telegram_chat_id", None)
    if not chat_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản của bạn chưa được liên kết với Telegram. Vui lòng kết nối Telegram tại Bảng điều khiển trước."
        )

    detail = await fetch_document_processing_detail(document_id, db, user)

    if detail.get("status") in ["failed", "error"] or detail.get("status_llm") in ["failed", "error"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể gửi kết quả qua Telegram cho các văn bản đã xử lý thành công."
        )

    bot_token = get_system_bot_token(db)
    if not bot_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hệ thống chưa cấu hình Telegram Bot Token."
        )

    def safe_html(text):
        if not text:
            return "Không có"
        return html.escape(str(text))

    lines = [
        "📋 <b>KẾT QUẢ XỬ LÝ VĂN BẢN (TỪ BẢNG ĐIỀU KHIỂN)</b>",
        "",
        f"📄 <b>Tên tệp:</b> <code>{safe_html(detail.get('filename'))}</code>",
    ]
    if detail.get("so_ky_hieu"):
        lines.append(f"🔢 <b>Số/Ký hiệu:</b> {safe_html(detail.get('so_ky_hieu'))}")
    if detail.get("loai_van_ban"):
        lines.append(f"📑 <b>Loại văn bản:</b> {safe_html(detail.get('loai_van_ban'))}")
    if detail.get("don_vi_ban_hanh"):
        lines.append(f"🏛️ <b>Cơ quan ban hành:</b> {safe_html(detail.get('don_vi_ban_hanh'))}")
    if detail.get("nguoi_ky"):
        lines.append(f"✍️ <b>Người ký:</b> {safe_html(detail.get('nguoi_ky'))}")
    if detail.get("ngay_van_ban") and detail.get("ngay_van_ban") != "None":
        lines.append(f"📅 <b>Ngày văn bản:</b> {safe_html(detail.get('ngay_van_ban'))}")
    if detail.get("suggested_department"):
        lines.append(f"🏢 <b>Phòng ban gợi ý:</b> <b>{safe_html(detail.get('suggested_department'))}</b>")
    if detail.get("confidence"):
        try:
            val = float(detail["confidence"])
            pct = int(val * 100) if val <= 1.0 else int(val)
            lines.append(f"🎯 <b>Độ tin cậy AI:</b> {pct}% ({safe_html(detail.get('muc_tin_cay') or 'Cao')})")
        except Exception:
            pass

    if detail.get("trich_yeu"):
        lines.append(f"\n📝 <b>Trích yếu nội dung:</b>\n<i>{safe_html(detail.get('trich_yeu'))}</i>")
    if detail.get("summary"):
        lines.append(f"\n💡 <b>Tóm tắt AI:</b>\n{safe_html(detail.get('summary'))}")

    lines.append(f"\n⏱️ <b>Thời gian ghi nhận:</b> {safe_html(detail.get('created_at'))}")
    user_display = getattr(user, "display_name", None) or getattr(user, "full_name", None) or user.email
    lines.append(f"👤 <b>Người yêu cầu gửi:</b> {safe_html(user_display)}")

    message_text = "\n".join(lines)
    send_telegram_notification(bot_token, chat_id, message_text)

    return {
        "status": "success",
        "message": "Đã gửi kết quả xử lý văn bản tới tài khoản Telegram của bạn thành công!"
    }