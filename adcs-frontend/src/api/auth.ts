import axiosClient from './axiosClient';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role?: string | null;
    is_active: boolean;
    account_status: 'active' | 'pending_approval' | 'pending_role';
    is_admin: boolean;
    permissions: string[];
    is_telegram_connected?: boolean;
    telegram_chat_id?: string | null;
  };
}

export const authAPI = {
  me: async (): Promise<LoginResponse['user']> => {
    return axiosClient.get<LoginResponse['user'], LoginResponse['user']>('/auth/me');
  },

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

  logout: async (refreshToken: string): Promise<void> => {
    await axiosClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  getPtitLoginUrl: async (): Promise<string> => {
    const response = await axiosClient.get<{ authorization_url: string; state: string }, { authorization_url: string; state: string }>('/auth/sso/start');
    sessionStorage.setItem('oauth_state', response.state);
    return response.authorization_url;
  },

  ptitSsoCallback: async (code: string, state: string): Promise<LoginResponse> => {
    return axiosClient.post<LoginResponse, LoginResponse>('/auth/sso/callback', { code, state });
  },

  getPtitLogoutUrl: (idTokenHint: string): string => {
    const logoutEndpoint = import.meta.env.VITE_PTIT_LOGOUT_ENDPOINT;
    const postLogoutUri = import.meta.env.VITE_PTIT_POST_LOGOUT_REDIRECT_URI;

    return `${logoutEndpoint}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutUri)}`;
  }
};
