import axiosClient from "./axiosClient";
import { isAxiosError } from 'axios';

export type UploadResponse = {
  document_id: string;
  status: string;
};

export type DocumentResponse = {
  source_type?: string;
  source_name?: string;
  sync_status?: string;
  sync_warnings?: string[];
  duplicate_document_id?: string | null;
  duplicate_reasons?: string[];
  possible_duplicate_count?: number;
  similarity?: number | null;

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
  error_message?: string | null;
  error_details?: ProcessingError | null;
  next_attempt_at?: string | null;
  updated_at?: string | null;
  original_filename?: string | null;
  so_den?: string | null;

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
  yeu_cau_hanh_dong?: string | null;
  
  key_points?: string[] | null;
  muc_tin_cay?: string | null;
  tong_so_chunk?: number | null;
  processing_time?: number | null;

  de_xuat_xu_ly?: {
    so_ngay_de_xuat?: number;
    muc_uu_tien?: string;
    ly_do?: string;
  } | null;
  goi_y_phong_ban?: {
    phong_ban?: string;
    ten_hien_thi?: string;
    ly_do?: string;
    diem_tin_cay?: number;
  } | null;

  suggested_departments?: {
    department_code?: string;
    department_name?: string;
    confidence_score?: number;
    reasoning?: string;
  }[] | null;

  proposed_assignees?: {
    name?: string;
    position?: string;
    department_code?: string;
    email?: string;
    reasoning?: string;
  }[] | null;

  related_documents?: {
    document_id: string | number;
    so_ky_hieu: string | null;
    trich_yeu: string | null;
    don_vi_ban_hanh: string | null;
    ngay_van_ban: string | null;
    similarity: number;
    matched_chunk: string | null;
    chunk_path: string | null;
  }[] | null;

  attachment?: string[] | null;
  local_path?: string | null;
};

const editableFields = [
  'assigned_department_id', 'assigned_user_id', 'so_den', 'so_ky_hieu', 'trich_yeu',
  'loai_van_ban_text', 'don_vi_ban_hanh', 'nguoi_ky', 'chuc_vu_nguoi_ky',
  'ngay_van_ban', 'ngay_het_han', 'do_khan', 'noi_nhan', 'can_cu_phap_ly',
  'yeu_cau_hanh_dong', 'summary',
] as const;

export type ApproveAIResultRequest = Partial<Pick<DocumentResponse, typeof editableFields[number]>> & {
  status?: 'approved';
};

export function buildAIResultUpdate(data: Partial<DocumentResponse>, original?: DocumentResponse): ApproveAIResultRequest {
  const entries = editableFields.flatMap(field => {
    if (data[field] === undefined) return [];
    let value = data[field];
    if (['assigned_department_id', 'assigned_user_id', 'ngay_van_ban', 'ngay_het_han'].includes(field) && value === '') value = null;
    if (Array.isArray(value)) value = value.map(item => item.trim()).filter(Boolean);
    if (original && JSON.stringify(value) === JSON.stringify(original[field] ?? null)) return [];
    return [[field, value]];
  });
  return Object.fromEntries(entries);
}

export function documentUpdateError(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const labels: Record<string, string> = {
        assigned_department_id: 'Phòng ban xử lý', assigned_user_id: 'Người xử lý',
        ngay_van_ban: 'Ngày ban hành', ngay_het_han: 'Ngày hết hạn', ngay_den: 'Ngày đến',
      };
      const fields = detail.map(item => labels[item.loc?.[1]] || item.loc?.[1]).filter(Boolean);
      if (fields.length) return `Vui lòng kiểm tra thông tin: ${[...new Set(fields)].join(', ')}.`;
    }
  }
  return error instanceof Error ? error.message : 'Không thể cập nhật văn bản';
}

export type ApproveAIResultResponse = {
  message: string;
  document: DocumentResponse;
  telegram_notification?: string;
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
  document_type?: string;
  document_type_ids?: string[];
  sort_by?: 'confidence' | 'relevance' | 'newest';
  search_mode?: 'hybrid' | 'semantic' | 'keyword' | 'exact';
  source_type?: string;
  status?: string;
  do_khan?: string;
  page?: number;
  limit?: number;
  page_size?: number;
}

export interface SearchAIResponse {
  status: string;
  query: string;
  data: DocumentResponse[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  warnings?: string[];
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
  return axiosClient.put(`/documents/${documentId}/ai-result`, {
    ...buildAIResultUpdate(payload),
    ...(payload.status === 'approved' ? { status: 'approved' } : {}),
  });
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

export async function deleteDocument(documentId: string, force: boolean = false): Promise<{ message: string }> {
  return axiosClient.delete(`/documents/${documentId}${force ? '?force=true' : ''}`);
}

// Tìm kiếm tài liệu kết hợp (W10)
export async function searchDocuments(params: SearchParams): Promise<SearchAIResponse> {
  const query = new URLSearchParams();
  
  for (const key of ['search_mode', 'source_type', 'status', 'do_khan'] as const) {
    if (params[key]) query.append(key, params[key]);
  }
  if (params.query) query.append('query', params.query);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.department_id) query.append('department_id', params.department_id);
  if (params.document_type) query.append('document_type', params.document_type);
  if (params.sort_by) query.append('sort_by', params.sort_by);
  if (params.page) query.append('page', String(params.page));
  if (params.page_size || params.limit) query.append('page_size', String(params.page_size || params.limit));
  
  if (params.document_type_ids && params.document_type_ids.length > 0) {
    params.document_type_ids.forEach(id => query.append('document_type_ids', id));
  }

  return axiosClient.get(`/documents/search?${query.toString()}`);
}

export type MyDocumentItem = {
  source_type?: string;
  source_name?: string;
  sync_status?: string;
  sync_warnings?: string[];
  duplicate_document_id?: string | null;
  duplicate_reasons?: string[];
  possible_duplicate_count?: number;
  similarity?: number | null;

  document_id: string;
  original_filename: string;
  file_size_bytes?: number | null;
  page_count?: number | null;
  status: string;
  queue_position?: number | null;
  priority: number;
  retry_count: number;
  error_message?: string | null;
  error_details?: ProcessingError | null;
  next_attempt_at?: string | null;
  warnings?: (ProcessingError | string)[];
  so_ky_hieu?: string | null;
  trich_yeu?: string | null;
  don_vi_ban_hanh?: string | null;
  loai_van_ban_text?: string | null;
  summary?: string | null;
  confidence?: number | null;
  created_at: string;
  updated_at: string;
};

export type MyDocumentsResponse = {
  items: MyDocumentItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export async function getMyDocuments(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}): Promise<MyDocumentsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  return axiosClient.get(`/documents/my?${query.toString()}`);
}

export async function retryDocument(documentId: string): Promise<{ message: string; document_id: string; status: string }> {
  return axiosClient.post(`/documents/${documentId}/retry`);
}

export async function cancelDocument(documentId: string): Promise<{ message: string; document_id: string; status: string }> {
  return axiosClient.post(`/documents/${documentId}/cancel`);
}

export type ProcessingError = {
  error_code: string;
  message: string;
  stage: string;
  service: string;
  dependency?: string | null;
  request_id: string;
  retryable: boolean;
  next_retry_at?: string;
};

export type ProcessingAttempt = {
  attempt_id: string;
  request_id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  error?: ProcessingError | null;
  warnings: ProcessingError[];
};

export const getProcessingAttempts = (id: string) =>
  axiosClient.get<never, { document_id: string; attempts: ProcessingAttempt[] }>(`/documents/${id}/processing-attempts`);

