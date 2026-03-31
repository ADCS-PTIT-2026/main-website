# API Documentation — `POST /api/v1/analyze-document`

> **Version:** 2.0 — Cập nhật 30/03/2026  
> **Base URL:** `http://<host>:8005`  
> **Auth:** Không yêu cầu (internal service)  
> **Content-Type:** `multipart/form-data`

---

## Tổng quan

Endpoint nhận file tài liệu (PDF / DOCX / ảnh scan), thực hiện toàn bộ pipeline AI và gọi Data Service 1 lần duy nhất để lưu trữ + tìm tài liệu liên quan, trả về kết quả cấu trúc đầy đủ.

```
POST /api/v1/analyze-document
Content-Type: multipart/form-data
```

### Luồng xử lý bên trong

```
[Upload file + params]
        │
        ▼
1. Lưu file tạm (temp dir)
        │
        ▼
2. OCR / Text extraction
   ├── PDF native → pdfplumber
   ├── PDF scan   → Vintern-1B (Vision LLM)
   └── DOCX       → python-docx
        │
        ▼
3. Map-Reduce LLM (Qwen primary / Gemini fallback)
   ├── MAP:    Chia text → N chunks → phân tích song song
   └── REDUCE: Tổng hợp → 1 JSON chuẩn
              └── Inject department_list vào REDUCE prompt
        │
        ▼
4. Data Service — 1 lần gọi duy nhất (POST /api/v1/ingest/ocr)
   ├── save_document=true  → Chunk+Embed+LƯU DB → Tìm 5 tài liệu liên quan
   └── save_document=false → Tìm 5 tài liệu liên quan (TUYỆT ĐỐI không lưu)
        │
        ▼
[Response JSON]
```

---

## Request Parameters

Gửi dưới dạng `multipart/form-data`:

| Field | Type | Required | Default | Mô tả |
|---|---|---|---|---|
| `file` | `file` | ✅ | — | File tài liệu cần phân tích |
| `document_id` | `integer` | ❌ | `0` | ID tài liệu trong DB (do Web Backend cung cấp) |
| `save_document` | `boolean` | ❌ | `false` | Cờ lưu tài liệu vào DB/VectorDB |
| `department_list` | `string` (JSON array) | ❌ | `null` | Danh sách phòng ban để AI gợi ý điều hướng |

### Chi tiết từng tham số

#### `document_id`
ID tài liệu được gán bởi Web Backend trước khi gọi AI Service. Được gửi đến Data Service để liên kết với bản ghi trong database.
- Nếu `0` hoặc không truyền → Data Service sẽ tự xử lý (tùy cấu hình phía Data Service).

#### `save_document`

| Giá trị | Hành vi |
|---|---|
| `false` *(mặc định)* | Phân tích AI → Tìm tài liệu liên quan. **TUYỆT ĐỐI không lưu** |
| `true` | Phân tích AI → **Lưu vào DB/VectorDB + File 2TB** → Tìm tài liệu liên quan |

> [!IMPORTANT]
> Khi `save_document=false`, hệ thống **không lưu bất kỳ dữ liệu nào** — kể cả metadata, file, hay embedding. Đảm bảo bởi `DocumentStorageOrchestrator`.

#### `department_list`

JSON array string danh sách phòng ban để AI ưu tiên khi gợi ý điều hướng.

```
'["Phòng Đào tạo", "Phòng Tài chính – Kế toán", "Văn phòng"]'
```

- **Nếu truyền** → AI chỉ gợi ý phòng ban trong danh sách này (inject vào REDUCE prompt).
- **Nếu không truyền / null** → AI dùng toàn bộ danh sách ~40 phòng ban mặc định của hệ thống.
- **JSON sai format** → Cảnh báo (log) + tự động fallback về mặc định, không crash.

### Định dạng file hỗ trợ

| Định dạng | Loại | Ghi chú |
|---|---|---|
| `.pdf` | PDF native | Trích xuất text trực tiếp (pdfplumber) |
| `.pdf` | PDF scan | OCR bằng Vintern-1B vision model |
| `.docx` | Word | python-docx |
| `.png`, `.jpg`, `.jpeg` | Ảnh scan | OCR bằng Vintern-1B |
| `.txt` | Text thuần | Đọc trực tiếp |

