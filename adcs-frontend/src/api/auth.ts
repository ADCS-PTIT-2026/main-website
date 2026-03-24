import axiosClient from './axiosClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AUTH_API = `${API_BASE}/auth`;

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return axiosClient.post(`${AUTH_API}/login`, { email, password });
  },
  
  register: async (name: string, email: string, password: string) => {
    return axiosClient.post(`${AUTH_API}/register`, { name, email, password });
  }
};