# Bàn giao FE: hiển thị lỗi xử lý văn bản

## 1. Thay đổi lần này là gì?

Sau khi người dùng upload văn bản, backend xử lý qua các bước: đọc nội dung → phân tích AI → lưu dữ liệu.
Trước đây, bước nào lỗi thì màn hình cũng chỉ báo “AI Service không thể phân tích văn bản sau 3 lần thử”. Nay backend trả rõ **lỗi gì, ở bước nào và mã tra cứu**. FE cần dùng thông tin này để người dùng biết phải chờ, kiểm tra file hay liên hệ hỗ trợ.

**Backend quản lý việc xử lý và tự thử lại. FE lấy trạng thái để hiển thị, không tự gửi lại yêu cầu phân tích.**

## 2. Màn hình cần hiển thị thế nào?

Trong “Văn bản của tôi”, giữ danh sách và nút xem lỗi hiện có. Khi người dùng mở chi tiết lỗi, hiển thị:

> **Dịch vụ phân tích gặp lỗi nội bộ.**  
> Bước lỗi: Phân tích AI  
> Mã lỗi: LLM_UPSTREAM_ERROR  
> Mã tra cứu: 92b8ac12-7668-4a02-8b95-96dbaa89cdc6

Thông báo lấy từ backend. Mã tra cứu cần cho phép sao chép để gửi hỗ trợ.

| Dữ liệu backend trả | FE dùng để làm gì? |
|---|---|
| `status` | Quyết định trạng thái của văn bản trên màn hình |
| `error_details.message` | Hiển thị nội dung lỗi |
| `error_details.error_code` | Hiển thị mã lỗi và phân loại khi cần |
| `error_details.stage` | Hiển thị bước xảy ra lỗi |
| `error_details.request_id` | Hiển thị mã tra cứu |
| `next_attempt_at` | Hiển thị thời điểm backend dự kiến thử lại, nếu có |

Tên bước có thể đổi sang tiếng Việt: `validating` = Kiểm tra đầu vào; `ocr` = Đọc nội dung; `llm_analysis` = Phân tích AI; `llm_reduce` = Tổng hợp; `llm_routing` = Gợi ý phòng ban; `related_search` = Tìm văn bản tương tự; `storage` = Lưu kho; `embedding` = Tạo vector; `history` = Ghi lịch sử; `awaiting_ai` = Chờ kết quả AI. Bước chưa nhận diện thì vẫn hiển thị được, không làm lỗi màn hình.

## 3. Gặp từng trạng thái thì FE làm gì?

| Trạng thái / tình huống | Cách hiển thị và xử lý |
|---|---|
| `queued`, có `next_attempt_at` | “Đang chờ thử lại”, kèm thời điểm dự kiến. FE không gọi retry thêm |
| `processing` | Tiếp tục hiển thị đang xử lý |
| `failed` | Hiển thị thất bại và nút xem chi tiết lỗi |
| `needs_review` | Hiển thị “Cần kiểm tra”, kèm nguyên nhân |
| Mã `AI_RESPONSE_TIMEOUT` | Giải thích Web đã hết thời gian chờ nhưng AI có thể còn chạy. Cần xác minh trước khi xử lý lại |
| Đã phân tích xong nhưng có `warnings` | Giữ kết quả phân tích và hiển thị cảnh báo riêng; không đổi cả văn bản thành thất bại |
| Văn bản cũ chưa có `error_details` | Dùng `error_message`. Nếu vẫn thiếu, hiển thị “Chưa có chi tiết lỗi” |

`retryable = true` chỉ cho biết lỗi có khả năng thử lại. **Không dùng trường này để tự đổi trạng thái văn bản hoặc tự gọi API retry.** Backend đã giới hạn số lượt thử; FE dựa vào `status` và `next_attempt_at` để hiển thị.
Lỗi lưu file/vector/lịch sử hiện được ghi nhận riêng. Chưa có chức năng tự chạy lại riêng từng bước này.

## 4. FE lấy dữ liệu ở đâu?

FE tiếp tục gọi Web Backend bằng cơ chế đăng nhập hiện tại, không cần gọi trực tiếp AI Service.
| Khi nào gọi? | API | Đọc dữ liệu nào? |
|---|---|---|
| Tải danh sách văn bản | `GET /api/documents/my` | Trong `items[]`: các trường ở mục 2 |
| Người dùng mở lịch sử xử lý của văn bản | `GET /api/documents/{document_id}/processing-attempts` | Trong `attempts[]`: `status`, `error`, `warnings`, `request_id`, `started_at`, `finished_at` |
| Admin mở trang tổng hợp lỗi | `GET /api/integration/processing-errors` | Mảng các lượt có lỗi/cảnh báo, kèm `document_id` |
| Người dùng chủ động bấm xử lý lại | `POST /api/documents/{document_id}/retry` | Giữ luồng retry hiện có; với lỗi chưa rõ AI đã kết thúc hay chưa, cần kiểm tra trước |

**Phân biệt hai trường hợp:**

