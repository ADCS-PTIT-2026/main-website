# Bản vá A01–A11 — 19/10/2026

Đã triển khai bản vá trong mã nguồn, thêm migration và kiểm thử hồi quy. **Production đã deploy và áp dụng migration; xem [trạng thái vận hành và các bước còn chờ nhà cung cấp](deployment.md).** Bộ kiểm thử hồi quy dùng DB riêng và dịch vụ ngoài mô phỏng; các kiểm tra sau deploy được ghi riêng trong báo cáo vận hành.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Backend, PostgreSQL riêng | **81/81 đạt** |
| Chrome với frontend thật và API kiểm thử | **12/12 đạt** |
| Migration trên schema hiện tại, chạy lại lần thứ hai | Thành công |
| Frontend production build | Thành công |
| Nginx `nginx -t` trong container riêng | Thành công |
| Python compileall | Thành công |
| Lint frontend toàn repo | Còn 61 lỗi, 9 cảnh báo; trước vá là 63 lỗi, 9 cảnh báo |

Chi tiết: [backend-results.json](backend-results.json), [browser-results.json](browser-results.json), [frontend-build.log](frontend-build.log), [frontend-lint.log](frontend-lint.log), [nginx-test.log](nginx-test.log).

## Các thay đổi

| Mục | Thực hiện |
|---|---|
| A01 | Bảo vệ router role/permission bằng quyền admin. Xác định admin qua `roles.system_code`, không dựa vào nhãn có thể đổi. Chặn đổi tên/xóa vai trò hệ thống và tạo tên dành riêng. |
| A02 | Danh sách/tạo người dùng và cấu hình AI chỉ dành cho admin. Đọc phòng ban cần đăng nhập; tạo/sửa/xóa cần quyền tương ứng. |
| A03 | Mọi thao tác bản dịch xác minh chủ sở hữu/admin, kể cả download. Danh sách mặc định lấy user từ token. File kết quả được giới hạn trong thư mục download. |
| A04 | Liên kết lịch sử theo document UUID; bỏ đối chiếu chủ sở hữu bằng tên file/trích yếu. Chi tiết và gửi Telegram kiểm tra scope. |
| A05 | ID cũ phải ánh xạ được sang UUID trong Web DB trước khi trả dữ liệu/file cho user thường; không tin `uploaded_by_user_id` từ phản hồi ngoài để cấp quyền. |
| A06 | Kiểm tra quyền đọc/tạo/sửa/xóa/phê duyệt kết hợp scope tài liệu. Tách lưu metadata khỏi phê duyệt, đồng bộ mã quyền frontend/backend. |
| A07 | Webhook xác minh secret trước khi đọc payload. Link Telegram dùng mã ngẫu nhiên một lần, hạn 10 phút, DB chỉ lưu SHA-256; khóa hàng đảm bảo không dùng đồng thời. Link mới/ngắt kết nối hủy link cũ. Chỉ liên kết qua chat riêng. |
| A08 | SSO dùng state gắn với cookie HttpOnly và DB, nonce, PKCE S256; xác minh RS256, issuer, audience, expiry, subject và email đã xác minh. Không fallback sang claims chưa xác minh. JWKS cache có TTL và tải lại khi gặp kid mới. |
| A09 | Access token 15 phút, refresh token 7 ngày, có mục đích và ID phiên riêng. Refresh token lưu bằng bản băm, rotation có khóa DB; replay thu hồi cả họ token. Logout thu hồi phiên; đổi mật khẩu/role/trạng thái tăng `auth_version`. Frontend chia sẻ một lần refresh và phối hợp giữa tab qua Web Locks khi khả dụng. |
| A10 | Bỏ token bot khỏi `backup.sql`, bỏ khóa QLVB/mật khẩu DB mặc định khỏi mã, dùng cấu hình riêng; DB chỉ publish loopback. Bot token không còn đọc từ DB. **Thu hồi/đổi khóa còn hiệu lực bên ngoài là bước triển khai bắt buộc, chưa thực hiện.** |
| A11 | Không ghi body lỗi/validation input hoặc in password hash. Thêm bộ che bí mật trong log/exception; Nginx không ghi query string/Referer, giảm lộ code/state SSO. **Log cũ và lịch sử Git cần được xử lý theo quy trình vận hành, không tự xóa/viết lại.** |

