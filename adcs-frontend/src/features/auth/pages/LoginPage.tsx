import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import logo from '../../../assets/ptit-logo.png';
import { authAPI } from '../../../api/auth';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
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
      
      // Xử lý ghi nhớ đăng nhập
      const storage = formData.remember ? localStorage : sessionStorage;
      
      storage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
         storage.setItem('refresh_token', response.refresh_token);
      }
      storage.setItem('user', JSON.stringify(response.user));

      navigate('/dashboard');
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
         setErrorMsg(error.response.data.detail);
      } else {
         setErrorMsg('Tài khoản hoặc mật khẩu không chính xác.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = () => {
    console.log('Redirecting to Outlook SSO...');
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

        <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90">
          Trợ giúp
        </button>
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