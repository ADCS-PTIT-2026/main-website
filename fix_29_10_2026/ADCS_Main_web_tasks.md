# ADCS – Main web: Danh sách task cần làm / sửa

- **Nguồn:** `ADCS - Công việc 25-10-2026.xlsx` (sheet *Main web*)
- **Phụ trách:** Nguyễn Hiển – `main-website` (backend + frontend)
- **Kiểm thử:** adcs.ptitai.org ngày 25/10/2026, kiểm lại ngày 28/10/2026
- **Chưa gồm:** lỗi thông báo (làm sau)
- **Ngày bắt đầu / hạn chót:** dev tự điền (hiện đang để trống ở tất cả task)
- **Tổng:** 12 task – Cao: 2 · Trung bình: 4 · Thấp: 6 · Tất cả đang "Chưa thực hiện"

## Tổng quan

| Mã | Tóm tắt | Ưu tiên | Phụ thuộc bên ngoài |
|----|---------|---------|---------------------|
| L1 | Dịch văn bản: mọi lượt gửi bị từ chối (503) | Cao | Dataservice L1 |
| L2 | Kho văn bản không tìm được văn bản Data Service, không tìm theo nghĩa | Cao | Dataservice L2, AI service L2, PM chốt quy tắc quyền xem |
| L3 | Văn bản lỗi chỉ hiện câu chung chung | Trung bình | AI service L0, L3 |
| L4 | Hủy văn bản đang chờ lại bị tính là "Thất bại" | Trung bình | – |
| L5 | Hàng chờ chỉ xử lý 1 văn bản mỗi lúc | Trung bình | – (còn lại từ W3) |
| L6 | Gửi nhiều file cùng lúc, mỗi file upload mất 5–10 giây | Trung bình | – |
| L7 | Đăng nhập sai không bị chặn | Thấp | – |
| L8 | Ô tìm kiếm "Lịch sử xử lý" không lọc | Thấp | Dataservice L8 (còn lại từ W14) |
| L9 | Lịch sử ghi sai loại file và sai trạng thái bước AI | Thấp | – |
| L10 | Đăng ký được bằng email không phải PTIT | Thấp | – |
| L11 | Link chân màn đăng nhập bấm không có tác dụng | Thấp | – (còn lại từ W14) |
| L12 | Bảng "Tài khoản" trong Trang Quản lý bị chật, chữ tràn | Thấp | – |

---

## Ưu tiên Cao

### [L1] Không dịch được văn bản: gửi file nào cũng báo lỗi

**Lỗi là gì:** Chức năng dịch đang bị tắt ở backend nên mọi lượt gửi dịch đều bị từ chối. Trang Dịch vẫn cho chọn file và bấm gửi bình thường, rồi báo một lỗi chung chung, người dùng tưởng do file của mình.

**Cách tái hiện:**
1. Vào "Dịch thuật văn bản"
2. Chọn 1 file PDF bất kỳ (đã thử công văn 1 trang), chọn ngôn ngữ, bấm gửi

**Thực tế (25/10 và 28/10):** web báo "Lỗi khi tải tệp lên. Vui lòng thử lại." API trả lỗi 503: "Dịch bất đồng bộ chưa được bật hoặc chưa xác nhận hợp đồng chống tạo job lặp".

**Mong muốn:** dịch được. Trong lúc chức năng còn tắt, trang Dịch phải ghi rõ "Chức năng dịch tạm ngừng" và khóa nút gửi.

**Nguyên nhân:** backend chỉ cho dịch khi bật đủ 3 cờ cấu hình (biến môi trường): `DS_TRANSLATION_JOBS_ENABLED`, `INTEGRATION_WORKER_ENABLED`, `DS_JOB_IDEMPOTENCY_CONFIRMED` (`translation_service.py` dòng 26). Worker đang chạy nên `INTEGRATION_WORKER_ENABLED` đã bật; cờ đang tắt là 1 trong 2 cờ còn lại. `DS_JOB_IDEMPOTENCY_CONFIRMED` chỉ nên bật khi Data Service chống được việc tạo trùng job dịch (Dataservice L1).

**Cần làm:**
- [ ] Khi Data Service xong L1: bật `DS_TRANSLATION_JOBS_ENABLED` và `DS_JOB_IDEMPOTENCY_CONFIRMED`, thử dịch lại 1 file
- [ ] Ngay bây giờ: trang Dịch kiểm tra chức năng dịch có bật không; nếu tắt thì khóa nút gửi và ghi rõ lý do
- [ ] Hiện đúng thông báo lỗi backend trả về, thay cho câu "Lỗi khi tải tệp lên"