Các sửa liền kề cần để luồng hoạt động: route ma trận quyền được đặt trước route động; schema permission không còn đưa `name` vào model thiếu trường này; trường `approved` được nhận và lưu đúng; trường hợp lịch sử không có bản ghi Web DB không còn truy cập None. Đây không phải xác nhận toàn bộ A12–A28 đã được vá.

## Migration và cấu hình khi triển khai

Migration: [20261019_security_a01_a11.sql](../../../adcs-backend/migrations/20261019_security_a01_a11.sql).

Migration bổ sung `roles.system_code`, `users.auth_version` và ba bảng: `auth_refresh_tokens`, `telegram_link_tokens`, `sso_login_attempts`. Không xóa dữ liệu nghiệp vụ. Khi khởi tạo, role có tên admin/user được gắn mã hệ thống tương ứng; cần xác nhận các role ID này thuộc đúng vai trò dự kiến trước khi áp dụng. Nếu DB đã bị sửa vai trò trái phép, đối chiếu nguồn đáng tin cậy và khôi phục đúng danh tính trước.

Quyền tài liệu:

| Mã | Hành vi |
|---|---|
| `file.read` | Danh sách, tìm kiếm, thống kê, chi tiết, tải file và lịch sử trong scope |
| `file.create` | Upload, retry, cancel tài liệu của người dùng |
| `file.update` | Sửa metadata trong scope |
| `file.approve` | Phê duyệt trong scope; nếu gửi kèm metadata còn cần `file.update` |
| `file.delete` | Xóa tài liệu thuộc quyền sở hữu; admin có thể xóa cưỡng bức |

Migration thêm `file.read`, `file.approve` vào danh mục. Các role đang có thao tác file được bổ sung quyền đọc để giữ khả năng xem; **không tự cấp create/approve cho role mới**. Admin bypass quyền hành động dựa trên mã vai trò hệ thống. Các mã `doc:*` cũ được ánh xạ sang mã `file.*` tương ứng.

1. Chuẩn bị cửa sổ triển khai, để các job đang xử lý hoàn tất rồi chặn truy cập và dừng worker cũ. A12/A13 về queue còn ngoài phạm vi bản vá này.
2. Tạo cấu hình riêng từ [.env.example](../../../.env.example) và [adcs-backend/.env.example](../../../adcs-backend/.env.example), phân quyền file 600 hoặc dùng secret manager. `SECRET_KEY` cần ngẫu nhiên, ít nhất 32 byte; nên sinh mỗi khóa bằng `secrets.token_urlsafe(48)` và ghi trực tiếp vào nơi quản lý bí mật.
3. Đổi/thu hồi Telegram bot token qua quản trị Telegram và QLVB API key qua bên quản trị QLVB; đặt giá trị mới vào cấu hình riêng. Đặt `SERVICE_INTERNAL_KEY` độc lập với JWT key và cấu hình cùng giá trị ở dịch vụ gọi thông báo. Sinh `TELEGRAM_WEBHOOK_SECRET` độc lập. Không dùng lại các giá trị đã xuất hiện trong Git/dump/log.
4. Đổi mật khẩu role PostgreSQL qua kênh quản trị an toàn, chẳng hạn lệnh tương tác `\password`, rồi đồng bộ `POSTGRES_PASSWORD` ở root `.env`. Đổi biến môi trường **không tự đổi mật khẩu của volume PostgreSQL đã tồn tại**. Không đưa mật khẩu vào argv, SQL file theo dõi bởi Git hoặc thông báo chia sẻ.
5. Áp dụng migration vào DB hiện có trước khi chạy worker mới. Ví dụ với các biến mặc định đã có trong container:

   ```bash
   docker exec -i adcs-db sh -c 'exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < adcs-backend/migrations/20261019_security_a01_a11.sql
   ```

6. Triển khai backend và frontend cùng phiên bản. Backend phải có `PTIT_CLIENT_ID`, redirect URI, issuer và endpoint PTIT đúng; client OIDC cần hỗ trợ PKCE S256, phát nonce và claim `email_verified=true` cho email đã xác minh. `CORS_ORIGINS` là danh sách origin frontend cụ thể, không phải `*`. Mô hình hỗ trợ cookie SameSite=Lax là frontend/API cùng site, như `/api` qua reverse proxy hiện tại; cookie Secure bật khi redirect URI là HTTPS.
7. Đăng nhập admin mới và gọi **POST `/api/telegram/setup-webhook`** với Bearer token để đăng ký webhook kèm secret. Bản vá không tự thay webhook lúc startup. Các link `/start <user_id>` cũ không còn hợp lệ; người dùng tạo lại link trong website.
8. Kiểm tra 401/403 và các luồng hợp lệ bằng tài khoản thử trước khi mở truy cập. Phiên/token cũ không tương thích và cần đăng nhập lại. Sau khi xác nhận token mới hoạt động, loại token bot cũ khỏi DB/backup vận hành; xử lý log nhạy cảm và lịch sử Git, phối hợp người dùng kho mã trước mọi thao tác viết lại lịch sử. `.gitignore` không tự bỏ theo dõi file đã tracked.

