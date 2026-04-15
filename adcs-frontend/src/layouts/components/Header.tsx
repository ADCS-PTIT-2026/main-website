import { ChevronDown, LogOut } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Người dùng');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    console.log('Giá trị đã lưu:', storedUser);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Thông tin người dùng đã lưu:', parsedUser);
        if (parsedUser && parsedUser.name) {
          setUserName(parsedUser.name);
        }
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    }
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/5 px-8 py-4 flex items-center justify-between">
      
      {/* LEFT (có thể để title sau này) */}
      <div className="flex items-center gap-4">
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <button className="relative size-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        {/* Help */}
        <button className="size-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 overflow-hidden">
              <span className="font-bold uppercase text-sm">
                {userName.charAt(0)}
              </span>
            </div>

            {/* Name */}
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">
                {userName}
              </p>
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Màn hình Đăng xuất Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;