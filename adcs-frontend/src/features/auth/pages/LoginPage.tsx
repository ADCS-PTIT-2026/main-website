import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import logo from '../../../assets/ptit-logo.png';
import { authAPI } from '../../../api/auth';
import { clearAuthStorage } from '../../../api/axiosClient';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'sso_failed') {
        setErrorMsg('Đăng nhập bằng SSO PTIT không thành công hoặc phiên đăng nhập đã hết hạn.');
      } else {
        setErrorMsg(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleAuthSubmit = async (formData: any) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      clearAuthStorage();
      const storage = formData.remember ? localStorage : sessionStorage;
      
      storage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
         storage.setItem('refresh_token', response.refresh_token);
      }
      storage.setItem('user', JSON.stringify(response.user));

      navigate('/dashboard');
    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
         setErrorMsg(detail);
      } else if (!error.response) {
         setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.');
      } else if (status === 429 || status === 503) {
         // Nginx trả trang HTML khi vượt giới hạn tốc độ nên không có detail
         setErrorMsg('Có quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.');
      } else if (status === 401) {
         setErrorMsg('Tài khoản hoặc mật khẩu không chính xác.');
      } else {
         setErrorMsg('Không thể đăng nhập lúc này. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const ptitAuthUrl = await authAPI.getPtitLoginUrl();

      window.location.href = ptitAuthUrl;
    } catch (error) {
      console.error('PTIT SSO Redirect Error:', error);
      setErrorMsg('Lỗi cấu hình hệ thống đăng nhập PTIT. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-slate-900 px-6 py-3 lg:px-10">
        <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <img 
            src={logo} 
            alt="PTIT Logo"
            className="h-9 w-auto object-contain drop-shadow-sm"
          />
          <h2 className="text-lg font-bold tracking-[-0.015em]">
            PTIT ADCS
          </h2>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <AuthForm 
          onSubmit={handleAuthSubmit} 
          onSSO={handleSSOLogin} 
          isLoading={isLoading} 
          errorMsg={errorMsg}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-xs">
        <p>© 2026 Học viện Công nghệ Bưu chính Viễn thông. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;