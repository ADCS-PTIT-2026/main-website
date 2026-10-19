import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../../api/auth';
import { clearAuthStorage } from '../../../api/axiosClient';

export default function PendingAccountNotice() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const signInAgain = async () => {
    setLeaving(true);
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    try {
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch { /* Local logout still works when the server cannot be reached. */ }
    finally {
      clearAuthStorage();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <section aria-labelledby="pending-account-title" className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-800 dark:bg-slate-900 sm:p-10">
        <span aria-hidden="true" className="material-symbols-outlined mb-5 inline-flex size-14 items-center justify-center rounded-full bg-amber-50 text-3xl text-amber-700 dark:bg-amber-950 dark:text-amber-300">pending_actions</span>
        <h1 id="pending-account-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">Tài khoản đang chờ cấp quyền</h1>
        <p role="status" className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">Vui lòng chờ hoặc liên hệ admin để cấp quyền cho tài khoản.</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Sau khi được duyệt và gán vai trò, hãy đăng nhập lại để sử dụng hệ thống.</p>
        <button type="button" disabled={leaving} onClick={signInAgain} className="mt-6 min-h-11 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">{leaving ? 'Đang đăng xuất...' : 'Đăng nhập lại'}</button>
      </section>
    </div>
  );
}
