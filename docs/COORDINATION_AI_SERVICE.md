# TÀI LIỆU PHỐI HỢP KỸ THUẬT VÀ ĐẶC TẢ API - PHÂN HỆ AI SERVER

> **Kính gửi:** Đội ngũ Phát triển Dịch vụ AI (AI Service Team)  
> **Dự án:** Hệ thống Tiếp nhận và Xử lý Văn bản Tự động - PTIT ADCS  
> **Từ phía:** Đội ngũ Phát triển Web Backend & Frontend (Main Website)  
> **Mục đích:** Thống nhất hợp đồng giao tiếp (API Contract), cấu trúc dữ liệu trao đổi và phối hợp triển khai các task kỹ thuật: **[W3]**, **[W7]**, **[W9]**, **[W13]**.

---

## 1. TỔNG HỢP NỘI DUNG CẦN PHỐI HỢP

| Mã Task | Tên Task | Nội dung phối hợp với AI Server |
| :--- | :--- | :--- |
| **[W7]** | Danh mục phòng ban cho AI | Chuyển từ danh sách 41 tên viết cứng sang cấu trúc JSON động có **Mã (`code`)**, **Tên (`name`)**, **Mô tả chức năng (`description`)**. AI trả kết quả gợi ý kèm `department_code`. |
| **[W9]** | Top-3 phòng ban & Cán bộ đề xuất | AI Service trả về danh sách **Top 3 phòng ban** có điểm tin cậy cao nhất kèm **lý do suy luận (`reasoning`)** và **người xử lý đề xuất (`proposed_assignees`)**. |
| **[W13]** | Cấu hình AI Config có hiệu lực | AI Service tiếp nhận các tham số động từ Web: `system_prompt`, `temperature`, `top_p`, `top_k`, `max_tokens` và ngưỡng tin cậy. |
| **[W3]** | Thời gian chờ tính theo số trang | Thống nhất cơ chế tính timeout động theo số trang văn bản (`page_count`), bỏ mốc timeout cố định 300s. |

---

## 2. ĐẶC TẢ CHI TIẾT TỪNG NỘI DUNG PHỐI HỢP

### 2.1. [W7] Cập nhật Danh mục Phòng ban Động & Ghép nối theo Mã

#### Bối cảnh hiện tại:
* Trước đây Web gửi mảng chuỗi gồm 41 tên phòng ban viết cứng. Nhiều phòng ban thiếu mô tả nhiệm vụ dẫn đến mô hình AI không đủ ngữ cảnh để phân loại (chỉ 2/33 văn bản ghép đúng).
* Khi trả về, AI chỉ trả tên chuỗi, Web Backend dùng regex so khớp tên dẫn đến tỷ lệ lỗi rất cao.

#### Yêu cầu thay đổi:
1. **Dữ liệu Web Backend gửi sang AI:**
   * Danh mục phòng ban được lấy động trực tiếp từ CSDL, mỗi phòng ban có đầy đủ:
     * `code`: Mã định danh phòng ban (VD: `"VP"`, `"P_DAO_TAO"`, `"K_CNTT1"`).
     * `name`: Tên phòng ban tiếng Việt.
     * `description`: Mô tả chi tiết chức năng, nhiệm vụ, quyền hạn theo quy định của Học viện.
2. **Logic phía AI Service:**
   * Nạp `description` vào prompt phân loại phòng ban (Department Routing Classification).
   * Khi trả về kết quả, AI Service bắt buộc phải trả kèm trường `department_code` tương ứng với mã phòng ban trong danh mục được cấp.

---

### 2.2. [W9] Trả về Top-3 Phòng ban Gợi ý kèm Lý do và Cán bộ Đề xuất

#### Yêu cầu cấu trúc dữ liệu trả về:
Thay vì chỉ trả về một object đơn `goi_y_phong_ban`, AI Service trả về mảng danh sách xếp hạng tối đa **3 phòng ban** phù hợp nhất:
* `suggested_departments`: Danh sách 3 phòng ban, mỗi phần tử gồm:
  * `department_code` *(string, bắt buộc)*: Mã phòng ban.
  * `department_name` *(string, bắt buộc)*: Tên phòng ban.
  * `confidence_score` *(float, từ 0.0 đến 1.0)*: Điểm tin cậy của gợi ý.
  * `reasoning` *(string, bắt buộc)*: Giải thích rõ ràng nguyên nhân dựa trên các căn cứ, điều khoản, nội dung trong văn bản mà đề xuất phòng ban này.
* `proposed_assignees`: Danh sách cán bộ được đề xuất xử lý:
  * `name` *(string)*: Họ tên cán bộ.
  * `position` *(string)*: Chức vụ / vai trò (Trưởng phòng, Chuyên viên chính...).
  * `department_code` *(string)*: Thuộc mã phòng ban nào.
  * `reasoning` *(string)*: Căn cứ đề xuất cán bộ này.

---

### 2.3. [W13] Áp dụng Tham số AI Config Động vào Mô hình

