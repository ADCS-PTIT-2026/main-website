import axiosClient from "./axiosClient";

export type FileStatus = 'pending' | 'translating' | 'success' | 'failed';

export interface TranslationFile {
  id: string;
  filename: string;
  file_type: string;
  status: FileStatus;
  comment: string;
  result_file_url?: string;
  created_at: string;
}

export interface UploadTranslationResponse {
  message: string;
  duplicate_count: number;
  processed_files: TranslationFile[];
}

// Gửi file lên backend (Sử dụng FormData)
export async function uploadTranslationFiles(files: File[]): Promise<UploadTranslationResponse> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file); 
  });
  
  return axiosClient.post(`/translations/upload`, formData);
}

// Lấy danh sách lịch sử dịch
export async function getTranslations(): Promise<TranslationFile[]> {
  return axiosClient.get(`/translations/`);
}

// Cập nhật nhận xét
export async function updateTranslationComment(id: string, comment: string): Promise<{ message: string }> {
  return axiosClient.put(`/translations/${id}/comment`, { comment });
}