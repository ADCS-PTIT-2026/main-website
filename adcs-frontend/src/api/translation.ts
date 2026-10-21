import axiosClient from "./axiosClient";

export type FileStatus = 'pending' | 'translating' | 'success' | 'failed' | 'cancelled';

export interface TranslationFile {
  id: string;
  filename: string;
  file_type: string;
  status: FileStatus;
  comment: string;
  result_file_url?: string;
  error_message?: string;
  job_status?: string;
  step?: string;
  progress_done?: number;
  progress_total?: number;
  queue_position?: number;
  error_code?: string;
  source_language?: string;
  target_language?: string;
  created_at: string;
}

export interface UploadTranslationResponse {
  message: string;
  duplicate_count: number;
  processed_files: TranslationFile[];
}

// Gửi file lên backend (Sử dụng FormData)
export async function uploadTranslationFiles(files: File[], sourceLang = 'vi', targetLang = 'en'): Promise<UploadTranslationResponse> {
  const formData = new FormData();
  formData.append('source_lang', sourceLang);
  formData.append('target_lang', targetLang);
  files.forEach(file => {
    formData.append("files", file); 
  });
  
  return axiosClient.post(`/translations/upload`, formData);
}

// Lấy danh sách lịch sử dịch
export async function getTranslations(): Promise<TranslationFile[]> {
  return axiosClient.get('/translations/');
}

// Cập nhật nhận xét
export async function updateTranslationComment(id: string, comment: string): Promise<{ message: string }> {
  return axiosClient.put(`/translations/${id}/comment`, { comment });
}

export async function deleteTranslation(id: string): Promise<{ message: string }> {
  return axiosClient.delete(`/translations/${id}`);
}

export async function downloadAllTranslationsZip(): Promise<any> {
  return axiosClient.get(`/translations/download-all/zip`, { 
    responseType: 'blob' 
  });
}
export async function cancelTranslation(id: string): Promise<{ message: string }> {
  return axiosClient.post(`/translations/${id}/cancel`);
}
