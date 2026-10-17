import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authAPI } from '../../../api/auth';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      authAPI.ptitSsoCallback(code)
        .then((response) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          navigate('/dashboard', { replace: true });
        })
        .catch((error) => {
          console.error('SSO Callback Error:', error);
          const detail = error.response?.data?.detail || 'sso_failed';
          navigate(`/login?error=${encodeURIComponent(detail)}`, { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-display px-4">
      <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Đang xác thực PTIT SSO</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Vui lòng đợi trong giây lát, hệ thống đang đồng bộ phiên đăng nhập...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;