import axiosClient from './axiosClient';

export interface HistoryRecord {
  id: number;
  request_id: string;
  action_type: string;
  filename: string;
  file_type: string;
  status_llm: string | null;
  status_save_file: string | null;
  status_save_vector: string | null;
  document_type: string;
  suggested_department: string | null;
  document_id: number | null;
  attachment_id: number | null;
  error_message: string | null;
  created_at: string;
}

export interface HistoryQueryParams {
  limit?: number; 
  search?: string;
  action?: string;
  time_filter?: string;
}

export interface ProcessingDetail {
  id: number;
  request_id: string;
  filename: string;
  file_type: string;
  action_type: string;
  status: string;
  status_llm: string | null;
  status_save_file: string | null;
  status_save_vector: string | null;
  error_message: string | null;
  created_at: string;
  document_id: string | number | null;
  so_ky_hieu?: string | null;
  so_den?: string | null;
  trich_yeu?: string | null;
  don_vi_ban_hanh?: string | null;
  ngay_van_ban?: string | null;
  loai_van_ban?: string | null;
  nguoi_ky?: string | null;
  chuc_vu_nguoi_ky?: string | null;
  do_khan?: string | null;
  suggested_department?: string | null;
  summary?: string | null;
  key_points?: string[] | null;
  confidence?: number | null;
  muc_tin_cay?: string | null;
  processing_time?: number | null;
  source_pages?: number | null;
  attachments?: Array<{
    attachment_id: number;
    filename: string;
    file_type: string;
    local_path?: string;
    ocr_status?: string;
  }>;
  storage_info?: any;
}

export async function getProcessingHistory(params: HistoryQueryParams): Promise<any> {
  const query = new URLSearchParams();
  
  if (params.limit) query.append('limit', params.limit.toString());
  
  if (params.search) query.append('search', params.search);
  if (params.action && params.action !== 'Tất cả hành động') query.append('action', params.action);
  if (params.time_filter && params.time_filter !== 'Tùy chọn...') query.append('time_filter', params.time_filter);

  return axiosClient.get(`/history?${query.toString()}`);
}

export async function getProcessingDetail(historyId: number): Promise<ProcessingDetail> {
  return axiosClient.get(`/history/${historyId}/detail`);
}

export async function getDocumentProcessingDetail(documentId: string): Promise<ProcessingDetail> {
  return axiosClient.get(`/history/document/${documentId}/detail`);
}

export async function sendHistoryTelegram(historyId: number): Promise<{ status: string; message: string }> {
  return axiosClient.post(`/history/${historyId}/send-telegram`);
}

export async function sendDocumentTelegram(documentId: string): Promise<{ status: string; message: string }> {
  return axiosClient.post(`/history/document/${documentId}/send-telegram`);
}