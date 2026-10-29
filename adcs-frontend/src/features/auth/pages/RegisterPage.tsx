import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/ptit-logo.png';
import { authAPI } from '../../../api/auth';
import { getApiError } from '../../../api/errors';

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Email PTIT
    const lowerEmail = formData.email.trim().toLowerCase();
    const isPtitEmail = lowerEmail.endsWith('@ptit.edu.vn') || lowerEmail.endsWith('@stu.ptit.edu.vn');
    if (!isPtitEmail) {
      setErrorMsg('Chỉ chấp nhận email thuộc Học viện (@ptit.edu.vn hoặc @stu.ptit.edu.vn)');
      return;
    }

    // Validate Mật khẩu
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      setErrorMsg('Mật khẩu phải từ 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số.');
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await authAPI.register(formData.name.trim(), lowerEmail, formData.password);
      setSuccessMessage(res?.message || 'Đăng ký thành công! Tài khoản của bạn đang chờ Quản trị viên phê duyệt.');
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMsg(getApiError(error, 'Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-slate-900 px-6 py-3 lg:px-10">
        <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <img src={logo} alt="PTIT Logo" className="h-9 w-auto object-contain drop-shadow-sm" />
          <h2 className="text-lg font-bold tracking-[-0.015em]">PTIT ADCS</h2>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-primary/5 overflow-hidden">
          <div className="p-8">
            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Đăng ký thành công!
                </h2>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-900 dark:text-amber-200 text-sm leading-relaxed text-left">
                  <p className="font-semibold mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    Chờ kích hoạt tài khoản
                  </p>
                  {successMessage}
                </div>
                <p className="text-slate-500 text-xs">
                  Vui lòng liên hệ với Quản trị viên hệ thống để được phê duyệt và cấp quyền phòng ban.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all gap-2"
                  >
                    <span>Quay lại trang Đăng nhập</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2">
                    Tạo tài khoản mới
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-base">
                    Điền thông tin để tham gia hệ thống
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-6 flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
                    <p className="text-sm text-red-800 dark:text-red-200">{errorMsg}</p>
                  </div>
                )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Họ và tên</label>
                <input 
                  name="name" value={formData.name} onChange={handleChange} required 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 text-base placeholder:text-slate-400" 
                  placeholder="Nguyễn Văn A" type="text" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Học viện (@ptit.edu.vn / @stu.ptit.edu.vn)</label>
                <input 
                  name="email" value={formData.email} onChange={handleChange} required 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 text-base placeholder:text-slate-400" 
                  placeholder="canbo@ptit.edu.vn hoặc sv@stu.ptit.edu.vn" type="email" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu</label>
                <div className="relative group">
                  <input 
                    name="password" value={formData.password} onChange={handleChange} required 
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 pr-10 text-base placeholder:text-slate-400" 
                    placeholder="••••••••" type={showPassword ? "text" : "password"} 
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button 
                disabled={isLoading} 
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70" 
                type="submit"
              >
                {isLoading ? 'Đang xử lý...' : 'Yêu cầu cấp tài khoản'}
                {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-primary hover:underline outline-none">
                Đăng nhập ngay
              </Link>
            </p>
          </>
        )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-xs">
        <p>© 2026 Học viện Công nghệ Bưu chính Viễn thông. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default RegisterPage;