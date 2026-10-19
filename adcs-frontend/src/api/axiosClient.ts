import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const axiosClient = axios.create({ baseURL: API_URL, withCredentials: true });
const getToken = (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key);

export const clearAuthStorage = () => {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ['access_token', 'refresh_token', 'user', 'lastActiveDocumentId']) {
      storage.removeItem(key);
    }
  }
};

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const observedToken = getToken('refresh_token');
  const refresh = async (): Promise<string> => {
    const token = getToken('refresh_token');
    if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
    // Another tab may already have rotated the shared localStorage token.
    const currentAccess = getToken('access_token');
    if (token !== observedToken && currentAccess) return currentAccess;
    const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
    const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
      `${API_URL}/auth/refresh`, { refresh_token: token }, { withCredentials: true },
    );
    storage.setItem('access_token', data.access_token);
    storage.setItem('refresh_token', data.refresh_token);
    return data.access_token;
  };
  return navigator.locks ? navigator.locks.request('adcs-auth-refresh', refresh) : refresh();
}

axiosClient.interceptors.request.use((config) => {
  const token = getToken('access_token');
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

axiosClient.interceptors.response.use(
  response => response.data,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) return Promise.reject(error);
    const request = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthFlow = request.url?.includes('/auth/') && request.url !== '/auth/me';
    if (isAuthFlow || error.response?.status !== 401 || request._retry) {
      return Promise.reject(error);
    }
    request._retry = true;
    const latestAccess = getToken('access_token');
    if (latestAccess && request.headers.get('Authorization') !== `Bearer ${latestAccess}`) {
      request.headers.set('Authorization', `Bearer ${latestAccess}`);
      return axiosClient(request);
    }
    try {
      refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
      const token = await refreshPromise;
      request.headers.set('Authorization', `Bearer ${token}`);
      return await axiosClient(request);
    } catch (refreshError) {
      clearAuthStorage();
      if (window.location.pathname !== '/login') window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);

export default axiosClient;
