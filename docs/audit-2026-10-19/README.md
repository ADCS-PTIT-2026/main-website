# Rà soát backend, frontend và chức năng ADCS — 19/10/2026

**Cập nhật sau rà soát:** mã nguồn A01–A11 đã được vá và triển khai, migration production đã áp dụng; xem [bản vá](patch-A01-A11/README.md) và [trạng thái vận hành](patch-A01-A11/deployment.md), gồm các bước còn chờ khóa của nhà cung cấp. Nội dung và bằng chứng bên dưới ghi nhận trạng thái trước bản vá.

**Kết luận: cần xử lý lỗi phân quyền trước khi coi hệ thống đủ điều kiện vận hành với dữ liệu nội bộ.** Backend và frontend đang chạy, nhưng có thể sửa vai trò khi chưa đăng nhập và biến tài khoản thường thành admin. Kiểm thử đã tái hiện cả chuỗi này bằng dữ liệu giả.

Đây là báo cáo rà soát, không phải bản vá. Các kiểm thử gây thay đổi dữ liệu chỉ chạy trên PostgreSQL riêng tại `127.0.0.1:15434/adcs_audit`. Với hệ thống đang vận hành, chỉ xem trạng thái container, đọc schema và gửi GET để kiểm tra trạng thái HTTP. Không gửi tin nhắn Telegram, đổi webhook hoặc gọi xử lý thật trên AI/SSO/QLVB.

## Phạm vi và kết quả

Đã khảo sát cấu trúc 57 file Python backend, 41 file TS/TSX/CSS frontend và 64 endpoint; rà soát router, dependency xác thực, service, CRUD, model/schema, API client, trang chức năng và Docker/Nginx. Kiểm tra động tập trung vào luồng chính và các ranh giới bảo mật. Không đồng nghĩa đã kiểm chứng mọi nhánh mã hay mọi tình huống nghiệp vụ.

| Hạng mục | Kết quả |
|---|---|
| Frontend `npm ci` | Thành công; không đổi lockfile |
| Frontend `npm run build`, Node 22.23.2 | Thành công; bundle JS khoảng 595 kB trước gzip |
| Frontend `npm run lint` | **63 lỗi, 9 cảnh báo** |
| Backend kiểm tra cú pháp, Python 3.11 | Thành công |
| Backend kiểm thử hợp đồng/hành vi | **51 phép kiểm: 18 đạt, 33 thất bại**, không có lỗi khởi tạo fixture |
| Trình duyệt Chrome | **48 phép kiểm: 39 đạt, 9 thất bại** |
| Responsive | 24 phép đo trên 6 trang, rộng 375/1440 px, sáng/tối: không tràn chiều rộng toàn trang |
| npm audit toàn bộ dependency | 24 package bị đánh dấu: 18 high, 4 moderate, 2 low |
| npm audit chỉ dependency production | 5 package bị đánh dấu: 4 high, 1 moderate |
| pip-audit môi trường kiểm tra | 2 advisory trên 2 package: `python-jose`, `ecdsa` |
| Khởi tạo DB từ `backup.sql` | Thiếu **10 cột documents** và bảng `feedbacks` so với mã hiện tại |

Các test cố ý kiểm tra hành vi đúng mong đợi, vì vậy nhiều test thất bại để tái hiện lỗi. Số test thất bại không phải số lỗi độc lập, cũng không phải tỷ lệ bao phủ mã nguồn.

Bằng chứng máy đọc được: [summary.json](evidence/summary.json), [backend-results.json](evidence/backend-results.json), [browser-results.json](evidence/browser-results.json), [route-inventory.json](evidence/route-inventory.json). Cách chạy lại: [repro/README.md](repro/README.md).

## Phát hiện theo mức độ ảnh hưởng

P0: có thể chiếm quyền quản trị. P1: ảnh hưởng nghiêm trọng đến dữ liệu, xác thực hoặc xử lý chính. P2: chức năng sai, thiếu hoặc khó vận hành; cần sửa sau các lỗi P0/P1.

### A01 — P0 — Sửa vai trò không cần đăng nhập, dẫn đến quyền admin

