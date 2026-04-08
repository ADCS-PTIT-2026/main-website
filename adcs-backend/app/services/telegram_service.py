import requests
from app.models.document import Document
from app.models.user import User

def send_telegram_ai_result(bot_token: str, user: User, document: Document):
    """
    Hàm này sẽ định dạng nội dung và gửi tin nhắn qua Telegram.
    Sẽ được gọi dưới dạng Background Task.
    """
    # Lấy chat_id của user
    chat_id = getattr(user, 'telegram_chat_id', None)
    
    if not chat_id:
        print(f"[Telegram] Người dùng {user.email} chưa cấu hình Telegram Chat ID.")
        return

    if not bot_token:
        print("[Telegram Warning] Không có Bot Token. Hủy gửi tin nhắn.")
        return

    # Định dạng tin nhắn gửi đi (Sử dụng Markdown)
    message = (
        f"🤖 **HỆ THỐNG AI VỪA XỬ LÝ XONG VĂN BẢN**\n\n"
        f"**ID Tài liệu:** `{document.document_id}`\n"
        f"**Số đến:** {document.so_den or 'N/A'}\n"
        f"**Số/Ký hiệu:** {document.so_ky_hieu or 'N/A'}\n"
        f"**Loại văn bản:** {document.loai_van_ban_text or 'N/A'}\n"
        f"**Cơ quan ban hành:** {document.don_vi_ban_hanh or 'N/A'}\n"
        f"**Ngày văn bản:** {document.ngay_van_ban or 'N/A'}\n"
        f"**Độ khẩn:** {document.do_khan or 'Bình thường'}\n\n"
        f"**Trích yếu:**\n_{document.trich_yeu or 'Không có thông tin'}_\n\n"
        f"**Tóm tắt AI:**\n{document.summary or 'Không có tóm tắt'}"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print(f"[Telegram] Đã gửi thông báo thành công tới user {user.email}")
    except requests.exceptions.RequestException as e:
        print(f"[Telegram Error] Lỗi khi gọi API Telegram: {e}")
        # In ra chi tiết lỗi từ Telegram (VD: sai token, user chặn bot...)
        if e.response is not None:
            print(f"[Telegram Error Detail] {e.response.text}")