import requests
import html
from app.models.document import Document
from app.models.user import User
from app.core.logger import logger

def send_telegram_ai_result(bot_token: str, user: User, document: Document):
    """
    Hàm này sẽ định dạng nội dung và gửi tin nhắn qua Telegram.
    Sẽ được gọi dưới dạng Background Task.
    """

    chat_id = getattr(user, 'telegram_chat_id', None)
    
    if not chat_id:
        logger.warning(f"Người dùng {user.email} chưa cấu hình Telegram Chat ID. Bỏ qua tác vụ gửi tin nhắn.")
        return {"status": "not_configured", "detail": "No Chat ID"}

    if not bot_token:
        logger.error(f"Không có Bot Token trong hệ thống. Hủy gửi tin nhắn Telegram cho {user.email}.")
        return {"status": "bot_not_found", "detail": "No Bot Token"}
    
    def safe_html(text):
        if text is None:
            return "N/A"
        return html.escape(str(text))

    message = (
        f"🤖 <b>HỆ THỐNG AI VỪA XỬ LÝ XONG VĂN BẢN</b>\n\n"
        f"<b>Văn bản:</b> <code>{safe_html(document.trich_yeu)}</code>\n"
        f"<b>Số đến:</b> {safe_html(document.so_den)}\n"
        f"<b>Số/Ký hiệu:</b> {safe_html(document.so_ky_hieu)}\n"
        f"<b>Loại văn bản:</b> {safe_html(document.loai_van_ban_text)}\n"
        f"<b>Cơ quan ban hành:</b> {safe_html(document.don_vi_ban_hanh)}\n"
        f"<b>Người ký:</b> {safe_html(document.nguoi_ky)}\n"
        f"<b>Ngày văn bản:</b> {safe_html(document.ngay_van_ban)}\n"
        f"<b>Độ khẩn:</b> {safe_html(document.do_khan)}\n\n"
        f"<b>Nơi nhận: </b>\n{safe_html(document.noi_nhan)}"
        f"<b>Tóm tắt AI:</b>\n{safe_html(document.summary)}"
        f"<b>Thời gian xử lý</b>\n{safe_html(document.processing_time)}"
        f"<b>Đề xuất xử lý: </b>\n{safe_html(document.de_xuat_xu_ly)}"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        logger.info(f"Đang tiến hành gửi thông báo Telegram cho user {user.email} (chat_id: {chat_id})")
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        logger.info(f"Gửi thông báo Telegram THÀNH CÔNG cho user {user.email}")
        return {"status": "success", "detail": "Message sent"}
        
    except requests.exceptions.RequestException as e:
        error_msg = e.response.text if getattr(e, 'response', None) is not None else str(e)
        logger.error(f"Gửi thông báo Telegram THẤT BẠI cho user {user.email}. Chi tiết lỗi: {error_msg}", exc_info=True)
        return {"status": "error", "detail": error_msg}