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

export async function getProcessingHistory(params: HistoryQueryParams): Promise<any> {
  const query = new URLSearchParams();
  
  if (params.limit) query.append('limit', params.limit.toString());
  
  if (params.search) query.append('search', params.search);
  if (params.action && params.action !== 'Tất cả hành động') query.append('action', params.action);
  if (params.time_filter && params.time_filter !== 'Tùy chọn...') query.append('time_filter', params.time_filter);

  return axiosClient.get(`/history?${query.toString()}`);
}