- API lấy danh sách trả HTTP 200: chỉ có nghĩa là lấy danh sách thành công. Từng văn bản trong danh sách vẫn có thể mang `status = failed` và có `error_details`.
- Bản thân lời gọi API bị lỗi: FE đọc `error_code`, `message`, `request_id` trong body phản hồi lỗi. Với Axios, dữ liệu nằm trong `error.response.data`.

Response cũ có thể đặt lỗi trong `detail` dạng object hoặc chuỗi. FE cần giữ cách đọc dự phòng cho response cũ; nếu `detail` là mảng validation thì không hiển thị nguyên mảng cho người dùng. HTTP 401 giữ cơ chế đăng nhập/refresh hiện có; HTTP 403 thông báo không có quyền. Nếu mất mạng và không có response, thông báo lỗi kết nối, không tự gán thành lỗi Qwen.

## 5. Bảng tra mã lỗi

Cột HTTP dưới đây là **mặc định**, không phải lúc nào cũng là status của API FE đang gọi. Ví dụ: lỗi lưu trong lịch sử có `http_status = 502`, nhưng API lấy lịch sử vẫn trả HTTP 200. Một số nhánh validation trả 422 thay cho mặc định 400; lỗi OCR có thể trả 500 khi lỗi xảy ra phía server.

| Mã lỗi (`error_code`) | HTTP mặc định | Ý nghĩa |
|---|---|---|
| `INVALID_REQUEST` | 400 | Thiếu hoặc sai dữ liệu gửi lên |
| `INVALID_FILE` | 400 | File đầu vào không hợp lệ hoặc không còn trên server |
| `UNSUPPORTED_FILE_TYPE` | 400 | Định dạng file không được hỗ trợ |
| `DOCUMENT_TOO_LARGE` | 413 | Văn bản vượt giới hạn cho phép |
| `INVALID_DEPARTMENT_LIST` | 422 | Danh mục phòng ban gửi sang AI không hợp lệ |
| `INVALID_AI_PARAMETERS` | 422 | Cấu hình AI gửi sang không hợp lệ |
| `OCR_EXTRACTION_FAILED` | 422 | Không trích xuất được nội dung văn bản |
| `SERVER_BUSY` | 503 | Dịch vụ đang bận |
| `LLM_UNAVAILABLE` | 503 | Không kết nối được Qwen |
| `AI_AGENT_UNAVAILABLE` | 503 | Không có AI agent khả dụng để phân tích |
| `LLM_TIMEOUT` | 504 | Qwen phản hồi quá thời gian cho phép |
| `LLM_UPSTREAM_ERROR` | 502 | Qwen trả lỗi trong lúc phân tích |
| `LLM_INVALID_RESPONSE` | 502 | Kết quả AI thiếu hoặc sai cấu trúc |
| `LLM_ANALYSIS_FAILED` | 500 | Phân tích thất bại, chưa có mã nguyên nhân cụ thể hơn |
| `AI_RESPONSE_TIMEOUT` | 504 | Web hết thời gian chờ, AI có thể vẫn đang chạy |
| `RELATED_SEARCH_FAILED` | 503 | Không tìm được văn bản tương tự do lỗi dịch vụ |
| `FILE_STORAGE_FAILED` | 503 | Chưa lưu được văn bản vào kho |
| `EMBEDDING_FAILED` | 503 | Chưa tạo hoặc lưu được vector tìm kiếm |
| `EMBEDDING_UNAVAILABLE` | 503 | Dịch vụ tạo vector không khả dụng |
| `HISTORY_WRITE_FAILED` | 503 | Chưa ghi được lịch sử xử lý |
| `DEPENDENCY_AUTH_FAILED` | 502 | Kết nối giữa các dịch vụ bị lỗi xác thực |
| `DEPENDENCY_UNAVAILABLE` | 503 | Một dịch vụ phụ thuộc không kết nối được |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống chưa phân loại |
| `UNAUTHORIZED` | 401 | Chưa xác thực |
| `FORBIDDEN` | 403 | Không có quyền thực hiện thao tác |
| `NOT_FOUND` | 404 | Không tìm thấy dữ liệu |
| `JOB_NOT_FOUND` | 404 | Không tìm thấy tiến độ xử lý |

Đây là 27 mã chung của L3. Vẫn có một số mã cũ được giữ để tương thích như `AI_INVALID_RESPONSE`, `FILE_NOT_FOUND`, `DS_ERROR`. Với mã chưa có trong bảng, FE vẫn hiển thị thông báo và mã tra cứu, không chặn hiển thị.

## 6. Điều kiện hoàn thành phía FE

- Văn bản lỗi hiển thị được thông báo, bước lỗi, mã lỗi và mã tra cứu.
- Trạng thái chờ thử lại và cần kiểm tra hiển thị đúng; FE không tạo yêu cầu phân tích trùng.
- Cảnh báo không làm mất kết quả phân tích đã có.
- Văn bản cũ và mã lỗi chưa nhận diện vẫn xem được.
- Người dùng chỉ xem lịch sử văn bản trong quyền của mình; màn hình tổng hợp lỗi chỉ dành cho admin.
