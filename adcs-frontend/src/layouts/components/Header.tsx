import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [userName, setUserName] = useState<string>('Người dùng');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
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

        {/* User Info */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors">
          
          {/* Avatar */}
          <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
            {/* Lấy chữ cái đầu tiên của tên làm Avatar */}
            <span className="font-bold uppercase">
              {userName.charAt(0)}
            </span>
          </div>

          {/* Name */}
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {/* Đã thay 'Admin PTIT' bằng biến userName */}
              {userName}
            </p>
          </div>

          {/* Dropdown icon */}
          <span className="material-symbols-outlined text-slate-400 text-sm">
            expand_more
          </span>
        </div>

      </div>
    </header>
  );
};

export default Header;