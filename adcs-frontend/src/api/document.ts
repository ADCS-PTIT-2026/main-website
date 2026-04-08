import axiosClient from "./axiosClient";

export type UploadResponse = {
  document_id: string;
  status: string;
};

export type DocumentResponse = {
  document_id: string;
  title?: string | null;
  document_number?: string | null;
  signed_date?: string | null;
  assigned_department_id?: string | null;
  assigned_user_id?: string | null;
  priority?: number | null;
  confidence?: number | null;
  summary?: string | null;
  status?: string | null;
  updated_at?: string | null;
  loai_van_ban_text?: string | null;
  trich_yeu?: string | null;
  so_ky_hieu?: string | null;
  ngay_van_ban?: string | null;
  ngay_het_han?: string | null;
  
  don_vi_ban_hanh?: string | null;
  nguoi_ky?: string | null;
  chuc_vu_nguoi_ky?: string | null;
  do_khan?: string | null;
  noi_nhan?: string[] | null;
  can_cu_phap_ly?: string[] | null;
  yeu_cau_han_dong?: string | null;
  key_points?: string[] | null;
  muc_tin_cay?: string | null;
  tong_so_chunk?: number | null;
  processing_time?: number | null;
};

export type ApproveAIResultRequest = {
  document_id: string;
  title?: string | null;
  document_number?: string | null;
  signed_date?: string | null;
  assigned_department_id?: string | null;
  assigned_user_id?: string | null;
  priority?: number | null;
  confidence?: number | null;
  summary?: string | null;
  status?: string | null;
  updated_at?: string | null;
  loai_van_ban_text?: string | null;
  trich_yeu?: string | null;
  so_ky_hieu?: string | null;
  ngay_van_ban?: string | null;
  ngay_het_han?: string | null;
  
  don_vi_ban_hanh?: string | null;
  nguoi_ky?: string | null;
  chuc_vu_nguoi_ky?: string | null;
  do_khan?: string | null;
  noi_nhan?: string[] | null;
  can_cu_phap_ly?: string[] | null;
  yeu_cau_han_dong?: string | null;
  key_points?: string[] | null;
  muc_tin_cay?: string | null;
  tong_so_chunk?: number | null;
  processing_time?: number | null;
};

export type ApproveAIResultResponse = {
  document_id: string;
  message: string;
};

export type DashboardStatsResponse = {
  total_documents: number;
  pending_documents: number;
  ai_accuracy: number;
  new_users: number;
};

export interface SearchParams {
  query?: string;
  start_date?: string; 
  end_date?: string;
  department_id?: string;
  document_type_ids?: string[];
  sort_by?: 'confidence' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchAIResponse {
  status: string;
  query: string;
  data: DocumentResponse[];
  total?: number;
  total_pages?: number;
}

export async function uploadDocument(file: File, is_save_file: boolean): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append('is_save_file', String(is_save_file));
  return axiosClient.post(`/documents/upload`, formData);
}

export async function getDocument(documentId: string): Promise<DocumentResponse> {
  return axiosClient.get(`/documents/${documentId}`);
}

export async function approveAIResult(
  documentId: string,
  payload: ApproveAIResultRequest
): Promise<ApproveAIResultResponse> {
  return axiosClient.put(`/documents/${documentId}/ai-result`, payload);
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return axiosClient.get(`/documents/stats`);
}

export async function getRecentDocuments(limit: number = 5): Promise<DocumentResponse[]> {
  return axiosClient.get(`/documents?limit=${limit}`);
}

export async function getAllDocuments(): Promise<DocumentResponse[]> {
  return axiosClient.get(`/documents/all`);
}

// Tìm kiếm tài liệu
export async function searchDocuments(params: SearchParams): Promise<SearchAIResponse> {
  const query = new URLSearchParams();
  
  if (params.query) query.append('query', params.query);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  
  if (params.document_type_ids && params.document_type_ids.length > 0) {
    params.document_type_ids.forEach(id => query.append('document_type_ids', id));
  }

  return axiosClient.get(`/documents/search?${query.toString()}`);
}

export interface DocumentType {
  id: string;
  name: string;
}
export async function getDocumentTypes(): Promise<DocumentType[]> {
  return axiosClient.get(`/document-types`);
}