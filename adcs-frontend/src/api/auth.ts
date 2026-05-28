import axiosClient from './axiosClient';

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
    return axiosClient.post('/auth/login', { email, password });
  },

  register: async (name: string, email: string, password: string) => {
    return axiosClient.post('/auth/register', {
      name,
      email,
      password
    });
  },

  loginWithSSO: async (code: string): Promise<LoginResponse> => {
    return axiosClient.get(`/auth/sso/callback?code=${code}`);
  }
};