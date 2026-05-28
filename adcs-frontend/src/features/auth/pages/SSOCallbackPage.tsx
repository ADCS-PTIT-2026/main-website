import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../../api/auth';

const SSOCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState('Đang xác thực tài khoản PTIT...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatusMsg(`Đăng nhập thất bại: ${searchParams.get('error_description') || error}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (code) {
      authAPI.loginWithSSO(code)
        .then((response) => {
          sessionStorage.setItem('access_token', response.access_token);
          if (response.refresh_token) {
            sessionStorage.setItem('refresh_token', response.refresh_token);
          }
          sessionStorage.setItem('user', JSON.stringify(response.user));
          
          setStatusMsg('Đăng nhập thành công! Đang chuyển hướng...');
          setTimeout(() => navigate('/dashboard'), 1000);
        })
        .catch((err) => {
          const errMsg = err.response?.data?.detail || 'Xác thực SSO thất bại.';
          setStatusMsg(`Lỗi: ${errMsg}`);
          setTimeout(() => navigate('/login'), 3000);
        });
    } else {
      setStatusMsg('Không tìm thấy mã xác thực, đang quay lại trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-md text-center max-w-sm w-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-700 dark:text-slate-300 font-medium">{statusMsg}</p>
      </div>
    </div>
  );
};

export default SSOCallbackPage;