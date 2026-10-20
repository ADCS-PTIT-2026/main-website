"""
crawler_webhook.py - Nhận văn bản do crawler của Data Service thu thập (task D2).

Đặc tả: docs/COORDINATION_DATA_SERVICE.md mục 4.3. Crawler chép tệp vào thư mục
dùng chung /mnt/data2tb/adcs/uploads rồi gọi:

    POST /api/documents/webhook/crawler-ingest
    X-Service-Key: <SERVICE_INTERNAL_KEY>

Văn bản được ghi vào bảng documents với status "queued", priority 3, rồi hàng đợi
nền xử lý như văn bản người dùng tải lên. Văn bản người dùng (priority 1) luôn
được lấy trước. Không cần đăng nhập hay quyền theo vai trò, chỉ cần khóa dịch vụ.
Cột uploaded_by_user_id trong DB là NOT NULL, nên văn bản crawler được gắn cho tài
khoản CRAWLER_OWNER_USERNAME (mặc định "admin").

Mã trả về: 202 đã nhận; 409 đã nhận trước đó (crawler gửi lại từ outbox);
403 sai khóa; 422 dữ liệu hoặc tệp không hợp lệ (ngoài thư mục dùng chung, rỗng,
quá 50 MB hay 100 trang); 503 chưa cấu hình khóa hoặc tài khoản nhận văn bản.
"""
import io
import os
import secrets
import uuid
from datetime import datetime, time, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.services.document_queue_service import document_queue
from app.services.document_service import parse_date_string

router = APIRouter()

SHARED_UPLOAD_ROOT = os.path.realpath(os.getenv("CRAWLER_SHARED_ROOT", "/mnt/data2tb/adcs/uploads"))
MAX_FILE_SIZE = 50 * 1024 * 1024        # cùng giới hạn với /upload
MAX_PAGES = 100
# Cột documents.uploaded_by_user_id trong DB là NOT NULL: văn bản crawler gắn cho tài khoản này
CRAWLER_OWNER_USERNAME = os.getenv("CRAWLER_OWNER_USERNAME", "admin")


class CrawlerIngestRequest(BaseModel):
    document_id: uuid.UUID
    filename: str = Field(..., min_length=1, max_length=500)
    file_path: str
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    extra_files: List[str] = Field(default_factory=list)
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    external_id: Optional[str] = None
    section: Optional[str] = None
    so_hieu_van_ban: Optional[str] = None
    so_den: Optional[str] = None
    trich_yeu: Optional[str] = None
    co_quan_ban_hanh: Optional[str] = None
    ngay_ban_hanh: Optional[str] = None
    ngay_den: Optional[str] = None
    loai_van_ban: Optional[str] = None
    do_khan: Optional[str] = None
    source_type: Optional[str] = "crawler"
    priority: int = Field(3, ge=1, le=9)
    status: Optional[str] = "queued"
    created_at: Optional[str] = None


