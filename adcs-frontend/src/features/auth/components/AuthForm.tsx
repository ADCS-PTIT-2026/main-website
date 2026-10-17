import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  onSubmit: (data: any) => void;
  onSSO: () => void;
  isLoading: boolean;
  errorMsg?: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, onSSO, isLoading, errorMsg }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate Email nội bộ
    if (!formData.email.endsWith('@ptit.edu.vn')) {
      setLocalError('Email phải có định dạng đuôi @ptit.edu.vn');
      return;
    }

    // Truyền dữ liệu lên component cha
    onSubmit({ ...formData, remember });
  };

  return (
    <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-primary/5 overflow-hidden">
      <div className="p-8">
        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Vui lòng đăng nhập vào tài khoản của bạn
          </p>
        </div>

        {/* Alert Message */}
        {(errorMsg || localError) && (
          <div className="mb-6 flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
            <p className="text-sm text-red-800 dark:text-red-200">{localError || errorMsg}</p>
          </div>
        )}

        {/* SSO Login Button (PTIT Keycloak SSO) */}
        <button 
          onClick={onSSO}
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 h-12 px-4 text-red-700 dark:text-red-300 text-sm font-bold hover:bg-red-100/50 dark:hover:bg-red-900/40 transition-all mb-6 shadow-sm"
        >
          <span className="material-symbols-outlined text-primary text-[22px]">school</span>
          <span>Đăng nhập bằng SSO PTIT</span>
        </button>


        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider">
            Hoặc sử dụng email
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {/* Form Đăng nhập */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email công ty
            </label>
            <input 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 text-base placeholder:text-slate-400" 
              placeholder="name@ptit.edu.vn" 
              type="email" 
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu
              </label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative group">
              <input 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 pr-10 text-base placeholder:text-slate-400" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"} 
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary" 
              id="remember" 
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)} 
            />
            <label className="text-sm text-slate-600 dark:text-slate-400" htmlFor="remember">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70" 
            type="submit"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline outline-none">
            Yêu cầu cấp tài khoản
          </Link>
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-center gap-6">
          <a className="text-xs text-slate-400 hover:text-primary cursor-pointer">Điều khoản</a>
          <a className="text-xs text-slate-400 hover:text-primary cursor-pointer">Bảo mật</a>
          <a className="text-xs text-slate-400 hover:text-primary cursor-pointer">Liên hệ</a>
        </div>
      </div>

      {/* Modal Hướng dẫn Quên mật khẩu */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <span className="material-symbols-outlined text-[28px]">lock_reset</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Khôi phục mật khẩu</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Để bảo mật tài khoản nội bộ ADCS, tính năng đặt lại mật khẩu tự động qua email công cộng hiện bị vô hiệu hóa. 
              <br /><br />
              Vui lòng liên hệ trực tiếp <strong>Quản trị viên hệ thống (Admin)</strong> qua email <span className="text-primary font-semibold">support@ptit.edu.vn</span> hoặc Trưởng phòng ban của bạn để được hỗ trợ cấp lại mật khẩu.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;