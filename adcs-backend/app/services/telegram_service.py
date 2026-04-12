import requests
from app.models.document import Document
from app.models.user import User
import html

def send_telegram_ai_result(bot_token: str, user: User, document: Document):
    """
    Hàm này sẽ định dạng nội dung và gửi tin nhắn qua Telegram.
    Sẽ được gọi dưới dạng Background Task.
    """

    chat_id = getattr(user, 'telegram_chat_id', None)
    
    if not chat_id:
        print(f"[Telegram] Người dùng {user.email} chưa cấu hình Telegram Chat ID.")
        return

    if not bot_token:
        print("[Telegram Warning] Không có Bot Token. Hủy gửi tin nhắn.")
        return
    
    def safe_html(text):
        if text is None:
            return "N/A"
        return html.escape(str(text))

    # Định dạng tin nhắn gửi đi (Sử dụng Markdown)
    message = (
        f"🤖 <b>HỆ THỐNG AI VỪA XỬ LÝ XONG VĂN BẢN</b>\n\n"
        f"<b>ID Tài liệu:</b> <code>{safe_html(document.document_id)}</code>\n"
        f"<b>Số đến:</b> {safe_html(document.so_den)}\n"
        f"<b>Số/Ký hiệu:</b> {safe_html(document.so_ky_hieu)}\n"
        f"<b>Loại văn bản:</b> {safe_html(document.loai_van_ban_text)}\n"
        f"<b>Cơ quan ban hành:</b> {safe_html(document.don_vi_ban_hanh)}\n"
        f"<b>Ngày văn bản:</b> {safe_html(document.ngay_van_ban)}\n"
        f"<b>Độ khẩn:</b> {safe_html(document.do_khan)}\n\n"
        f"<b>Trích yếu:</b>\n<i>{safe_html(document.trich_yeu)}</i>\n\n"
        f"<b>Tóm tắt AI:</b>\n{safe_html(document.summary)}"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return {"status": "success", "detail": "Message sent"}
    except requests.exceptions.RequestException as e:
        error_msg = e.response.text if e.response else str(e)
        return {"status": "error", "detail": error_msg}