def _check_service_key(x_service_key: Optional[str] = Header(None, alias="X-Service-Key")) -> None:
    """Chạy như dependency, trước khi kiểm body: gọi không có khóa chỉ nhận 403, không thấy tên các trường."""
    expected = os.getenv("SERVICE_INTERNAL_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="Chưa cấu hình khóa dịch vụ nội bộ")
    if not x_service_key or not secrets.compare_digest(x_service_key.encode(), expected.encode()):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Yêu cầu khóa xác thực dịch vụ (X-Service-Key) hợp lệ.")


def _shared_file(path: str) -> str:
    """Chỉ nhận tệp thường nằm trong thư mục dùng chung (không theo symlink ra ngoài)."""
    real = os.path.realpath(path)
    if not (real.startswith(SHARED_UPLOAD_ROOT + os.sep) and os.path.isfile(real)):
        raise HTTPException(status_code=422, detail=f"file_path phải là tệp có thật trong {SHARED_UPLOAD_ROOT}")
    return real


def _page_count(path: str) -> int:
    if not path.lower().endswith(".pdf"):
        return 1
    try:
        import pypdf
        with open(path, "rb") as f:
            return len(pypdf.PdfReader(io.BytesIO(f.read())).pages)
    except Exception as e:      # noqa: BLE001 - tệp lạ vẫn nhận, để bước xử lý báo lỗi cụ thể
        logger.warning(f"[Crawler] Không đọc được số trang PDF {path}: {e}")
        return 1


def _owner_id(db: Session):
    user = db.query(User).filter(User.username == CRAWLER_OWNER_USERNAME).first()
    if user is None:
        raise HTTPException(status_code=503, detail=f"Chưa có tài khoản '{CRAWLER_OWNER_USERNAME}' để nhận văn bản "
                                                    "crawler (đặt CRAWLER_OWNER_USERNAME)")
    return user.user_id


def _cut(value: Optional[str], n: int) -> Optional[str]:
    value = (value or "").strip()
    return value[:n] if value else None


@router.post("/webhook/crawler-ingest", status_code=status.HTTP_202_ACCEPTED,
             dependencies=[Depends(_check_service_key)])
def crawler_ingest(
    payload: CrawlerIngestRequest,
    db: Session = Depends(get_db),
):
    """Crawler báo một văn bản mới: ghi vào hàng đợi xử lý với priority 3 (D2)."""
    duplicate = {"message": "Văn bản này đã được tiếp nhận trước đó", "document_id": str(payload.document_id)}
    if db.query(Document.document_id).filter(Document.document_id == payload.document_id).first():
        raise HTTPException(status_code=409, detail=duplicate)

    real = _shared_file(payload.file_path)
    size = os.path.getsize(real)
    if size == 0:
        raise HTTPException(status_code=422, detail="Tệp rỗng (0 byte), có thể tải về bị lỗi")
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail=f"Tệp {size / (1024 * 1024):.1f} MB vượt giới hạn 50 MB")
    pages = _page_count(real)
    if pages > MAX_PAGES:
        raise HTTPException(status_code=422, detail=f"Tài liệu có {pages} trang, vượt giới hạn {MAX_PAGES} trang")

    ngay_den = parse_date_string(payload.ngay_den)
    doc = Document(
        document_id=payload.document_id,
        status="queued",
        priority=payload.priority,
        uploaded_by_user_id=_owner_id(db),
        original_filename=payload.filename[:500],
        file_path=real,
        file_size_bytes=size,
        page_count=pages,
        retry_count=0,
        is_chua_doc=True,
        so_ky_hieu=_cut(payload.so_hieu_van_ban, 255),
        so_den=_cut(payload.so_den, 255),
        trich_yeu=_cut(payload.trich_yeu, 10000),
        don_vi_ban_hanh=_cut(payload.co_quan_ban_hanh, 2000),
        ngay_van_ban=parse_date_string(payload.ngay_ban_hanh),
        ngay_den=datetime.combine(ngay_den, time.min, tzinfo=timezone.utc) if ngay_den else None,
        loai_van_ban_text=_cut(payload.loai_van_ban, 100),
        do_khan=_cut(payload.do_khan, 50),
    )
    db.add(doc)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        # Hai lần gửi cùng document_id chạy song song: lần sau coi như đã nhận
        if db.query(Document.document_id).filter(Document.document_id == payload.document_id).first():
            raise HTTPException(status_code=409, detail=duplicate)
        logger.error(f"[Crawler] Không ghi được văn bản {payload.document_id}: {getattr(e, 'orig', e)}")
        raise HTTPException(status_code=500, detail="Không ghi được văn bản crawler vào DB Web")

    document_queue.notify()
    logger.info(f"[Crawler] Nhận văn bản {doc.document_id} ({payload.so_hieu_van_ban or payload.filename}, "
                f"{pages} trang, priority {payload.priority}) vào hàng đợi")
    return {
        "status": "success",
        "document_id": str(doc.document_id),
        "message": "Đã tiếp nhận văn bản crawler vào hàng đợi DB Web",
    }