**Làm cùng:** L1 (Dataservice – Trọng Hiếu)

---

### [L2] Kho văn bản không tìm được văn bản trong kho Data Service, không tìm theo nghĩa

**Lỗi là gì:** Ô tìm kiếm ở "Kho văn bản" chỉ tìm khớp đúng chữ trong 61 văn bản upload trên Web. Hơn 500 văn bản crawler lấy về nằm trong kho Data Service thì không tìm thấy. Gõ từ cùng nghĩa nhưng khác chữ cũng không ra. Trang Kho vẫn ghi "Tra cứu ngữ nghĩa (Semantic Search)".

**Cách tái hiện:**
1. Vào "Kho văn bản"
2. Lần lượt tìm các từ khóa dưới đây

**Thực tế (25/10, kiểm lại 28/10):**

| Từ khóa | Kết quả | Ghi chú |
|---------|---------|---------|
| "tuyển dụng" | 5 | đều là văn bản Web có đúng chữ "tuyển dụng" |
| "tuyển người" | 0 | cùng nghĩa, lẽ ra phải ra các văn bản trên |
| "liêm chính trong nghiên cứu khoa học" | 0 | ngày 14/10 tìm ra Quyết định 2557/QĐ-BKHCN, độ tương đồng 0,88 |
| "văn bằng chứng chỉ" | 0 | kho có văn bản 1128/QLCL-PQLVBCC |

**Mong muốn:** tìm theo nghĩa trên toàn bộ kho (văn bản Web và văn bản crawler), chỉ hiện văn bản người dùng được xem.

**Nguyên nhân:** kho Data Service có dữ liệu (541 văn bản, 27.816 đoạn theo tài liệu kiểm thử của Data Service ngày 20/10), nhưng Web chưa tìm vào kho vì 3 lý do, phải gỡ cả 3:
1. Cờ `DS_SEARCH_ENABLED` đang tắt nên backend chỉ tìm khớp chữ trong DB Web (`repository_search.py` dòng 23–31). API `/api/documents/search-capabilities` trả `data_service_search: false`.
2. Chưa lọc quyền: Web gửi kèm danh sách văn bản người dùng được xem, Data Service chưa lọc theo danh sách này (Dataservice L2). Bật cờ lúc này thì tìm kiếm sẽ báo lỗi 502.
3. Văn bản trong kho chưa gắn mã văn bản Web (AI service L2); 541 văn bản crawler cũ không có bản ghi bên Web.

**Cần làm:**
- [ ] Khi Data Service và AI Service xong L2: bật `DS_SEARCH_ENABLED`, `DS_SEARCH_ACL_CONFIRMED`, tìm lại các từ khóa trên
- [ ] Văn bản crawler cũ: làm theo quy tắc quyền xem PM chốt (tạo bản ghi bên Web, hoặc cho mọi cán bộ xem)
- [ ] Trong lúc chưa bật: đổi dòng "Tra cứu ngữ nghĩa" thành "Tìm theo từ khóa"

**Làm cùng:** L2 (Dataservice – Trọng Hiếu, AI service – Minh Đức)

---

## Ưu tiên Trung bình

### [L3] Văn bản lỗi chỉ hiện câu chung chung, không có lý do thật

**Lỗi là gì:** Khi AI Service lỗi, Web bỏ mất mã lỗi và nội dung lỗi AI trả về, chỉ lưu câu chung "AI Service phản hồi lỗi". Người dùng không biết nên thử lại, đổi file hay báo admin. Dev cũng không biết lỗi ở đâu nếu không vào log server (như L0 ngày 28/10). API chi tiết văn bản (`/api/documents/{id}`) còn không trả lý do lỗi.

**Cách tái hiện:**
1. Upload 1 văn bản lúc AI đang lỗi (như L0 ngày 28/10)
2. Vào "Văn bản của tôi", tab "Thất bại", bấm "Lỗi xử lý (Xem)"

**Thực tế:** hộp "Chi tiết lỗi xử lý AI" chỉ ghi "AI Service không thể phân tích văn bản sau 3 lần thử." Văn bản `65527d42` (test_orc.png, 23/10) cũng vậy.

**Mong muốn:** hiện lý do cụ thể, ví dụ "Hết thời gian chờ (60 giây)", "AI đang quá tải", "Lỗi OCR ở trang 2", kèm gợi ý nên làm gì.

**Nguyên nhân:** hàm `send_to_ai_service` (`document_service.py` dòng 227–232) gặp lỗi HTTP hoặc lỗi kết nối thì chỉ ghi log rồi trả về `None`. Hàng chờ (`document_queue_service.py` dòng 310–316) nhận `None` nên chỉ ghi câu chung, mất mã lỗi.

