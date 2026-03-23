// src/features/auth/components/AuthForm.tsx
import React, { useState } from 'react';

interface AuthFormProps {
  onSubmit: (data: any, isLogin: boolean) => void;
  onSSO: () => void;
  isLoading: boolean;
  errorMsg?: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, onSSO, isLoading, errorMsg }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, isLogin);
  };

  return (
    <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-primary/5 overflow-hidden">
      <div className="p-8">
        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2">
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {isLogin ? 'Vui lòng đăng nhập vào tài khoản của bạn' : 'Điền thông tin để tham gia hệ thống'}
          </p>
        </div>

        {/* Alert Message */}
        {errorMsg && (
          <div className="mb-6 flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
            <p className="text-sm text-red-800 dark:text-red-200">{errorMsg}</p>
          </div>
        )}

        {/* SSO Login Button (Outlook) */}
        <button 
          onClick={onSSO}
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 px-4 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.4 12L0 10.2V2.1L11.4 0V12ZM12.6 0V12H24V2.1L12.6 0ZM0 13.8V21.9L11.4 24V12L0 13.8ZM12.6 24L24 21.9V13.8H12.6V24Z" fill="#0078D4"/>
          </svg>
          <span>Tiếp tục với Outlook</span>
        </button>

        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider">
            Hoặc sử dụng email
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {/* Form Đăng nhập / Đăng ký */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên
              </label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 text-base placeholder:text-slate-400" 
                placeholder="Nguyễn Văn A" 
                type="text" 
              />
            </div>
          )}

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
              {isLogin && (
                <a className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                  Quên mật khẩu?
                </a>
              )}
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

          {isLogin && (
            <div className="flex items-center gap-2">
              <input className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary" id="remember" type="checkbox" />
              <label className="text-sm text-slate-600 dark:text-slate-400" htmlFor="remember">
                Ghi nhớ đăng nhập
              </label>
            </div>
          )}

          <button 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70" 
            type="submit"
          >
            {isLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Yêu cầu cấp tài khoản')}
            {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-primary hover:underline outline-none"
          >
            {isLogin ? 'Yêu cầu cấp tài khoản' : 'Đăng nhập ngay'}
          </button>
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-center gap-6">
          <a className="text-xs text-slate-400 hover:text-primary cursor-pointer">Điều khoản</a>
          <a className="text-xs text-slate-400 hover:text-primary cursor-pointer">Bảo mật</a>
          <a className="text-xs text-slate-400 hover:text-primary cursor-pointer">Liên hệ</a>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;