import type { ProcessingError } from '../../api/document';

export const STAGE_LABELS: Record<string, string> = {
  validating: 'Kiểm tra đầu vào',
  ocr: 'Đọc nội dung (OCR)',
  llm_analysis: 'Phân tích AI',
  llm_reduce: 'Tổng hợp phân tích',
  llm_routing: 'Gợi ý phòng ban',
  related_search: 'Tìm văn bản tương tự',
  storage: 'Lưu kho dữ liệu',
  embedding: 'Tạo vector tìm kiếm',
  history: 'Ghi nhận lịch sử',
  awaiting_ai: 'Chờ kết quả AI',
  connecting_ai: 'Kết nối máy chủ AI',
  internal: 'Xử lý hệ thống',
  authentication: 'Xác thực tài khoản',
  authorization: 'Kiểm tra quyền hạn',
};

export function formatStage(stage?: string | null): string {
  if (!stage) return 'Chưa xác định';
  return STAGE_LABELS[stage] || stage;
}

export function getActionSuggestion(error?: ProcessingError | null): string {
  if (!error) {
    return 'Kiểm tra lại chất lượng tài liệu hoặc thử lại sau ít phút.';
  }

  const { error_code, retryable, next_retry_at } = error;

  if (error_code === 'AI_RESPONSE_TIMEOUT') {
    return 'Máy chủ Web đã hết thời gian chờ, nhưng AI có thể vẫn đang tiếp tục xử lý văn bản. Vui lòng xác minh hoặc liên hệ quản trị trước khi gửi lại để tránh xử lý trùng.';
  }

  if (next_retry_at) {
    const timeStr = new Date(next_retry_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `Hệ thống sẽ tự động thử lại vào lúc ${timeStr}. Bạn không cần thực hiện thêm thao tác.`;
  }

  if (error_code === 'SERVER_BUSY' || error_code === 'LLM_UNAVAILABLE' || error_code === 'AI_AGENT_UNAVAILABLE' || error_code === 'DEPENDENCY_UNAVAILABLE') {
    return 'Dịch vụ phân tích hiện đang bận hoặc bảo trì tạm thời. Vui lòng thử lại sau ít phút.';
  }

  if (error_code === 'INVALID_FILE' || error_code === 'UNSUPPORTED_FILE_TYPE' || error_code === 'DOCUMENT_TOO_LARGE') {
    return 'Vui lòng kiểm tra lại định dạng tệp, đảm bảo tệp PDF/ảnh hợp lệ, không khóa mật khẩu và dung lượng dưới 50MB.';
  }

  if (error_code === 'OCR_EXTRACTION_FAILED') {
    return 'Không trích xuất được chữ từ hình ảnh văn bản. Hãy đảm bảo bản chụp hoặc scan rõ nét, không bị mờ nhòe.';
  }

  if (retryable) {
    return 'Lỗi có thể tự khắc phục khi dịch vụ phục hồi. Bạn có thể bấm nút "Thử lại".';
  }

  return 'Vui lòng sao chép Mã tra cứu bên dưới và gửi cho Quản trị viên hệ thống để kiểm tra chi tiết.';
}