**Cần làm:**
- [ ] Giữ mã HTTP, `error_code` và thông báo AI trả về; lưu vào `error_message` của văn bản
- [ ] Phân biệt các trường hợp: hết thời gian chờ, AI bận (503), AI báo lỗi theo bước, không kết nối được
- [ ] Trả `error_message` trong API chi tiết văn bản
- [ ] Frontend hiện lý do cụ thể + gợi ý hành động

**Làm cùng:** L0, L3 (AI service – Minh Đức)

> **Bối cảnh L0 (AI service, Cao):** từ 28/10 mọi văn bản upload đều "Thất bại" (thử lại 3 lần, mỗi lần khoảng 60 giây hết thời gian). Phần việc của Main web: lấy log backend khoảng 17:30–17:36 ngày 28/10, tìm dòng "Lỗi HTTP từ AI Service" hoặc "Lỗi kết nối httpx tới AI Service" để biết mã lỗi, gửi cho Minh Đức.

---

### [L4] Hủy văn bản đang chờ thì bị hiện thành lỗi xử lý AI

**Lỗi là gì:** Người dùng chủ động hủy văn bản đang chờ, nhưng hệ thống ghi văn bản đó là "Thất bại", lẫn với các văn bản AI xử lý lỗi thật.

**Cách tái hiện:**
1. Vào "Văn bản của tôi", upload liền 2 văn bản để văn bản thứ 2 ở trạng thái "Chờ xử lý"
2. Bấm nút "Hủy hàng đợi" ở văn bản thứ 2
3. Mở tab "Thất bại"

**Thực tế (28/10):** văn bản đã hủy nằm ở tab "Thất bại", có nhãn đỏ "Lỗi xử lý (Xem)". Bấm vào hiện "Đã hủy bởi người dùng". API hủy trả status `failed`.

**Mong muốn:** có trạng thái riêng "Đã hủy", không nằm trong "Thất bại", không hiện là lỗi AI.

**Nguyên nhân:** hàm `cancel_my_document` (`crud/document.py` dòng 356–357) đặt `status = "failed"` và `error_message = "Đã hủy bởi người dùng"`.

**Cần làm:**
- [ ] Thêm trạng thái `cancelled` cho văn bản; API hủy trả `cancelled`
- [ ] "Văn bản của tôi": thêm nhãn hoặc tab "Đã hủy"; vẫn cho xử lý lại
- [ ] Rà các chỗ đang lọc theo `failed` (Lịch sử, đồng bộ Data Service, worker) để xử lý trạng thái mới

---

### [L5] Hàng chờ chỉ xử lý 1 văn bản mỗi lúc, nhiều người gửi thì phải chờ lâu

**Lỗi là gì:** AI Service nhận được 4 văn bản cùng lúc, nhưng worker của Web chỉ gửi sang AI 1 văn bản, xong mới gửi văn bản tiếp theo. Nhiều người gửi cùng lúc thì người gửi sau phải chờ lâu dù AI còn rảnh.

**Cách tái hiện:**
1. Vào "Văn bản của tôi", kéo thả cùng lúc 5 văn bản
2. Theo dõi tab "Đang phân tích"

**Thực tế (25/10, 4 công văn 1 trang + 1 bản scan 3 trang):** luôn chỉ có 1 văn bản "Đang phân tích". Mỗi văn bản AI xử lý 18–24 giây, nhưng xong cả 5 mất khoảng 2 phút; có lúc nghỉ khoảng 25 giây giữa hai văn bản mà không làm gì.

**Mong muốn:** chạy song song 2–4 văn bản. Nhóm AI đã đo: chạy 4 văn bản cùng lúc nhanh gấp 2,7 lần chạy lần lượt.

**Nguyên nhân:** `integration_worker.py` chỉ giữ 1 việc đang chạy (biến `active`, dòng 380–400), và không lấy việc mới khi đã có việc ở trạng thái `processing` (`claim_next_job`, dòng 294). Chưa có cấu hình số văn bản chạy cùng lúc như task W3 đã yêu cầu. Khoảng nghỉ 25 giây chưa rõ nguyên nhân, cần xem log worker.

**Cần làm:**
- [ ] Thêm biến cấu hình số văn bản chạy cùng lúc (mặc định 2, tối đa 4 theo giới hạn của AI Service)
- [ ] Tìm và bỏ khoảng nghỉ giữa hai văn bản
- [ ] Đo lại với 5 văn bản

**Ghi chú:** còn lại từ W3.

---

