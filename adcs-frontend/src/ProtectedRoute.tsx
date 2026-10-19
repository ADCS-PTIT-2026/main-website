import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authAPI, type LoginResponse } from './api/auth';
import { clearAuthStorage } from './api/axiosClient';

const ProtectedRoute = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const location = useLocation();
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authAPI.me().then(account => {
      if (cancelled) return;
      const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(account));
      setUser(account);
      setStatus('ready');
    }).catch(error => {
      if (cancelled) return;
      if (isAxiosError(error) && error.response?.status === 401) {
        clearAuthStorage();
        setStatus('unauthenticated');
      } else {
        setStatus('error');
      }
    });
    return () => { cancelled = true; };
  }, [token, attempt]);

  if (!token || status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (status === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <p role="alert">Không thể kiểm tra trạng thái tài khoản. Vui lòng thử lại.</p>
        <button type="button" className="rounded-lg bg-primary px-5 py-3 text-white font-semibold" onClick={() => {
          setStatus('loading');
          setAttempt(value => value + 1);
        }}>Thử lại</button>
      </main>
    );
  }
  if (status === 'loading' || !user) {
    return <div role="status" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">Đang kiểm tra tài khoản...</div>;
  }
  if (user.account_status !== 'active' && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
