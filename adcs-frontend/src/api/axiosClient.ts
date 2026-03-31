import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({
  baseURL: API_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

const getToken = (key: string) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const clearTokens = () => {
  localStorage.clear();
  sessionStorage.clear();
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// request interceptor để tự động thêm token vào header
axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor để tự động refresh token khi gặp lỗi 401
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getToken('refresh_token');
      
      if (!refreshToken) {
        if (window.location.pathname !== '/login') {
            clearTokens();
            window.location.href = '/login';
         }
         return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token; 

        const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
        
        storage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
            storage.setItem('refresh_token', newRefreshToken);
        }

        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;