### [L6] Gửi nhiều file cùng lúc thì mỗi file mất 5–10 giây mới tải lên xong

**Lỗi là gì:** Bước tải file lên (chưa tính thời gian AI xử lý) chậm hẳn khi gửi nhiều file một lúc.

**Cách tái hiện:**
1. Vào "Văn bản của tôi", kéo thả cùng lúc 5 file PDF khoảng 125 KB
2. Đo thời gian API upload trả về cho từng file

**Thực tế (25/10):** gửi 1 file mất 0,2–2,7 giây; gửi 5 file cùng lúc thì mỗi file mất 5,1–10,6 giây.

**Mong muốn:** mỗi file dưới 2–3 giây dù gửi cùng lúc.

**Nguyên nhân:** chưa xác định.

**Cần làm:**
- [ ] Ghi log thời gian từng bước của API upload: đọc file, đếm trang, kiểm tra trùng, lưu ổ đĩa, ghi DB, tạo job
- [ ] Sửa bước chậm nhất
- [ ] Đo lại với 5 file

---

## Ưu tiên Thấp

### [L7] Đăng nhập sai bao nhiêu lần cũng không bị chặn

**Lỗi là gì:** Không giới hạn số lần đăng nhập sai; kẻ xấu có thể dùng chương trình thử mật khẩu liên tục.

**Cách tái hiện:**
1. Ở màn đăng nhập, nhập đúng email, sai mật khẩu
2. Bấm đăng nhập 6 lần liên tiếp

**Thực tế (25/10):** cả 6 lần đều chỉ báo sai mật khẩu (401), không bị khóa tạm hay làm chậm.

**Mong muốn:** sai quá số lần cho phép (ví dụ 5 lần) thì khóa tạm (ví dụ 15 phút) và báo rõ cho người dùng.

**Cần làm:**
- [ ] Đếm số lần sai theo email và theo IP; quá giới hạn thì trả 429 kèm thời gian phải chờ
- [ ] Hoặc giới hạn tốc độ ngay ở nginx cho `/api/auth/login`

---

### [L8] Ô tìm kiếm ở trang "Lịch sử xử lý" không lọc gì

**Cách tái hiện:**
1. Vào "Lịch sử xử lý"
2. Gõ chuỗi không tồn tại, ví dụ `zzzz_khong_ton_tai`, rồi nhấn Enter

**Thực tế (25/10):** bảng vẫn hiện đủ 10 dòng như trước khi tìm.

**Mong muốn:** bảng chỉ còn các dòng khớp từ khóa (tên file, số ký hiệu, trích yếu); không có thì báo "Không có kết quả".

**Nguyên nhân:** frontend có gửi từ khóa; backend chuyển tiếp tham số `search` sang API lịch sử của Data Service (`history_service.py`), nhưng API này chỉ nhận `limit`, `offset`, `action_type` nên bỏ qua từ khóa.

**Cần làm:** thống nhất với Data Service, chọn 1 trong 2:
- [ ] Data Service thêm tham số `search` (Dataservice L8), hoặc
- [ ] Backend Web tự lọc kết quả theo từ khóa

**Làm cùng:** L8 (Dataservice – Trọng Hiếu). Còn lại từ W14.

---

### [L9] Lịch sử ghi sai loại file và sai trạng thái bước AI

**Lỗi là gì:** Dữ liệu lịch sử của văn bản bị ghi sai, nên không dùng để tra soát được.

**Cách tái hiện:**
1. Upload 1 ảnh PNG (ví dụ ảnh chụp công văn), chờ xử lý xong
2. Xem lịch sử của văn bản đó (API `/api/history/document/{id}/detail`)

**Thực tế (25/10):** ảnh `qa_anh_congvan.png` bị ghi `file_type` "application/pdf". Văn bản lỗi `65527d42` lại ghi `status_llm` "success" (bước AI thành công) dù văn bản thất bại.

**Mong muốn:** ghi đúng loại file thật (`image/png`, `application/pdf`…) và đúng trạng thái từng bước.

**Nguyên nhân:** `history_service.py` viết cứng `file_type` "application/pdf" (dòng 101, 369) và lấy "application/pdf" khi thiếu (dòng 208).

**Cần làm:**
- [ ] Lấy loại file thật của văn bản (mime type lúc upload)
- [ ] Văn bản thất bại thì không ghi `status_llm` "success"

---

### [L10] Đăng ký được bằng email không phải của PTIT

**Lỗi là gì:** Màn đăng ký nhận cả email ngoài Học viện. Tài khoản vẫn phải chờ admin duyệt, nhưng admin dễ duyệt nhầm người ngoài.

