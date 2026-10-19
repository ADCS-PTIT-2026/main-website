# Chạy lại kiểm thử rà soát

Các test diễn tả hành vi mong đợi. Trên mã được rà soát ngày 19/10/2026, backend có 33 test thất bại/18 đạt; browser có 9 phép kiểm thất bại/39 đạt. Đây là bộ tái hiện lỗi, chưa phải bộ CI chạy xanh.

**Chỉ dùng database riêng.** Fixture xóa toàn bộ dữ liệu của `adcs_audit` trước từng test. Có guard bắt buộc host `127.0.0.1`, cổng `15434`, database `adcs_audit`. Tuyệt đối không chuyển các hằng số này sang DB vận hành.

`schema.sql` là schema không có dữ liệu, chụp từ môi trường đang chạy khi rà soát. Không dùng `Base.metadata.create_all()` để thay thế: một số model khai báo String trong khi DB thật dùng UUID. Không dùng bản `backup.sql` cũ vì thiếu các cột mới. Token/khóa/mật khẩu trong harness đều là dữ liệu giả.

## Chuẩn bị

Đặt `ADCS_AUDIT_ROOT` thành đường dẫn tuyệt đối của repo. Cần Docker, Node hỗ trợ Vite, Python 3.11+, uv và Chrome tại `/usr/bin/google-chrome` hoặc sửa đường dẫn browser trong script.

```bash
export ADCS_AUDIT_ROOT=/path/to/main-website
uv venv --python 3.11 /tmp/adcs-audit-py311
uv pip install --python /tmp/adcs-audit-py311/bin/python -r "$ADCS_AUDIT_ROOT/adcs-backend/requirements.txt" pytest playwright
docker run --detach --rm --name adcs-audit-repro --publish 127.0.0.1:15434:5432 --tmpfs /var/lib/postgresql/data --env POSTGRES_USER=audit --env POSTGRES_PASSWORD=audit-local-only --env POSTGRES_DB=adcs_audit postgres:17-alpine
docker exec adcs-audit-repro pg_isready -U audit -d adcs_audit
```

Đợi `pg_isready` báo accepting connections rồi nạp schema:

```bash
docker exec -i adcs-audit-repro psql -U audit -d adcs_audit -v ON_ERROR_STOP=1 < "$ADCS_AUDIT_ROOT/docs/audit-2026-10-19/repro/schema.sql"
```

## Backend

```bash
/tmp/adcs-audit-py311/bin/python -m pytest "$ADCS_AUDIT_ROOT/docs/audit-2026-10-19/repro/test_system_audit.py" -q --tb=short
```

Script đặt biến DB và endpoint giả trước khi import app, không chạy application lifespan, chặn HTTP đi ra ngoài. Upload được chuyển vào thư mục tạm. Không chạy backend test đồng thời với browser test vì cùng dùng DB giả và fixture sẽ reset dữ liệu.

## Frontend trong trình duyệt

Khi backend test đã kết thúc, chạy API kiểm thử ở một terminal:

```bash
cd "$ADCS_AUDIT_ROOT/docs/audit-2026-10-19/repro"
/tmp/adcs-audit-py311/bin/python -m uvicorn audit_server:app --host 127.0.0.1 --port 18081
```

Harness seed user/tài liệu/góp ý giả, tắt startup/shutdown của app và thay dịch vụ dịch bằng stub. Không start worker thật hoặc đổi webhook.

Terminal thứ hai:

```bash
cd "$ADCS_AUDIT_ROOT/adcs-frontend"
npm ci --cache /tmp/adcs-audit-npm-cache --no-audit --no-fund
VITE_API_BASE_URL=http://127.0.0.1:18081/api npm run dev -- --host 127.0.0.1 --port 15173 --strictPort
```

Terminal thứ ba:

```bash
cd "$ADCS_AUDIT_ROOT/docs/audit-2026-10-19/repro"
/tmp/adcs-audit-py311/bin/python browser_checks.py
```

Browser kiểm tra trang và hành vi qua API thật của môi trường giả; các cuộc gọi AI/SSO/Telegram/QLVB thật được chặn. Riêng kiểm tra OAuth state dùng response giả, giới hạn vào URL API để không chặn nhầm module frontend. Font assets của website được phép tải từ Google Fonts. Kết quả và screenshot mới được ghi cạnh script; bằng chứng gốc được giữ ở `../evidence/`.

Dừng hai server bằng Ctrl+C, sau đó dọn container thử:

```bash
docker stop adcs-audit-repro
```

Container dùng `--rm` và tmpfs nên DB giả không được giữ sau khi dừng. Các container của hệ thống đang vận hành không bị thay đổi.
