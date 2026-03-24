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
  getAll: async (): Promise<ApiUser[]> => {
    const res = await axiosClient.get<ApiUser[]>('/api/users');
    return res.data;
  },

  create: async (payload: UserCreatePayload): Promise<ApiUser> => {
    const res = await axiosClient.post<ApiUser>('/api/users', payload);
    return res.data;
  },

  updateInfo: async (id: string, payload: UserUpdatePayload): Promise<ApiUser> => {
    const res = await axiosClient.put<ApiUser>(`/api/users/${id}`, payload);
    return res.data;
  },

  assign: async (id: string, payload: UserAssignPayload): Promise<ApiUser> => {
    const res = await axiosClient.put<ApiUser>(`/api/users/${id}/assign`, payload);
    return res.data;
  },

  changeStatus: async (id: string, payload: UserStatusPayload): Promise<ApiUser> => {
    const res = await axiosClient.put<ApiUser>(`/api/users/${id}/status`, payload);
    return res.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const res = await axiosClient.delete<{ message: string }>(`/api/users/${id}`);
    return res.data;
  },
};