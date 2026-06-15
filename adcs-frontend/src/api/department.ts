import axiosClient from './axiosClient';

// Định nghĩa kiểu dữ liệu payload gửi lên backend
export interface DepartmentPayload {
  id?: number | null;
  name: string;
  code?: string | null;
  description?: string | null;
  ten_viet_tat?: string | null;
  ten_hien_thi?: string | null;
  loai_don_vi?: string | null;
  cap_don_vi?: string | null;
  level_number?: number | null;
  is_formal?: boolean | null;
  has_seal?: boolean | null;
  parent_name?: string | null;
  child_count?: number | null;
  parent_id?: number | null;
}

// Định nghĩa kiểu dữ liệu trả về từ backend
export interface DepartmentResponse extends DepartmentPayload {
  department_id: string;
  created_at: string;
}

export interface DepartmentTreeResponse extends DepartmentResponse {
  children: DepartmentTreeResponse[];
}

export const departmentApi = {
  getAll: (): Promise<DepartmentTreeResponse[]> => 
    axiosClient.get('/departments'),

  create: (data: DepartmentPayload): Promise<DepartmentResponse> => 
    axiosClient.post('/departments', data),

  update: (id: string, data: DepartmentPayload): Promise<DepartmentResponse> => 
    axiosClient.put(`/departments/${id}`, data),

  delete: (id: string): Promise<{ message: string }> => 
    axiosClient.delete(`/departments/${id}`),
};