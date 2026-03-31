import axiosClient from './axiosClient';

export interface ApiUser {
  user_id: string;
  email: string;
  username: string;
  role_id?: string | null;
  department_id?: string | null;
  is_active: boolean;
}

export interface UserCreatePayload {
  email: string;
  username: string;
  password: string;
}

export interface UserUpdatePayload {
  username?: string;
  email?: string;
}

export interface UserAssignPayload {
  role_id?: string | null;
  department_id?: string | null;
}

export interface UserStatusPayload {
  is_active: boolean;
}

export const userApi = {
  getAll: (): Promise<ApiUser[]> => axiosClient.get('/users'),

  create: (payload: UserCreatePayload): Promise<ApiUser> => axiosClient.post('/users', payload),
  updateInfo: (id: string, payload: UserUpdatePayload): Promise<ApiUser> => axiosClient.put(`/users/${id}`, payload),

  assign: (id: string, payload: UserAssignPayload): Promise<ApiUser> => axiosClient.put(`/users/${id}/assign`, payload),

  changeStatus: (id: string, payload: UserStatusPayload): Promise<ApiUser> => axiosClient.put(`/users/${id}/status`, payload),

  remove: (id: string): Promise<{ message: string }> => axiosClient.delete(`/users/${id}`)
};