#### Yêu cầu:
Web Backend sẽ truyền một object JSON `ai_parameters` trong form data khi gọi API phân tích. Phía AI Service tiếp nhận và cấu hình tương ứng vào pipeline gọi LLM:
* `system_prompt`: Mẫu câu lệnh hệ thống tùy chỉnh (System Instruction). Nếu có, ghi đè prompt mặc định của AI Server.
* `temperature`: Độ sáng tạo sinh văn bản (mặc định 0.7).
* `max_tokens`: Giới hạn token sinh ra (mặc định 2048).
* `top_p`: Xác suất tích lũy (mặc định 0.9).
* `top_k`: Số lượng token ứng viên (mặc định 40).
* `confidence_threshold`: Ngưỡng tin cậy chấp nhận kết quả tự động (VD: 0.85).

---

### 2.4. [W3] Cơ chế Xử lý & Timeout theo Số Trang

* Web Backend sẽ tính toán số trang của file đính kèm (`page_count`) và truyền sang cho AI Service (trường `page_count`).
* Phía Web Backend thiết lập timeout cho HTTP Client theo công thức:
  $$\text{Timeout (giây)} = \max(60, \min(1800, 30 + \text{page\_count} \times 15))$$
* **Đề nghị từ phía AI Service:**
  * Nếu văn bản quá dài (> 100 trang) hoặc vượt ngưỡng tính toán, AI Service cần trả về mã lỗi `HTTP 413` hoặc JSON lỗi có mã `DOCUMENT_TOO_LARGE` thay vì treo socket.
  * Nếu AI Service có hỗ trợ WebSocket hoặc SSE báo tiến độ (progress callback: đã OCR trang x/y), vui lòng cung cấp tài liệu để Web Backend hiển thị thanh tiến độ thời gian thực cho người dùng.

---

## 3. ĐẶC TẢ HỢP ĐỒNG API (API CONTRACT SPECIFICATION)

### Endpoint Phân tích Văn bản
* **Method:** `POST`
* **URL:** `http://<AI_SERVICE_HOST>:<PORT>/api/v1/analyze-document`
* **Content-Type:** `multipart/form-data`
* **Headers:**
  * `X-Request-ID`: Chuỗi UUID định danh request để truy vết log (Logging Traceability).

---

### Request Payload (Form Data)

| Trường (Field) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `file` | Binary File | Có | Tệp văn bản cần xử lý (PDF, DOCX, DOC, JPG, PNG). |
| `document_id` | String (UUID) | Có | Mã định danh văn bản chung từ Web Backend (Ví dụ: `"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"`). |
| `save_document` | String ("true"/"false") | Không | Cờ lưu trữ văn bản vào Vector Database / Elastic. |
| `page_count` | Integer | Không | Số trang văn bản (được tính trước bởi Web). |
| `department_list` | String (JSON Array) | Có | Chuỗi JSON chứa danh mục phòng ban động (Xem mẫu dưới). |
| `ai_parameters` | String (JSON Object) | Không | Chuỗi JSON chứa các tham số cấu hình động từ Admin. |

#### Mẫu chuỗi `department_list` (JSON):
```json
[
  {
    "code": "VP",
    "name": "Văn phòng Học viện",
    "description": "Tham mưu tổng hợp, điều phối hoạt động hành chính, văn thư lưu trữ, quản lý con dấu, điều động xe công vụ và lễ tân đối ngoại."
  },
  {
    "code": "P_DAO_TAO",
    "name": "Phòng Đào tạo",
    "description": "Quản lý công tác tuyển sinh, xây dựng chương trình đào tạo đại học, tổ chức giảng dạy, quản lý điểm và cấp văn bằng tốt nghiệp."
  },
  {
    "code": "P_TCKT",
    "name": "Phòng Tài chính Kế toán",
    "description": "Quản lý tài chính, lập dự toán ngân sách, thanh quyết toán các khoản chi tiêu, thu học phí và các nghĩa vụ thuế đối với Nhà nước."
  },
  {
    "code": "P_QLKH",
    "name": "Phòng Quản lý Khoa học Công nghệ và Hợp tác Quốc tế",
    "description": "Quản lý các đề tài nghiên cứu khoa học các cấp, tổ chức hội thảo khoa học quốc tế, ký kết biên bản ghi nhớ hợp tác với đối tác nước ngoài."
  }
]
```

#### Mẫu chuỗi `ai_parameters` (JSON):
```json
{
  "system_prompt": "Bạn là chuyên gia phân tích văn bản quản lý nhà nước của Học viện Công nghệ Bưu chính Viễn thông. Hãy trích xuất thông tin chính xác và đề xuất phòng ban thụ lý.",
  "temperature": 0.7,
  "max_tokens": 2048,
  "top_p": 0.9,
  "top_k": 40,
  "confidence_threshold": 0.8
}
```

---

### Response Payload Chuẩn (JSON Response)

