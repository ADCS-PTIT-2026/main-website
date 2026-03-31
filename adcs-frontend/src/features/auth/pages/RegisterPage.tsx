import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../../assets/ptit-logo.png';
import { authAPI } from '../../../api/auth';

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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

    // Validate Email
    if (!formData.email.endsWith('@ptit.edu.vn')) {
      setErrorMsg('Email phải có định dạng đuôi @ptit.edu.vn');
      return;
    }

    // Validate Mật khẩu
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      setErrorMsg('Mật khẩu phải từ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.register(formData.name, formData.email, formData.password);
      alert('Yêu cầu cấp tài khoản đã được gửi! Vui lòng chờ phê duyệt hoặc đăng nhập.');
      navigate('/login');
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
         setErrorMsg(error.response.data.detail);
      } else {
         setErrorMsg('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email công ty</label>
                <input 
                  name="email" value={formData.email} onChange={handleChange} required 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all p-3 text-base placeholder:text-slate-400" 
                  placeholder="name@ptit.edu.vn" type="email" 
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