- Vị trí: [role_permission.py:25](../../adcs-backend/app/api/v1/endpoints/role_permission.py#L25), [dependency.py](../../adcs-backend/app/core/dependency.py).
- Router quản lý role không có dependency xác thực. Kiểm tra admin dựa vào tên role có thể sửa được.
- Tái hiện: đổi role admin thành tên khác, đổi role user thành `admin`, rồi dùng token tài khoản thường gọi cập nhật cấu hình AI. Cả hai lần đổi role và thao tác admin đều trả **200**. Toàn bộ phép thử chạy trên DB giả.
- Sửa: bắt buộc xác thực/quyền quản trị trên router; bảo vệ vai trò hệ thống và dùng định danh/quyền ổn định cho kiểm tra đặc quyền. Test: `test_anonymous_role_rename_cannot_grant_admin`.

### A02 — P1 — API người dùng và phòng ban còn mở công khai

- Vị trí: [user.py:62](../../adcs-backend/app/api/v1/endpoints/user.py#L62), [department.py:30](../../adcs-backend/app/api/v1/endpoints/department.py#L30), [system_parameter.py:16](../../adcs-backend/app/api/v1/endpoints/system_parameter.py#L16).
- `GET /api/users` trả danh sách kèm email, ID, role, phòng ban và thông tin Telegram khi chưa xác thực. CRUD phòng ban cũng không kiểm tra người gọi; đã tái hiện tạo phòng ban ẩn danh trả **200**.
- GET trên hệ thống đang chạy xác nhận `/api/users`, `/api/role-permissions/roles`, `/api/departments`, `/api/system-parameters` trả **200** khi không có token; `/api/documents` trả **401** đúng.
- Sửa: áp quyền phù hợp cho từng thao tác; giữ luồng đăng ký riêng thay vì dùng API tạo người dùng quản trị công khai.

### A03 — P1 — Bản dịch thiếu xác thực và kiểm tra chủ sở hữu

- Vị trí: [translation.py:27](../../adcs-backend/app/api/v1/endpoints/translation.py#L27), [translation_service.py:82](../../adcs-backend/app/services/translation_service.py#L82).
- Client tự truyền `user_id` để liệt kê bản dịch. Sửa comment, xóa và tải theo `log_id` không yêu cầu danh tính/chủ sở hữu.
- Đã tái hiện liệt kê, sửa comment và xóa bản dịch khi chưa đăng nhập: **200**. Nhánh download thiếu cùng kiểm tra được xác nhận bằng đọc mã; chưa tải dữ liệu dịch của người dùng thật.
- Sửa: lấy user từ token; kiểm tra chủ sở hữu/admin tại service cho mọi thao tác, kể cả download.

### A04 — P1 — Lộ dữ liệu lịch sử giữa người dùng

- Vị trí: [history_service.py:91](../../adcs-backend/app/services/history_service.py#L91), [history.py:63](../../adcs-backend/app/api/v1/endpoints/history.py#L63).
- Bộ lọc nhận một bản ghi là của user nếu trùng **tên file**, ngay cả khi `document_id` thuộc người khác. Hai người cùng upload `congvan.pdf` có thể bị trộn lịch sử.
- API chi tiết theo history ID nhận `current_user` nhưng không truyền xuống `fetch_history_detail`; người khác đã đọc được chi tiết giả của chủ tài liệu với **200**. Luồng gửi lịch sử qua Telegram dùng chung hàm lấy chi tiết này.
- Sửa: đối chiếu ID/chủ sở hữu có thẩm quyền; truyền user xuống service và kiểm tra scope trước khi đọc hoặc chia sẻ.

### A05 — P1 — Nhánh document ID không phải UUID bỏ qua scope

- Vị trí: [document.py:137](../../adcs-backend/app/api/v1/endpoints/document.py#L137), [document.py:171](../../adcs-backend/app/api/v1/endpoints/document.py#L171).
- UUID được kiểm tra `can_user_access_document`, nhưng ID dạng số đi thẳng sang Data Service và trả chi tiết/file.
- Với phản hồi Data Service giả, user khác đọc được tài liệu qua `/api/documents/701` với **200**, trong khi truy cập UUID cùng tài liệu bị **403** đúng.
- Sửa: chuẩn hóa ánh xạ ID và áp cùng chính sách scope cho cả hai nhánh, gồm endpoint file.

### A06 — P1 — Ma trận quyền chưa kiểm soát hành động tài liệu ở backend

- Vị trí: [document.py:247](../../adcs-backend/app/api/v1/endpoints/document.py#L247), [dependency.py](../../adcs-backend/app/core/dependency.py).
- Có `PermissionChecker` nhưng các thao tác chính không sử dụng. Kiểm tra chủ sở hữu/cùng phòng ban đang thay cho quyền xem/sửa/xóa/phê duyệt.
- User có role không chứa quyền nào vẫn sửa được `summary` của tài liệu mình: **200**. Quyền hiển thị trên frontend không bảo vệ được API.
- Sửa: kết hợp quyền hành động với scope tài liệu; đồng nhất mã quyền với frontend. Test: `test_read_only_permission_cannot_edit`.

### A07 — P1 — Có thể giả webhook để chiếm liên kết Telegram

- Vị trí: [telegram.py:113](../../adcs-backend/app/api/v1/endpoints/telegram.py#L113), [user_service.py:143](../../adcs-backend/app/services/user_service.py#L143).
- Webhook không kiểm tra secret của Telegram; `/start <user_id>` ghi trực tiếp chat ID vào tài khoản. User ID còn được công khai qua A02.
- POST giả trên DB kiểm thử đã đổi chat ID của user với **200**. Hàm gửi tin được thay bằng stub, không có tin nhắn thật nào được gửi.
- Sửa: xác minh webhook secret; dùng mã liên kết ngẫu nhiên, có hạn và chỉ dùng một lần, ràng buộc với phiên người dùng.

### A08 — P1 — SSO giảm kiểm tra bảo mật khi JWKS lỗi; callback bỏ qua state

- Vị trí: [auth_service.py:183](../../adcs-backend/app/services/auth_service.py#L183), [SSOCallbackPage.tsx:10](../../adcs-frontend/src/features/auth/pages/SSOCallbackPage.tsx#L10).
- Khi không tải được JWKS, backend chấp nhận claims không kiểm tra chữ ký. Nhánh kiểm tra chữ ký cũng tắt kiểm tra audience và không cấu hình issuer.
- Test mô phỏng token endpoint trả token ký bằng khóa sai cùng JWKS không khả dụng: backend vẫn trả **200**. Điều kiện này được mô phỏng; không chứng minh kẻ ngoài có thể tùy ý thay phản hồi token endpoint thật.
- Frontend tạo `oauth_state` nhưng callback không so sánh. Trình duyệt gửi yêu cầu đổi code dù state sai. Hai lần gọi quan sát được do React StrictMode ở môi trường dev.
- Sửa: từ chối khi không xác minh được token; kiểm tra chữ ký/audience/issuer và state, xử lý vòng đời/cache khóa.

### A09 — P1 — Access token và refresh token dùng thay thế cho nhau

- Vị trí: [security.py:28](../../adcs-backend/app/core/security.py#L28), [auth_service.py:129](../../adcs-backend/app/services/auth_service.py#L129), [dependency.py:39](../../adcs-backend/app/core/dependency.py#L39).
- Hai loại token dùng cùng cấu trúc claim, không có mục đích sử dụng được kiểm tra.
- Refresh token gọi `/api/users/me` được **200**; access token gọi `/api/auth/refresh` cũng được **200**.
- Sửa: thêm và xác minh loại token, quản lý rotation/revocation của refresh token; từ chối token sai mục đích.

### A10 — P1 — Bí mật nằm trong mã và SQL được theo dõi bởi Git

- Vị trí: [backup.sql:304](../../backup.sql#L304), [document_service.py:201](../../adcs-backend/app/services/document_service.py#L201), [docker-compose.yml](../../docker-compose.yml).
- `backup.sql` có một hàng bot với token không rỗng; service có khóa QLVB mặc định dạng literal. Compose chứa thông tin đăng nhập DB cố định và publish cổng DB trên mọi interface.
- Không sao chép giá trị bí mật vào báo cáo và không thử sử dụng token/khóa. Chưa xác minh chúng còn hiệu lực hay cổng DB có truy cập được từ Internet qua firewall.
- Sửa: thay/thu hồi bí mật có thể đã lộ; chuyển sang cấu hình bí mật, bỏ giá trị mặc định và loại dữ liệu nhạy cảm khỏi bản dump phân phối. Xem xét lịch sử Git theo quy trình của dự án.

### A11 — P1 — Log chứa mật khẩu rõ và password hash

- Vị trí: [main.py:31](../../adcs-backend/app/main.py#L31), [main.py:140](../../adcs-backend/app/main.py#L140), [security.py:18](../../adcs-backend/app/core/security.py#L18).
- Handler validation trả lại toàn bộ request body; middleware ghi body lỗi vào log. Request đăng ký thiếu trường đã làm mật khẩu giả xuất hiện nguyên văn trong log.
- `verify_password` còn in hash lưu trong DB và một hash vừa tạo từ mật khẩu nhập vào; đồng thời tính hash thừa mỗi lần xác minh.
- Sửa: bỏ các lệnh in hash, che trường nhạy cảm và giới hạn dữ liệu được ghi ở mọi nhánh lỗi.

### A12 — P1 — Khôi phục queue có thể lấy lại công việc của worker đang chạy

- Vị trí: [document_queue_service.py:26](../../adcs-backend/app/services/document_queue_service.py#L26), [crud/document.py:110](../../adcs-backend/app/crud/document.py#L110), [dockerfile](../../adcs-backend/dockerfile).
- Mỗi worker khởi động đều đổi **mọi** tài liệu `processing` về queued/failed, không kiểm tra lease hoặc thời điểm hết hạn. Gunicorn cấu hình 4 worker.
- Test cho worker A nhận việc, rồi gọi khôi phục từ phiên B: công việc đang xử lý bị đưa lại vào queue. Có nguy cơ xử lý và đẩy QLVB trùng.
- Semaphore là riêng từng process; giới hạn tổng có thể bằng 4 lần giá trị cấu hình.
- Sửa: worker queue chuyên biệt hoặc cơ chế lease/heartbeat và khôi phục chỉ job hết hạn; xác định rõ giới hạn toàn hệ thống.

### A13 — P1 — Phản hồi AI bất thường làm tài liệu kẹt `processing`

- Vị trí: [document_queue_service.py:165](../../adcs-backend/app/services/document_queue_service.py#L165), [document_queue_service.py:298](../../adcs-backend/app/services/document_queue_service.py#L298).
- Phản hồi `{"trang_thai":"success","extracted_fields":null}` làm phát sinh lỗi khi gọi `.get`. Nhánh catch rollback nhưng không cập nhật trạng thái/retry.
- Sau xử lý, bản ghi vẫn **processing**, slot đã được nhả, job không được worker nhận lại.
- Sửa: xác thực schema phản hồi AI; đưa lỗi parse/ghi DB vào cùng chính sách retry/failure có giới hạn.

### A14 — P1 — Khởi tạo database mới không tương thích mã hiện tại

- Vị trí: [docker-compose.yml:17](../../docker-compose.yml#L17), [backup.sql:91](../../backup.sql#L91), [models/document.py](../../adcs-backend/app/models/document.py), [bootstrap-drift.json](evidence/bootstrap-drift.json).
- Compose dùng `backup.sql` khi DB rỗng. Bản này thiếu `file_path`, `original_filename`, `file_size_bytes`, `page_count`, `priority`, `retry_count`, `error_message`, `processing_started_at`, `suggested_departments`, `proposed_assignees`, cùng bảng `feedbacks`.
- Đây là đối chiếu schema tĩnh với model và schema đang chạy; không dựng lại toàn bộ stack production. ORM truy vấn các cột thiếu sẽ không hoạt động trên bản schema đó.
- Sửa: bổ sung migration có version và kiểm thử nâng cấp/khởi tạo từ DB sạch; cập nhật tài liệu triển khai.

### A15 — P2 — Lưu ma trận quyền bị route động chặn; tạo permission trả 500

- Vị trí: [role_permission.py:25](../../adcs-backend/app/api/v1/endpoints/role_permission.py#L25), [role_permission.py:58](../../adcs-backend/app/api/v1/endpoints/role_permission.py#L58), [schemas/role_permission.py:28](../../adcs-backend/app/schemas/role_permission.py#L28).
- `PUT /roles/permissions-matrix` khớp `/roles/{role_id}` được đăng ký trước, nên payload ma trận bị validation theo `RoleUpdate` và trả **422**, kể cả admin.
- `PermissionCreate` chứa `name`, nhưng model Permission không có trường này; tạo permission hợp lệ theo schema trả **500**.
- Sửa: đăng ký route tĩnh trước route động và đồng nhất schema/model. Không diễn giải test matrix ẩn danh trả 422 thành bằng chứng cập nhật ma trận thành công.

### A16 — P2 — Hợp đồng cập nhật/đọc metadata làm mất trạng thái và trường dữ liệu

- Vị trí: [schemas/document.py:61](../../adcs-backend/app/schemas/document.py#L61), [document_service.py:491](../../adcs-backend/app/services/document_service.py#L491), [crud/document.py:133](../../adcs-backend/app/crud/document.py#L133).
- Frontend gửi `status: approved`, schema không khai báo nên bỏ qua; service đổi thành **success**. Đã xác nhận trong DB giả.
- Schema viết `yeu_cau_han_dong`, model dùng `yeu_cau_hanh_dong`; API không trả đúng nội dung yêu cầu hành động. `DocumentResponse` cũng thiếu `error_message`, khiến trang xử lý mất lỗi cụ thể và phải dùng thông báo chung.
- Update bỏ mọi giá trị `None`, nên không thể xóa hạn xử lý/phòng ban bằng null. Test gửi `ngay_het_han: null` nhưng ngày cũ vẫn còn.
- Sửa: thống nhất tên trường và trạng thái, quy định rõ null/xóa giá trị; thêm các trường frontend cần vào response.

### A17 — P2 — Không khôi phục được file preview khi mở lại tài liệu

- Vị trí: [DocumentPage.tsx:143](../../adcs-frontend/src/features/documents/pages/DocumentPage.tsx#L143), [schemas/document.py:54](../../adcs-backend/app/schemas/document.py#L54).
- Trang chờ `local_path`; bản ghi ORM lưu `file_path`, response không ánh xạ. Nhánh có local_path còn ghép cứng `http://localhost:8000`, trỏ tới máy người dùng khi triển khai từ xa.
- Trình duyệt mở tài liệu đã lưu bằng ID: không có phần tử preview, dù file tồn tại trong DB kiểm thử. [Ảnh](evidence/document-reload.png).
- Sửa: tải blob qua endpoint file có xác thực, như luồng kho văn bản, và dùng cấu hình API hiện có.

### A18 — P2 — Chọn ngôn ngữ dịch chỉ thay đổi giao diện

- Vị trí: [TranslationPage.tsx:76](../../adcs-frontend/src/features/translation/TranslationPage.tsx#L76), [api/translation.ts:23](../../adcs-frontend/src/api/translation.ts#L23), [models/translation.py](../../adcs-backend/app/models/translation.py).
- Chọn đích tiếng Pháp rồi upload: multipart không chứa `source_lang`/`target_lang`. Backend cũng không nhận cặp ngôn ngữ; model mặc định vi → en.
- Sửa: truyền và kiểm tra ngôn ngữ xuyên suốt UI → API → bản ghi → dịch vụ dịch; kiểm tra riêng nhận diện tự động và hoán đổi ngôn ngữ.

### A19 — P2 — Tạo tài khoản quản trị bỏ qua các lựa chọn trên form

- Vị trí: [UserFormPage.tsx:176](../../adcs-frontend/src/features/admin/pages/UserFormPage.tsx#L176), [user_service.py:29](../../adcs-backend/app/services/user_service.py#L29).
- Nhánh tạo mới chỉ gửi email, username, password. Phòng ban, vai trò, trạng thái hoạt động và điện thoại không được lưu.
- Trình duyệt chọn role/phòng ban và trạng thái hoạt động, lưu thành công nhưng response có **role_id=null, department_id=null, is_active=false**. Tài khoản vừa tạo chưa đăng nhập được như lựa chọn của admin.
- Sửa: hợp đồng tạo user dành cho admin phải nhận và lưu các trường tương ứng trong giao dịch nhất quán.

### A20 — P2 — Admin không xem được góp ý dù API trả dữ liệu

- Vị trí: [api/feedback.ts:21](../../adcs-frontend/src/api/feedback.ts#L21), [axiosClient.ts:51](../../adcs-frontend/src/api/axiosClient.ts#L51), [DashboardPage.tsx:130](../../adcs-frontend/src/features/DashboardPage.tsx#L130).
- Axios interceptor đã trả `response.data`; helper feedback lại lấy `.data` thêm lần nữa nên trả undefined. Dashboard truy cập `res.items` rồi vào catch.
- Browser có góp ý giả trong DB, endpoint trả 200 nhưng nội dung không hiển thị. [Ảnh](evidence/admin-dashboard.png).
- Sửa: thống nhất cách unwrap response và kiểu trả về của helper. Gửi góp ý được xác nhận hoạt động; lỗi thấy rõ ở danh sách admin.

### A21 — P2 — Chi tiết lịch sử lỗi khi Data Service thiếu bản ghi/Web DB thiếu tài liệu

- Vị trí: [history_service.py:125](../../adcs-backend/app/services/history_service.py#L125), [history_service.py:244](../../adcs-backend/app/services/history_service.py#L244), [HistoryPage.tsx:86](../../adcs-frontend/src/features/history/HistoryPage.tsx#L86).
- Fallback tạo history ID bằng `hash(document_id)`, nhưng endpoint chi tiết lại tìm ID đó trong Data Service: bấm bản ghi fallback trả **404**. `hash` còn không ổn định giữa process/lần khởi động.
- Nếu bản ghi Data Service không có tài liệu tương ứng trong Web DB, biểu thức `doc_web.source_pages or ...` truy cập None và phát sinh `AttributeError`.
- Sửa: dùng document UUID làm định danh fallback, gọi chi tiết theo document ID; xử lý rõ trường hợp không có doc_web.

### A22 — P2 — Cập nhật phòng ban cho phép tạo chu trình

- Vị trí: [department_service.py:126](../../adcs-backend/app/services/department_service.py#L126), [department_service.py:12](../../adcs-backend/app/services/department_service.py#L12).
- Chỉ cấm một phòng ban làm cha của chính nó. Đã tạo A → B rồi cập nhật A có cha B: **200**.
- Cây có thể mất nhánh/root; hàm duyệt vùng không có visited set còn có nguy cơ lặp khi gặp chu trình có thể truy cập được. Không thực hiện phép thử treo tiến trình.
- Sửa: kiểm tra tổ tiên/hậu duệ trong giao dịch; thêm bảo vệ chu trình ở các hàm dựng/duyệt cây.

### A23 — P2 — Upload nhận file không hỗ trợ và PDF hỏng

- Vị trí: [document.py:314](../../adcs-backend/app/api/v1/endpoints/document.py#L314), [translation_service.py:26](../../adcs-backend/app/services/translation_service.py#L26).
- `.exe` giả và nội dung không phải PDF mang đuôi `.pdf` đều được xếp hàng với **200**. Parse PDF lỗi bị đổi thành 1 trang, rồi tiếp tục xử lý.
- File được đọc toàn bộ trước khi so với giới hạn 50 MB; upload dịch không có giới hạn riêng về số file/kích thước ở ứng dụng. Nginx có giới hạn tổng request 100 MB.
- Sửa: kiểm tra loại/nội dung và đọc có giới hạn; từ chối tài liệu hỏng trước khi tạo job. Giới hạn 101 trang và hạn ngạch file thứ 6 đã được test và hoạt động trong luồng tuần tự.

### A24 — P2 — Lựa chọn lưu file và tính năng tìm kiếm ngữ nghĩa chưa nối đúng luồng

- Vị trí: [document.py:297](../../adcs-backend/app/api/v1/endpoints/document.py#L297), [document_queue_service.py:129](../../adcs-backend/app/services/document_queue_service.py#L129), [document_service.py:605](../../adcs-backend/app/services/document_service.py#L605).
- API nhận `is_save_file`, nhưng queue luôn gửi `is_save_file=False` tới AI. Test upload true rồi xử lý đã xác nhận false tại lời gọi AI; không kết luận trạng thái Vector DB thật vì chưa gọi dịch vụ ngoài.
- UI gọi là Semantic Search nhưng endpoint hiện tìm trên Web DB bằng `ILIKE`, không gọi `search_in_data_service`. Không có bằng chứng tìm kiếm theo ngữ nghĩa đang được thực hiện ở luồng này.
- Sửa: làm rõ hợp đồng lưu/index, lưu lựa chọn vào job; nối tìm kiếm kết hợp với Data Service hoặc đổi nhãn cho đúng hành vi.

### A25 — P2 — WebSocket thiếu xác thực và chưa phù hợp cấu hình nhiều worker

- Vị trí: [document.py:284](../../adcs-backend/app/api/v1/endpoints/document.py#L284), [document_websocket.py:5](../../adcs-backend/app/core/document_websocket.py#L5), [nginx.conf:22](../../adcs-frontend/nginx.conf#L22).
- TestClient kết nối được bằng client_id của user khi không có token. Connection manager chỉ giữ một socket/client ID, trong bộ nhớ từng process.
- Nginx thiếu header Upgrade/Connection cho WebSocket; process xử lý job có thể khác process giữ socket. Frontend hiện chủ yếu dùng polling nên chưa dựa vào WebSocket cho các luồng được kiểm tra.
- Sửa: xác thực và lấy client ID từ danh tính; cấu hình proxy và cơ chế thông báo giữa process, hỗ trợ nhiều phiên nếu cần.

### A26 — P2 — Client xác thực có hành vi không nhất quán

- Vị trí: [api/rolePermission.ts:26](../../adcs-frontend/src/api/rolePermission.ts#L26), [axiosClient.ts:79](../../adcs-frontend/src/api/axiosClient.ts#L79), [App.tsx:22](../../adcs-frontend/src/App.tsx#L22), [Sidebar.tsx:111](../../adcs-frontend/src/layouts/components/Sidebar.tsx#L111).
- Role API dùng fetch riêng không gắn token. Browser ghi nhận **0/6 request role có Authorization**; khi vá A01, màn hình này sẽ cần sửa đồng thời.
- Nhánh gặp 401 nhưng không có refresh token đặt `isRefreshing=true` rồi return trước finally, có thể làm request sau chờ vô hạn trong queue của client chưa reload.
- Route guard cho phép `user:manage` vào cả trang role/AI, sidebar lại chỉ xét role admin và backend cấu hình AI chỉ cho role admin. Có thể hiện/ẩn hoặc cho vào trang rồi bị từ chối không nhất quán.
- Sửa: dùng chung API client; reset trạng thái refresh ở mọi nhánh; thống nhất quyền cho route, menu, nút và backend. Nhánh refresh treo được xác nhận bằng đọc mã, chưa đưa vào số browser test tái hiện.

### A27 — P2 — Cấu hình triển khai và nguồn dependency chưa thống nhất

- Vị trí: [session.py:15](../../adcs-backend/app/db/session.py#L15), [docker-compose.yml:36](../../docker-compose.yml#L36), [frontend/dockerfile:2](../../adcs-frontend/dockerfile#L2), [pyproject.toml](../../adcs-backend/pyproject.toml).
- Compose truyền `DATABASE_URL`, nhưng backend bỏ qua biến này và ghép DB URL từ `DB_*`; sửa URL trong Compose có thể không đổi DB đích như người triển khai nghĩ.
- Mặc định pool 50 + overflow 100 cho mỗi worker; 4 worker có trần 600 kết nối, trong khi PostgreSQL đang cấu hình `max_connections=100`. Chưa stress test để tạo sự cố cạn kết nối.
- Docker frontend dùng Node 18, ngoài engines của Vite hiện khóa. Kiểm thử Node 18.20.8 **vẫn build thành công**, nhưng phát cảnh báo yêu cầu Node 20.19+/22.12+; không ghi nhận đây là lỗi build chắc chắn.
- Backend `pyproject.toml`/`uv.lock` và `requirements.txt` phục vụ các bộ dependency khác nhau; ví dụ `pypdf` chỉ có ở requirements. Sửa: một nguồn dependency có khóa phiên bản, DB URL thống nhất, ngân sách pool phù hợp và phiên bản Node được hỗ trợ.

### A28 — P2 — Modal chưa hỗ trợ đầy đủ bàn phím và trình đọc màn hình

- Vị trí: [FeedbackModal.tsx:57](../../adcs-frontend/src/components/FeedbackModal.tsx#L57), [ProcessingDetailModal.tsx:123](../../adcs-frontend/src/features/history/ProcessingDetailModal.tsx#L123).
- Modal góp ý không có role dialog/aria-modal, không đóng bằng Escape; hai hành vi này đã tái hiện bằng browser. Mã không quản lý trap/khôi phục focus; label textarea chưa liên kết bằng htmlFor/id.
- Sửa: dùng primitive dialog có quản lý focus, nhãn và thao tác bàn phím; kiểm tra tương tự các modal quản trị/xóa/xem chi tiết.

## Dependency, chất lượng và giới hạn kiểm chứng

- [npm-audit.json](evidence/npm-audit.json) là kết quả registry tại thời điểm rà soát, gồm cả công cụ build/dev. [npm-audit-production.json](evidence/npm-audit-production.json) tách dependency production; không đồng nghĩa mọi advisory đều khai thác được trong SPA này. Nhiều advisory React Router yêu cầu SSR/RSC mà dự án không dùng.
- [python-audit.json](evidence/python-audit.json) báo `ecdsa` 0.19.2 và `python-jose` 3.5.0. Advisory ECDSA liên quan ký/key generation; advisory jose phụ thuộc điều kiện thuật toán/khóa. Mã có truyền danh sách algorithms, nên chưa xác nhận đường khai thác các advisory này trong hệ thống. Cần đánh giá khả năng tiếp cận trước khi chọn phương án nâng cấp/thay thế.
- [frontend-lint.log](evidence/frontend-lint.log) chủ yếu là `any`, biến/catch không dùng, block rỗng và dependency hook thiếu. Build thành công không loại trừ các lỗi runtime/hợp đồng API ở trên. Chưa có bộ test chức năng/CI sẵn có tương ứng trong repo.
- [frontend-build.log](evidence/frontend-build.log) ghi nhận bundle JS khoảng 595 kB; có thể tách tải theo trang sau khi sửa chức năng chính. [frontend-node18-build.log](evidence/frontend-node18-build.log) lưu đầy đủ cảnh báo engines và kết quả build Node 18.
- SSO provider, AI/OCR thực, chất lượng dịch, Data Service/Vector DB, gửi/nhận Telegram thực và tiếp nhận QLVB **chưa được kiểm thử end-to-end với các hệ thống ngoài**. Đã kiểm tra phía Web và mô phỏng phản hồi thành công/lỗi ở các điểm liên quan.
- Chưa thực hiện kiểm thử tải, thời gian chạy dài, độ chính xác mô hình hay kiểm toán accessibility đầy đủ. 24 phép đo responsive chỉ xác nhận không tràn toàn trang ở các trang/kích thước đã thử. [Ảnh mobile](evidence/mobile-documents.png).
- Tài liệu kế hoạch đang đánh dấu nhiều hạng mục hoàn thành, nhưng A01–A28 cho thấy cần đánh giá lại trạng thái W1/W2/W3/W10/W13/W14 dựa trên tiêu chí kiểm thử.

## Những chức năng đã kiểm chứng hoạt động

| Luồng | Phần đã đạt |
|---|---|
| Xác thực cơ bản | Login đúng/sai mật khẩu; đăng ký ở trạng thái chờ duyệt; chặn đăng nhập tài khoản chưa kích hoạt |
| Bảo vệ tài liệu UUID | User khác bị 403; danh sách search không trả tài liệu ngoài scope trong trường hợp đã thử |
| Upload/queue | Lưu file giả vào đĩa; trả queued; file thứ 6 khi còn 5 pending bị 429; PDF 101 trang bị từ chối |
| Xử lý nền | Phản hồi AI hợp lệ cập nhật processed; AI thất bại thông thường đủ 3 lượt chuyển failed |
| Thao tác cá nhân | Chủ sở hữu retry/cancel; user khác bị chặn retry; cập nhật profile và đổi mật khẩu hợp lệ |
| Cấu hình AI | User thường bị 403; admin cập nhật hợp lệ được 200; temperature ngoài khoảng bị 400 |
| Góp ý | Backend nhận góp ý với 201 |
| Điều hướng | Trang chính và trang admin được thử không có exception JS chưa xử lý; user thường bị chuyển khỏi trang admin |

## Thứ tự xử lý đề xuất

1. Vá A01–A11: đóng API quản trị, scope bản dịch/lịch sử/tài liệu; xác minh Telegram/SSO/token; xử lý bí mật và log. Sửa client role đồng thời với bảo vệ API.
2. Vá A12–A15: queue có lease/trạng thái lỗi chắc chắn, migration và API quyền hoạt động. Kiểm tra khởi tạo từ DB sạch.
3. Vá các hợp đồng/giao diện A16–A28; chạy lại bộ kiểm thử và bổ sung test cho từng nhánh được sửa.
4. Đánh giá dependency theo môi trường thực, đưa build/lint/test vào CI; sau đó kiểm thử tích hợp thật bằng tài khoản/tài liệu thử và đo tải với ngân sách DB/AI rõ ràng.