---

## Ví dụ Request

### cURL — Đầy đủ tham số

```bash
# Phân tích + lưu vào hệ thống, truyền danh sách phòng ban cụ thể
curl -X POST http://localhost:8005/api/v1/analyze-document \
  -F "file=@QD_BanGiamDoc.pdf" \
  -F "document_id=456" \
  -F "save_document=true" \
  -F 'department_list=["Phòng Đào tạo","Phòng Tài chính – Kế toán","Văn phòng"]'

# Phân tích không lưu, dùng danh sách phòng ban mặc định
curl -X POST http://localhost:8005/api/v1/analyze-document \
  -F "file=@van_ban.pdf" \
  -F "save_document=false"
```

### JavaScript / Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('document_id', '456');
formData.append('save_document', 'true');
// Truyền department_list nếu BE đã biết danh sách phòng ban của tổ chức
formData.append('department_list', JSON.stringify([
  'Phòng Đào tạo',
  'Phòng Tài chính – Kế toán',
  'Văn phòng',
]));

const response = await fetch('http://localhost:8005/api/v1/analyze-document', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

---

## Response Body

**HTTP 200 OK** — `Content-Type: application/json`

### Cấu trúc tổng quan

```json
{
  // ── Kết quả từ LLM (Map-Reduce) ─────────────────────────────
  "trang_thai": "success",
  "tom_tat": "...",
  "key_points": [...],
  "loai_van_ban": { ... },
  "extracted_fields": { ... },
  "de_xuat_thoi_han_xu_ly": { ... },
  "goi_y_phong_ban": { ... },
  "diem_tin_cay": 0.0,
  "muc_tin_cay": "high",
  "tong_so_chunk": 3,

  // ── Data Service (lưu trữ + semantic search) ─────────────────
  "storage_info": { ... },
  "related_documents": [...],

  // ── Meta ─────────────────────────────────────────────────────
  "processing_time": 22.4
}
```

---

### Chi tiết từng field

#### Nhóm LLM Result

| Field | Type | Mô tả |
|---|---|---|
| `trang_thai` | `string` | `"success"` hoặc `"error"` |
| `tom_tat` | `string` | Tóm tắt toàn bộ văn bản (4–6 câu) |
| `key_points` | `string[]` | 3–5 điểm chính quan trọng nhất |
| `loai_van_ban` | `object` | Phân loại loại văn bản |
| `extracted_fields` | `object` | Metadata trích xuất (xem chi tiết bên dưới) |
| `de_xuat_thoi_han_xu_ly` | `object` | Đề xuất thời hạn xử lý từ AI |
| `goi_y_phong_ban` | `object` | Gợi ý phòng ban xử lý |
| `diem_tin_cay` | `float` | Điểm tin cậy tổng `[0.0 – 1.0]` |
| `muc_tin_cay` | `string` | `"high"` \| `"medium"` \| `"low"` \| `"very_low"` |
| `tong_so_chunk` | `integer` | Số lượng chunk đã xử lý qua Map-Reduce |

#### `loai_van_ban`

```json
{
  "nhan": "cong_van",
  "diem_tin_cay": 0.92
}
```

| `nhan` value | Ý nghĩa |
|---|---|
| `cong_van` | Công văn hành chính |
| `quyet_dinh` | Quyết định |
| `thong_tu` | Thông tư |
| `nghi_quyet` | Nghị quyết |
| `thong_bao` | Thông báo |
| `huong_dan` | Hướng dẫn |
| `bao_cao` | Báo cáo |
| `ke_hoach` | Kế hoạch |
| `hop_dong` | Hợp đồng |
| `don_thu` | Đơn từ / Kiến nghị |
| `other` | Loại khác |

#### `extracted_fields`

```json
{
  "so_hieu_van_ban": "123/QĐ-HVBC",
  "ngay_ban_hanh": "2025-03-15",
  "co_quan_ban_hanh": "Học viện Công nghệ Bưu chính Viễn thông",
  "nguoi_ky": "Nguyễn Văn A",
  "chuc_vu_nguoi_ky": "Giám đốc",
  "noi_nhan": ["Phòng Đào tạo", "Phòng Tài chính"],
  "trich_yeu": "Về việc ban hành quy chế đào tạo năm 2025",
  "can_cu_phap_ly": ["Luật Giáo dục đại học 2012"],
  "yeu_cau_hanh_dong": "Triển khai trước ngày 01/04/2025",
  "do_khan": "khan"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `so_hieu_van_ban` | `string \| null` | Số hiệu văn bản |
| `ngay_ban_hanh` | `string \| null` | Ngày ban hành `YYYY-MM-DD` |
| `co_quan_ban_hanh` | `string \| null` | Tên cơ quan ban hành |
| `nguoi_ky` | `string \| null` | Họ tên người ký |
| `chuc_vu_nguoi_ky` | `string \| null` | Chức vụ người ký |
| `noi_nhan` | `string[]` | Danh sách đơn vị/cá nhân nhận |
| `trich_yeu` | `string \| null` | Trích yếu nội dung |
| `can_cu_phap_ly` | `string[]` | Căn cứ pháp lý |
| `yeu_cau_hanh_dong` | `string \| null` | Yêu cầu/nhiệm vụ cần thực hiện |
| `do_khan` | `string \| null` | `"thuong"` \| `"khan"` \| `"thuong_khan"` \| `null` |

#### `de_xuat_thoi_han_xu_ly`

AI tự đề xuất — **không** trích từ nội dung văn bản.

```json
{
  "so_ngay_de_xuat": 3,
  "muc_uu_tien": "khẩn cấp",
  "ly_do": "Văn bản có mức độ khẩn, thường xử lý trong 1–3 ngày."
}
```

#### `goi_y_phong_ban`

Được gợi ý dựa trên `department_list` truyền vào (nếu có) hoặc danh sách mặc định.

```json
{
  "phong_ban": "phong_dao_tao",
  "ten_hien_thi": "Phòng Đào tạo",
  "nguoi_xu_ly_de_xuat": null,
  "ly_do": "Văn bản liên quan đến quy chế đào tạo.",
  "diem_tin_cay": 0.95
}
```

| Field | Type | Mô tả |
|---|---|---|
| `phong_ban` | `string` | Key phòng ban |
| `ten_hien_thi` | `string` | Tên tiếng Việt đầy đủ |
| `nguoi_xu_ly_de_xuat` | `string \| null` | Chức vụ/tên người xử lý nếu văn bản ghi rõ |
| `ly_do` | `string` | Lý do gợi ý |
| `diem_tin_cay` | `float` | Độ tin cậy `[0.0 – 1.0]` |

#### `storage_info`

Thông tin lưu trữ từ Data Service.

```json
{
  "save_document": true,
  "num_chunks": 10,
  "chunk_types": {"text": 7, "header": 1, "summary": 1, "key_point": 1},
  "message": "Đã tạo 10 chunks, file lưu tại: /mnt/.../doc_456/...",
  "storage": {
    "success": true,
    "document_id": 456,
    "message": "Đã lưu thành công"
  },
  "data_service": {
    "is_mock": false,
    "connected": true
  }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `save_document` | `boolean` | Echo lại flag đã gửi |
| `num_chunks` | `integer` | Số chunks đã tạo và embed |
| `chunk_types` | `object` | Phân loại chunks theo loại |
| `message` | `string` | Thông báo từ Data Service |
| `storage` | `object \| null` | Kết quả lưu file (`null` nếu `save_document=false`) |
| `storage.success` | `boolean` | Lưu thành công hay không |
| `storage.document_id` | `integer` | ID tài liệu đã lưu |
| `data_service.is_mock` | `boolean` | `true` khi Data Service chưa kết nối thật |
| `data_service.connected` | `boolean` | `true` khi đang gọi Data Service thật |

#### `related_documents`

Danh sách tài liệu liên quan từ semantic search của Data Service.

> [!NOTE]
> Trả về `[]` khi Data Service ở MOCK mode (`DATA_SERVICE_URL` chưa set trong `.env`).
> `related_documents` chỉ có kết quả khi `summary` có nội dung và DB đã có ít nhất 1 tài liệu được embed trước đó.

Cấu trúc từng item (khi Data Service kết nối thật):

```json
{
  "document_id": 12,
  "so_ky_hieu": "872/BKHCN-VP",
  "trich_yeu": "Thông báo tổ chức hội nghị tổng kết năm 2025",
  "don_vi_ban_hanh": "Bộ KH&CN",
  "ngay_van_ban": "2025-12-10",
  "similarity": 0.8769,
  "matched_chunk": "Bộ KH&CN tổ chức hội nghị tổng kết...",
  "chunk_path": "Tóm tắt"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `document_id` | `integer` | ID tài liệu liên quan |
| `so_ky_hieu` | `string \| null` | Số ký hiệu văn bản |
| `trich_yeu` | `string \| null` | Trích yếu văn bản liên quan |
| `don_vi_ban_hanh` | `string \| null` | Đơn vị ban hành |
| `ngay_van_ban` | `string \| null` | Ngày ban hành `YYYY-MM-DD` |
| `similarity` | `float` | Điểm tương đồng `[0.0 – 1.0]` |
| `matched_chunk` | `string \| null` | Đoạn text khớp nhất |
| `chunk_path` | `string \| null` | Vị trí trong tài liệu (VD: "Tóm tắt", "Chương I") |

---

## Ví dụ Response đầy đủ

```json
{
  "trang_thai": "success",
  "tom_tat": "Quyết định bổ nhiệm ông Nguyễn Văn A làm Trưởng phòng Đào tạo kể từ ngày 01/04/2026.",
  "key_points": [
    "Bổ nhiệm ông Nguyễn Văn A làm Trưởng phòng Đào tạo.",
    "Quyết định có hiệu lực từ ngày 01/04/2026.",
    "Phòng Tổ chức Cán bộ chịu trách nhiệm thực hiện."
  ],
  "loai_van_ban": {
    "nhan": "quyet_dinh",
    "diem_tin_cay": 0.97
  },
  "extracted_fields": {
    "so_hieu_van_ban": "456/QĐ-HVBC",
    "ngay_ban_hanh": "2026-03-30",
    "co_quan_ban_hanh": "Học viện Công nghệ Bưu chính Viễn thông",
    "nguoi_ky": "Trần Văn B",
    "chuc_vu_nguoi_ky": "Giám đốc",
    "noi_nhan": ["Phòng Tổ chức Cán bộ", "Phòng Đào tạo", "Ông Nguyễn Văn A"],
    "trich_yeu": "Về việc bổ nhiệm Trưởng phòng Đào tạo",
    "can_cu_phap_ly": ["Quy chế tổ chức và hoạt động của Học viện"],
    "yeu_cau_hanh_dong": "Phòng TCCB chịu trách nhiệm thực hiện quyết định này",
    "do_khan": null
  },
  "de_xuat_thoi_han_xu_ly": {
    "so_ngay_de_xuat": 5,
    "muc_uu_tien": "bình thường",
    "ly_do": "Quyết định hành chính thông thường, không có tính khẩn."
  },
  "goi_y_phong_ban": {
    "phong_ban": "phong_to_chuc_can_bo",
    "ten_hien_thi": "Phòng Tổ chức Cán bộ",
    "nguoi_xu_ly_de_xuat": "Trưởng phòng Tổ chức Cán bộ",
    "ly_do": "Văn bản về công tác nhân sự, trực tiếp giao Phòng TCCB thực hiện.",
    "diem_tin_cay": 0.98
  },
  "diem_tin_cay": 0.95,
  "muc_tin_cay": "high",
  "tong_so_chunk": 2,
  "storage_info": {
    "save_document": true,
    "num_chunks": 8,
    "chunk_types": {"text": 5, "header": 1, "summary": 1, "key_point": 1},
    "message": "Đã tạo 8 chunks, file lưu tại: /mnt/data2tb/adcs/uploads/doc_456/att_1_QD.pdf",
    "storage": {
      "success": true,
      "document_id": 456,
      "message": "Đã lưu thành công"
    },
    "data_service": {
      "is_mock": false,
      "connected": true
    }
  },
  "related_documents": [
    {
      "document_id": 12,
      "so_ky_hieu": "123/QĐ-HVBC",
      "trich_yeu": "Về việc bổ nhiệm Trưởng phòng Tổ chức Cán bộ",
      "don_vi_ban_hanh": "HVBC",
      "ngay_van_ban": "2025-01-15",
      "similarity": 0.91,
      "matched_chunk": "bổ nhiệm ông... làm Trưởng phòng...",
      "chunk_path": "Tóm tắt"
    }
  ],
  "processing_time": 24.7
}
```

---

## Error Responses

| HTTP | Trường hợp | Response body |
|---|---|---|
| `400` | Không có filename | `{"detail": "Filename is required"}` |
| `400` | `department_list` JSON sai format | Log WARNING, **không crash** — fallback mặc định |
| `500` | Không khởi tạo được AI agent | `{"detail": "Could not initialize AI agent"}` |
| `500` | Lỗi nội bộ | `{"detail": "Internal server error: <message>"}` |

---

## Lưu ý tích hợp cho Frontend

> [!IMPORTANT]
> **`save_document` flag** — Frontend **phải hỏi người dùng** trước khi gửi:
> *"Bạn có muốn lưu tài liệu này vào hệ thống không?"*
> → `save_document=true` nếu đồng ý, `save_document=false` nếu không.

> [!TIP]
> **`department_list`** — Nên truyền danh sách phòng ban thực tế của tổ chức để AI gợi ý chính xác hơn. Backend nên cache danh sách này và truyền cùng mỗi request thay vì để AI đoán từ danh sách mặc định.

> [!NOTE]
> **`related_documents`** trả về `[]` khi Data Service ở MOCK mode. FE có thể dùng `storage_info.data_service.is_mock` để kiểm tra và hiển thị placeholder phù hợp.

> [!TIP]
> **Thời gian xử lý:** API mất **15–45 giây** tùy độ dài tài liệu. Frontend nên set timeout ≥ 60s và hiển thị loading state rõ ràng với progress indicator.

> [!WARNING]
> **`data_service.is_mock === true`** — Khi `true`, `storage` và `related_documents` là dữ liệu giả. FE có thể hiển thị badge *"[Demo]"* để người dùng biết.

---

## Danh sách `phong_ban` hợp lệ (mặc định)

Chỉ relevant khi **không** truyền `department_list`. Khi truyền `department_list`, AI ưu tiên gợi ý trong danh sách đó.

| Key | Tên hiển thị |
|---|---|
| `van_phong` | Văn phòng |
| `phong_dao_tao` | Phòng Đào tạo |
| `phong_giao_vu` | Phòng Giáo vụ |
| `phong_chinh_tri_ctsv` | Phòng Chính trị & CTSV |
| `khoa_sau_dai_hoc` | Khoa Đào tạo Sau đại học |
| `phong_tai_chinh_ke_toan` | Phòng Tài chính – Kế toán |
| `phong_qlkh_htqt` | Phòng QLKH & HTQT |
| `phong_ke_hoach_dau_tu` | Phòng Kế hoạch – Đầu tư |
| `phong_to_chuc_can_bo` | Phòng Tổ chức Cán bộ |
| `tt_khao_thi_dbclgd` | TT. Khảo thí & ĐBCLGD |
| `tt_thi_nghiem_thuc_hanh` | TT. Thí nghiệm Thực hành |
| `tt_dao_tao_quoc_te` | TT. Đào tạo Quốc tế |
| `tt_dich_vu` | Trung tâm Dịch vụ |
| `vien_khkt_buu_dien` | Viện KH Kỹ thuật Bưu Điện |
| `vien_kinh_te_buu_dien` | Viện Kinh tế Bưu điện |
| `vien_cntt_truyen_thong` | Viện CNTT–Truyền thông |
| `khoa_co_ban_1` | Khoa Cơ bản 1 (HN) |
| `khoa_vien_thong_1` | Khoa Viễn thông 1 (HN) |
| `khoa_cntt_1` | Khoa CNTT 1 (HN) |
| `khoa_ktdt_1` | Khoa Kỹ thuật Điện tử 1 |
| `khoa_qtkd_1` | Khoa QTKD 1 (HN) |
| `khoa_tckt` | Khoa Tài chính – Kế toán |
| `khoa_da_phuong_tien` | Khoa Đa phương tiện |
| `ban_giam_doc` | Ban Giám đốc |
| `hoi_dong_hoc_vien` | Hội đồng Học viện |
| `unknown` | Không xác định |
