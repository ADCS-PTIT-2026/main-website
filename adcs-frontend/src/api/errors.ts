import axios from 'axios';

export function getApiError(error: unknown, fallbackMessage: string = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.';
    }

    const status = error.response.status;
    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }
    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
    }

    const data = error.response.data;
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
      }
      if (data.detail && typeof data.detail === 'object' && typeof data.detail.message === 'string') {
        return data.detail.message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