#### Trường hợp Xử lý Thành công (HTTP 200 OK):
```json
{
  "status": "success",
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "processing_time": 4.25,
  "source_pages": 3,
  "extracted_fields": {
    "so_hieu_van_ban": "125/QĐ-HV",
    "co_quan_ban_hanh": "Học viện Công nghệ Bưu chính Viễn thông",
    "ngay_ban_hanh": "2026-10-15",
    "trich_yeu": "Quyết định về việc ban hành quy định quản lý đề tài nghiên cứu khoa học sinh viên năm 2026",
    "nguoi_ky": "Đặng Hoài Bắc",
    "chuc_vu_nguoi_ky": "Giám đốc",
    "do_khan": "Thường",
    "noi_nhan": [
      "Như Điều 3",
      "Lưu: VT, QLKH"
    ],
    "can_cu_phap_ly": [
      "Luật Giáo dục Đại học năm 2012 và Luật sửa đổi năm 2018",
      "Nghị định số 99/2019/NĐ-CP của Chính phủ"
    ],
    "yeu_cau_hanh_dong": "Các Khoa, Viện và Phòng Quản lý Khoa học phổ biến quy định đến toàn thể giảng viên và sinh viên."
  },
  "tom_tat": "Văn bản ban hành quy định mới về quản lý, tài trợ kinh phí và tiêu chí nghiệm thu đề tài NCKH sinh viên cấp Học viện năm học 2026.",
  "key_points": [
    "Tăng mức kinh phí hỗ trợ tối đa lên 15 triệu đồng/đề tài.",
    "Bắt buộc có ít nhất 01 bài báo công bố trên kỷ yếu hội nghị sinh viên."
  ],
  "loai_van_ban": {
    "ma": "QD",
    "nhan": "Quyết định"
  },
  "suggested_departments": [
    {
      "department_code": "P_QLKH",
      "department_name": "Phòng Quản lý Khoa học Công nghệ và Hợp tác Quốc tế",
      "confidence_score": 0.95,
      "reasoning": "Văn bản quy định trực tiếp về đề tài nghiên cứu khoa học, thẩm quyền kiểm tra và nghiệm thu thuộc Phòng QLKH."
    },
    {
      "department_code": "P_DAO_TAO",
      "department_name": "Phòng Đào tạo",
      "confidence_score": 0.65,
      "reasoning": "Có liên quan đến đối tượng sinh viên và tính điểm tích lũy học phần nghiên cứu khoa học."
    },
    {
      "department_code": "VP",
      "department_name": "Văn phòng Học viện",
      "confidence_score": 0.40,
      "reasoning": "Cơ quan lưu trữ và ban hành thể thức văn bản."
    }
  ],
  "proposed_assignees": [
    {
      "name": "Trần Văn Cường",
      "position": "Phó Trưởng phòng QLKH",
      "department_code": "P_QLKH",
      "reasoning": "Phụ trách trực tiếp mảng Nghiên cứu Khoa học Sinh viên."
    }
  ],
  "de_xuat_thoi_han_xu_ly": {
    "so_ngay_xu_ly": 7,
    "ngay_het_han_du_kien": "2026-10-22",
    "can_cu": "Theo quy chế xử lý văn bản hành chính thông thường"
  },
  "diem_tin_cay": 0.95,
  "muc_tin_cay": "high",
  "storage_info": {
    "vector_id": "vec_9b1deb4d-3b7d-4bad-9bdd",
    "index_name": "ptit_adcs_documents_2026",
    "status": "indexed"
  }
}
```

#### Trường hợp Lỗi (HTTP 400 / 422 / 500):
```json
{
  "status": "error",
  "error_code": "OCR_EXTRACTION_FAILED",
  "message": "Không thể nhận diện nội dung văn bản. Tệp tin scan bị mờ hoặc có độ phân giải quá thấp (< 150 DPI).",
  "details": {
    "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "suggested_action": "Vui lòng yêu cầu người dùng quét lại văn bản với chất lượng cao hơn."
  }
}
```

---

## 4. KẾ HOẠCH KIỂM THỬ VÀ NGHIỆM THU TÍCH HỢP

1. **Giai đoạn 1 (Môi trường Staging/Dev):**
   * Đội AI Server triển khai cập nhật theo cấu trúc mới trên server test: `http://171.226.10.153:12006/api/v1/analyze-document`.
   * Đội Web Backend cập nhật mã nguồn gửi đúng mẫu Request có `department_list` động và `ai_parameters`.
   * Thực hiện kiểm thử với bộ dữ liệu mẫu (33 văn bản kiểm thử). Tiêu chí đạt: Tỷ lệ ghép đúng phòng ban tăng từ **2/33 lên >= 28/33**.
2. **Giai đoạn 2 (Kiểm thử tải & Timeout):**
   * Chạy thử tải văn bản dung lượng lớn (10MB, 50 trang). Xác nhận không bị lỗi timeout 300s và không xảy ra treo luồng worker.
3. **Đầu mối liên hệ kỹ thuật:**
   * Kỹ thuật phụ trách Web Backend: Nguyễn Hữu Hiếu (`hieudt`)
   * Kỹ thuật phụ trách AI Server: Vui lòng phản hồi xác nhận qua email/kênh Telegram trao đổi kỹ thuật.
