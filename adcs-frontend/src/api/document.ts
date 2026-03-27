const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DOCUMENT_API = `${API_BASE}/documents`;

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
};

export type DocumentAIResultResponse = {
  document_id: string;
  assigned_department_id?: string | null;
  document_type_id?: string | null;
  loai_van_ban_text?: string | null;
  don_vi_ban_hanh?: string | null;
  so_den?: string | null;
  so_ky_hieu?: string | null;
  trich_yeu?: string | null;
  ngay_van_ban?: string | null;
  ngay_het_han?: string | null;
  summary?: string | null;
  confidence?: number | null;
  status?: string | null;
};

export type AIResultUpdateRequest = {
  title?: string | null;
  document_number?: string | null;
  signed_date?: string | null;
  document_type_id?: string | null;
  assigned_department_id?: string | null;
  assigned_user_id?: string | null;
  priority?: number | null;
  confidence?: number | null;
  summary?: string | null;
  status?: string | null;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err?.detail || err?.message || detail;
    } catch {
      const text = await res.text();
      if (text) detail = text;
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadResponse>(`${DOCUMENT_API}/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function getDocument(documentId: string): Promise<DocumentResponse> {
  return request<DocumentResponse>(`${DOCUMENT_API}/${documentId}`);
}

export async function getDocumentAIResult(
  documentId: string
): Promise<DocumentAIResultResponse> {
  return request<DocumentAIResultResponse>(`${DOCUMENT_API}/${documentId}/ai-result`);
}

export async function updateDocumentAIResult(
  documentId: string,
  payload: AIResultUpdateRequest
): Promise<{ message: string; document: DocumentResponse }> {
  return request(`${DOCUMENT_API}/${documentId}/ai-result`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type DashboardStatsResponse = {
  total_documents: number;
  pending_documents: number;
  ai_accuracy: number;
  new_users: number;
};

// Hàm lấy dữ liệu thống kê
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return request<DashboardStatsResponse>(`${DOCUMENT_API}/stats`);
}

// Hàm lấy danh sách tài liệu gần đây
export async function getRecentDocuments(limit: number = 5): Promise<DocumentResponse[]> {
  return request<DocumentResponse[]>(`${DOCUMENT_API}?limit=${limit}`);
}