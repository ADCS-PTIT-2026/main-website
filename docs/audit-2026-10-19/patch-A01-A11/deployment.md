# Triển khai production và xử lý bí mật — 19/10/2026 UTC

Website: https://adcs.ptitai.org. Bản vá A01–A11 đã được triển khai và migration đã áp dụng vào DB production. Backend và PostgreSQL báo healthy; frontend trả HTTP 200. Các phiên cũ bị vô hiệu hóa và người dùng cần đăng nhập lại.

## Đã thực hiện

- Sao lưu DB trước thay đổi, xác nhận đọc được và khôi phục thành công vào PostgreSQL riêng. Chạy thử migration trên bản khôi phục trước khi áp dụng production. Không còn job `queued`/`processing` lúc bắt đầu bảo trì.
- Áp dụng migration `20261019_security_a01_a11.sql`; giữ dữ liệu nghiệp vụ, thêm bảng phiên/SSO/link Telegram và định danh vai trò hệ thống. Thu hồi phiên hiện có, tăng `auth_version`, xóa bot token khỏi bảng `bots`.
- Thay mật khẩu PostgreSQL trên server và đồng bộ cấu hình ứng dụng. Đã kiểm chứng mật khẩu cũ không đăng nhập được, mật khẩu mới hoạt động. Cổng DB chỉ bind `127.0.0.1:5434`.
- Sinh các khóa JWT, dịch vụ nội bộ và webhook Telegram độc lập; đưa vào cấu hình riêng quyền 600. Backend chạy bằng UID/GID của chủ cấu hình để đọc được file riêng và ghi log mà không mở quyền cho mọi người.
- Build lại backend/frontend; frontend dùng Node 22 và `npm ci`. Image backend mới loại log, file `.env*`, dữ liệu static và dump khỏi build context. Compose giới hạn log container ở 3 file × 10 MB.
- Xóa 31 file log ứng dụng cũ, khoảng 21,8 MB. Tạo lại container backend/frontend/DB nên không giữ luồng Docker log cũ của các container này. Thư mục log hiện tại quyền 750, ngoài Git.
- Bỏ dump production khỏi bản phân phối, thay bằng `adcs-backend/db/schema.sql` chỉ có cấu trúc, mount chỉ đọc. File môi trường, log và bản sao DB không được theo dõi trong Git.
- Gỡ credential khỏi URL remote Git. Repository chặn tạo deploy key; không thay chính sách này. Các lần cập nhật remote trong đợt xử lý dùng credential tạm qua askpass, không truyền token trong URL/argv. Kết quả thu hồi token GitHub được ghi riêng tại thư mục vận hành private sau khi hoàn tất cập nhật remote.

Không tìm thấy password hash của tài khoản hiện tại trong dump Git và các log đã quét; không thay mật khẩu tài khoản người dùng.

## Xác minh

| Kiểm tra | Kết quả |
|---|---|
| Bộ hồi quy backend sau thay đổi schema/Compose | 81/81 đạt, PostgreSQL riêng |
| Browser hồi quy trước cutover | 12/12 đạt |
| Frontend production build | Thành công |
| API công khai, localhost và tên miền HTTPS | 12/12 đạt: trang login hoạt động, API riêng trả 401 |
| Kiểm tra trực tiếp trong production | 20/20 đạt: health, admin/user, purpose token, rotation/replay/logout, webhook secret, SSO start và validation |
| Canary mật khẩu không xuất hiện trong log ứng dụng/Docker | Đạt |
| Canary query code không xuất hiện trong access log Nginx | Đạt |
| Mật khẩu DB cũ bị từ chối và khóa runtime khớp bản mới | Đạt |

Các phiên tạm dùng để xác minh quyền admin/user đã được thu hồi. Không gửi thông báo Telegram hay đồng bộ tài liệu thật sang QLVB trong các kiểm tra này. SSO start được kiểm tra; đăng nhập tài khoản thật tại PTIT vẫn cần người dùng tương tác với nhà cung cấp.

## Khóa của nhà cung cấp còn chờ

Tại thời điểm cập nhật báo cáo, chưa có hai file khóa mới mà chủ hệ thống đang chuẩn bị:

- `/home/hieudt/.local/share/adcs-security-20261019/telegram-token-new`
- `/home/hieudt/.local/share/adcs-security-20261019/qlvb-key-new`

Chủ hệ thống đã xác nhận sẽ thu hồi/cấp lại khóa ở BotFather và hệ thống quản trị QLVB. Không gửi giá trị khóa qua chat. Khi có file, cần nạp vào cấu hình, tạo lại backend, thiết lập webhook kèm secret mới và kiểm chứng khóa cũ bị từ chối tại nhà cung cấp. **Telegram và đồng bộ QLVB hiện tạm tắt, không dùng khóa đã lộ. Chưa xác nhận thu hồi hai khóa tại nguồn.**

## Lịch sử Git và bản sao khôi phục

Lịch sử đã được làm sạch trong clone riêng trước khi cập nhật remote: loại dump dữ liệu, log, file môi trường và tài liệu tích hợp chứa credential; thay literal bí mật ở các blob/commit message còn lại. Mọi cập nhật cưỡng bức remote dùng `--force-with-lease` cho đúng ref `main` để tránh ghi đè thay đổi đến trong lúc xử lý. Trạng thái xác minh remote được bổ sung sau bước cập nhật.

Việc viết lại refs không thu hồi credential và không bảo đảm xóa bản sao từ máy khác hoặc cache GitHub. Các clone cũ phải được thay bằng clone mới; không merge lại lịch sử cũ. Nếu cần xóa cache theo SHA cũ, chủ repository cần [liên hệ GitHub Support theo hướng dẫn chính thức](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository#fully-removing-the-data-from-github). Không tự gửi tin nhắn/ticket thay chủ hệ thống.

Bản sao khôi phục và chứng cứ vận hành riêng nằm ngoài repo, trong `/home/hieudt/.local/share/adcs-security-20261019` (quyền 700). Các bản sao chứa dữ liệu cũ sẽ được gom vào kho mã hóa; key giải mã quyền 600 được giữ riêng trong thư mục này. Không đưa kho/key vào Git hoặc chia sẻ công khai. Đổi khóa và làm sạch refs không thay thế việc xử lý các bản clone, bản backup khác do bên ngoài quản lý.

Các mục A12–A28 vẫn ngoài phạm vi xác nhận hoàn tất của đợt này. Lint frontend còn 61 lỗi và 9 cảnh báo đã ghi trong báo cáo bản vá.
