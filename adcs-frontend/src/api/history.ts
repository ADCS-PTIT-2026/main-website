import axiosClient from './axiosClient';

export interface HistoryUser {
  id: string;
  name: string;
  initials: string;
}

export interface HistoryDocument {
  name: string;
  type: string;
}

export interface HistoryRecord {
  history_id: string;
  timestamp: string;
  user: HistoryUser;
  document: HistoryDocument;
  action: string;
  status: string;
  notes: string;
}

export interface HistoryQueryParams {
  limit?: number; // Backend chỉ nhận limit
  search?: string;
  action?: string;
  time_filter?: string;
}

export async function getProcessingHistory(params: HistoryQueryParams): Promise<any> {
  const query = new URLSearchParams();
  
  // Truyền một limit đủ lớn để lấy hết data về phân trang trên Frontend (nếu backend bắt buộc cần limit)
  if (params.limit) query.append('limit', params.limit.toString());
  
  if (params.search) query.append('search', params.search);
  if (params.action && params.action !== 'Tất cả hành động') query.append('action', params.action);
  if (params.time_filter && params.time_filter !== 'Tùy chọn...') query.append('time_filter', params.time_filter);

  return axiosClient.get(`/history?${query.toString()}`);
}