Thay đổi endpoint liên quan frontend đã được cập nhật:

- `GET /api/auth/sso/start` tạo phiên SSO và trả URL đăng nhập.
- `POST /api/auth/sso/callback` nhận JSON `{code, state}`; cần cookie đã tạo ở bước start. GET callback cũ không còn được chấp nhận ở API. URL frontend `/auth/callback` vẫn nhận redirect từ provider.
- `POST /api/auth/logout` nhận refresh token để thu hồi phiên phía server.
- `POST /api/users/connect_to_telegram` phát link một lần; GET trạng thái không phát credential.
- `GET /api/translations/` mặc định lấy bản dịch của danh tính đang đăng nhập; admin mới được chỉ định user khác.

Migration này dành cho schema hiện tại. Không còn phân phối `backup.sql` chứa dữ liệu production. Compose dùng [schema.sql](../../../adcs-backend/db/schema.sql) chỉ chứa cấu trúc đã cập nhật, không có user, bot token hoặc dữ liệu nghiệp vụ. Một cài đặt mới vẫn cần khởi tạo vai trò, quyền và admin qua quy trình quản trị riêng; bản vá không tạo tài khoản hay mật khẩu mặc định.

## Chạy lại kiểm thử trong môi trường riêng

Cần Python 3.11+, Docker và Chrome. Không chạy với DB production. Fixture từ chối URL ngoài `127.0.0.1:15434/adcs_audit` và sẽ xóa dữ liệu của DB thử trước mỗi test.

```bash
uv venv --python 3.11 /tmp/adcs-security-venv
uv pip install --python /tmp/adcs-security-venv/bin/python -r adcs-backend/requirements-test.txt
docker run --detach --rm --name adcs-security-test --publish 127.0.0.1:15434:5432 --tmpfs /var/lib/postgresql/data --env POSTGRES_USER=audit --env POSTGRES_PASSWORD=audit-local-only --env POSTGRES_DB=adcs_audit postgres:17-alpine
docker exec adcs-security-test pg_isready -U audit -d adcs_audit
```

Sau khi PostgreSQL sẵn sàng:

```bash
docker exec -i adcs-security-test psql -U audit -d adcs_audit -v ON_ERROR_STOP=1 < adcs-backend/db/schema.sql
docker exec -i adcs-security-test psql -U audit -d adcs_audit -v ON_ERROR_STOP=1 < adcs-backend/migrations/20261019_security_a01_a11.sql
ADCS_SECURITY_TEST_DATABASE_URL=postgresql://audit:audit-local-only@127.0.0.1:15434/adcs_audit /tmp/adcs-security-venv/bin/python -m pytest adcs-backend/tests/security -q
```

Để chạy browser, đợi pytest kết thúc. Terminal API:

```bash
cd adcs-backend/tests/security
ADCS_SECURITY_TEST_DATABASE_URL=postgresql://audit:audit-local-only@127.0.0.1:15434/adcs_audit /tmp/adcs-security-venv/bin/python -m uvicorn preview_app:app --host 127.0.0.1 --port 18081
```

Terminal frontend, tính từ root repo:

```bash
cd adcs-frontend
VITE_API_BASE_URL=http://127.0.0.1:18081/api npm run dev -- --host 127.0.0.1 --port 15173 --strictPort
```

Terminal browser, tính từ root repo:

```bash
/tmp/adcs-security-venv/bin/python adcs-backend/tests/security/browser_security.py
```

Harness tắt lifespan production, không start queue hoặc gửi thông báo thật; SSO provider dùng token RSA giả có kiểm tra đầy đủ. Browser chỉ gọi loopback và font assets; provider/Telegram ngoài được mô phỏng/chặn. Kết quả browser mặc định ở `/tmp/adcs-security-browser.json`. Không chạy pytest đồng thời với preview API vì hai bên dùng cùng DB thử.

Dừng hai server thử và dọn DB sau khi xong:

```bash
docker stop adcs-security-test
```