**Cách tái hiện:**
1. Ở màn đăng nhập, bấm "Yêu cầu cấp tài khoản"
2. Đăng ký bằng email ngoài, ví dụ `qa.recheck.2310@example.com`

**Thực tế:** đăng ký thành công (200), tài khoản vào danh sách chờ duyệt như tài khoản PTIT.

**Mong muốn:** chỉ nhận `@ptit.edu.vn`, `@stu.ptit.edu.vn`; hoặc ghi rõ "email ngoài PTIT" trong danh sách chờ duyệt.

**Cần làm:**
- [ ] Backend kiểm tra tên miền email khi đăng ký (frontend kiểm thêm để báo sớm)
- [ ] Hoặc cho đăng ký nhưng hiện cảnh báo ở trang duyệt tài khoản
- [ ] Xóa tài khoản rác đang có: `qa.temp.1410@example.com`, `qa.recheck.2310@example.com`

---

### [L11] Các link ở chân màn đăng nhập bấm không có tác dụng

**Cách tái hiện:**
1. Mở màn đăng nhập
2. Bấm lần lượt "Điều khoản", "Bảo mật", "Liên hệ", "Trợ giúp"

**Thực tế:** không mở trang nào, không có phản hồi.

**Mong muốn:** mở trang tương ứng; chưa có nội dung thì gỡ đi.

**Nguyên nhân:** các thẻ `<a>` không có `href` (`AuthForm.tsx` dòng 166–168).

**Cần làm:** gắn link thật hoặc gỡ 4 mục này. Còn lại từ W14.

---

### [L12] Bảng "Tài khoản" trong Trang Quản lý bị chật, chữ tràn khỏi ô

**Cách tái hiện:**
1. Đăng nhập admin trên màn hình rộng 1440 px
2. Vào "Trang Quản lý" > "Tài khoản"

**Thực tế:** các nhãn "Chưa gán", "Chưa liên kết", "Đang hoạt động" bị xuống 2–3 dòng và tràn ra ngoài ô.

**Mong muốn:** mỗi nhãn nằm gọn trên 1 dòng.

**Cần làm:** cho nhãn không xuống dòng (`white-space: nowrap`), thu gọn hoặc ẩn bớt cột ít dùng, hoặc cho bảng cuộn ngang.

---

## Phụ thuộc giữa các team

| Task Main web | Chờ ai | Việc bên kia | Việc Main web làm sau đó |
|---------------|--------|--------------|--------------------------|
| L1 | Trọng Hiếu (Dataservice L1) | `create_job` chống trùng theo `external_ref`, ghi vào tài liệu API | Bật `DS_TRANSLATION_JOBS_ENABLED` + `DS_JOB_IDEMPOTENCY_CONFIRMED`, thử dịch lại 1 file |
| L2 | Trọng Hiếu (Dataservice L2) | Lọc theo `allowed_web_document_ids` ngay trong truy vấn | Bật `DS_SEARCH_ACL_CONFIRMED` |
| L2 | Minh Đức (AI service L2) | Gửi `web_document_id` trong `/ingest/ocr` (đã đánh dấu hoàn thành) | Bật `DS_SEARCH_ENABLED`, tìm lại 4 từ khóa |
| L2 | PM | Chốt quy tắc quyền xem cho 541 văn bản crawler cũ | Tạo bản ghi bên Web hoặc cho mọi cán bộ xem |
| L3 | Minh Đức (AI service L0, L3) | Tìm nguyên nhân L0; mọi lỗi trả JSON có `error_code`, bước lỗi, thông báo; thống nhất danh sách mã lỗi | Lưu và hiện mã lỗi, lý do cụ thể |
| L8 | Trọng Hiếu (Dataservice L8) | Thêm tham số `search` (hoặc thống nhất Web tự lọc) | Chọn phương án và làm phía Web |

## Gợi ý thứ tự làm

1. **Làm ngay, không phụ thuộc ai:**
   - L1 (khóa nút gửi + hiện đúng lỗi backend) và L2 (đổi nhãn "Tìm theo từ khóa")
   - L3 (lưu mã lỗi AI) – gỡ nút thắt để điều tra L0
   - Lấy log backend 17:30–17:36 ngày 28/10 gửi Minh Đức (L0)
2. **Nhóm trung bình độc lập:** L4 (trạng thái `cancelled`), L5 (xử lý song song), L6 (đo thời gian từng bước upload)
3. **Nhóm thấp, làm nhanh:** L11, L12, L9, L10, L7
4. **Khi các team khác xong:** bật cờ cho L1, L2; chốt phương án L8
