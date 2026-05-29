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

  getPtitLoginUrl: (): string => {
    const authEndpoint = import.meta.env.VITE_PTIT_AUTH_ENDPOINT;
    const clientId = import.meta.env.VITE_PTIT_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_PTIT_REDIRECT_URI;
    const scope = 'openid profile email';
    
    const state = Math.random().toString(36).substring(2, 15); 
    sessionStorage.setItem('oauth_state', state);

    return `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  },

  ptitSsoCallback: async (code: string): Promise<LoginResponse> => {
    const response = await axiosClient.get(`/auth/sso/callback?code=${code}`);
    return response.data;
  },

  getPtitLogoutUrl: (idTokenHint: string): string => {
    const logoutEndpoint = import.meta.env.VITE_PTIT_LOGOUT_ENDPOINT;
    const postLogoutUri = import.meta.env.VITE_PTIT_POST_LOGOUT_REDIRECT_URI;

    return `${logoutEndpoint}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutUri)}`;
  }
};