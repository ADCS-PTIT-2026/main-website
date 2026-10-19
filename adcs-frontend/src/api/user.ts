import axiosClient from './axiosClient';

export interface ApiUser {
  user_id: string;
  email: string;
  username: string;
  role_id?: string | null;
  department_id?: string | null;
  is_active: boolean;
  telegram_chat_id?: string | null;
  is_telegram_connected?: boolean;
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

export interface TelegramStatusResponse {
  is_connected: boolean;
  telegram_chat_id?: string | null;
  bot_name: string;
  link: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  role_id?: string | null;
  role_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  is_active: boolean;
  is_telegram_connected: boolean;
  telegram_chat_id?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const userApi = {
  getAll: (): Promise<ApiUser[]> => axiosClient.get('/users'),

  create: (payload: UserCreatePayload): Promise<ApiUser> => axiosClient.post('/users', payload),
  updateInfo: (id: string, payload: UserUpdatePayload): Promise<ApiUser> => axiosClient.put(`/users/${id}`, payload),

  assign: (id: string, payload: UserAssignPayload): Promise<ApiUser> => axiosClient.put(`/users/${id}/assign`, payload),

  changeStatus: (id: string, payload: UserStatusPayload): Promise<ApiUser> => axiosClient.put(`/users/${id}/status`, payload),

  remove: (id: string): Promise<{ message: string }> => axiosClient.delete(`/users/${id}`),

  getProfile: (): Promise<UserProfile> => axiosClient.get('/users/me'),

  updateProfile: (payload: { username: string }): Promise<UserProfile> => axiosClient.put('/users/me', payload),

  changePassword: (payload: ChangePasswordPayload): Promise<{ message: string }> => axiosClient.post('/users/change-password', payload),

  getTelegramStatus: (): Promise<TelegramStatusResponse> => axiosClient.get('/users/telegram_status'),

  getTelegramLink: (): Promise<{ bot_name: string; link: string; is_connected: boolean; telegram_chat_id?: string | null }> => axiosClient.post('/users/connect_to_telegram'),

  disconnectTelegram: (): Promise<{ message: string; is_connected: boolean }> => axiosClient.post('/users/disconnect_telegram')
};