import axiosClient from './axiosClient';

// Định nghĩa kiểu dữ liệu payload gửi lên backend
export interface DepartmentPayload {
  name: string;
  code?: string | null;
  description?: string | null;
  parent_id?: string | null;
}

// Định nghĩa kiểu dữ liệu trả về từ backend
export interface DepartmentResponse {
  department_id: string;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface DepartmentTreeResponse extends DepartmentResponse {
  children: DepartmentTreeResponse[];
}

export const departmentApi = {
  // GET /departments trả về list dạng tree
  getAll: (): Promise<DepartmentTreeResponse[]> => 
    axiosClient.get('/departments'),

  create: (data: DepartmentPayload): Promise<DepartmentResponse> => 
    axiosClient.post('/departments', data),

  update: (id: string, data: DepartmentPayload): Promise<DepartmentResponse> => 
    axiosClient.put(`/departments/${id}`, data),

  delete: (id: string): Promise<{ message: string }> => 
    axiosClient.delete(`/departments/${id}`),
};