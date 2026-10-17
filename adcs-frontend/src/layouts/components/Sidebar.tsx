import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/ptit-logo.png';
import { FeedbackModal } from '../../components/FeedbackModal';

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Bảng điều khiển', path: '/dashboard' },
  { icon: 'description', label: 'Xử lý văn bản', path: '/documents' },
  { icon: 'folder_shared', label: 'Văn bản của tôi', path: '/documents/my' },
  { icon: 'translate', label: 'Dịch thuật văn bản', path: '/translation' },
  { icon: 'archive', label: 'Kho văn bản', path: '/document-repository' },
  { icon: 'groups', label: 'Phòng ban', path: '/departments' },
  { icon: 'history', label: 'Lịch sử xử lý', path: '/history' },
  {
    icon: 'admin_panel_settings',
    label: 'Trang Quản lý',
    isAdminOnly: true,
    children: [
      { label: 'Tài khoản', path: '/admin/users' },
      { label: 'Nhóm quyền', path: '/admin/roles' },
      { label: 'AI Configuration', path: '/admin/ai-config' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const [userName, setUserName] = useState<string>('Người dùng');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // State theme và modal góp ý
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          if (parsedUser.name) setUserName(parsedUser.name);
          if (parsedUser.email) setUserEmail(parsedUser.email);
          if (parsedUser.role) setUserRole(parsedUser.role.toLowerCase());
        }
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    }
  }, []);

  // Đóng user menu khi click ra ngoài
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.isAdminOnly && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const parentIndex = visibleNavItems.findIndex(item =>
      item.children?.some(child => child.path === location.pathname)
    );

    if (parentIndex !== -1 && openIndex === null) {
      setOpenIndex(parentIndex);
    }
  }, [location.pathname, visibleNavItems]);

  return (
    <aside className="w-64 z-50 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-primary/10 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
          <img src={logo} alt="PTIT Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">PTIT AI</h1>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Document System</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto min-h-0">
        {visibleNavItems.map((item, idx) => {
          const isParent = !!item.children;
          const isOpen = openIndex === idx;
          const isActive = item.path && location.pathname === item.path;

          const baseClass = `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`;

          return (
            <div key={idx}>
              {isParent ? (
                <div onClick={() => setOpenIndex(isOpen ? null : idx)} className={`${baseClass} cursor-pointer`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-sm">{isOpen ? 'expand_less' : 'expand_more'}</span>
                </div>
              ) : (
                <Link to={item.path!} className={baseClass}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Link>
              )}

              {/* Children Nodes */}
              {isParent && isOpen && item.children && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child, cIdx) => {
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={cIdx}
                        to={child.path}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          isChildActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* FOOTER SIDEBAR (Đổi theme, Góp ý, User Profile) */}
      <div className="p-3 border-t border-primary/10 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
        {/* Tiện ích: Đổi theme & Góp ý dạng 2 dòng riêng biệt */}
        <div className="space-y-1 pb-1 border-b border-slate-200/60 dark:border-slate-800">
          {/* Dòng 1: Đổi Theme Background */}
          <button 
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
            title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-amber-500 group-hover:rotate-45 transition-transform duration-300">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span>{isDarkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
            </div>
            {/* Visual toggle switch */}
            <div className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`bg-white size-3 rounded-full shadow-md transform transition-transform ${isDarkMode ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Dòng 2: Góp ý */}
          <button 
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer group"
            title="Gửi góp ý hoặc báo lỗi đến team dev"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
                rate_review
              </span>
              <span>Đóng góp ý kiến</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-xs">
              arrow_forward_ios
            </span>
          </button>
        </div>

        {/* Khối User Profile & Dropdown Popover */}
        <div className="relative" ref={userMenuRef}>
          {/* Menu Popover mở ngược lên trên */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden animate-fade-in">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={userName}>{userName}</p>
                <p className="text-[11px] text-slate-400 truncate" title={userEmail || ''}>
                  {userEmail || (userRole === 'admin' ? 'Quản trị viên' : 'Thành viên')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/profile');
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">manage_accounts</span>
                <span>Hồ sơ cá nhân</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* Widget người dùng */}
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer select-none transition-all ${
              isUserMenuOpen 
                ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700' 
                : 'hover:bg-white/80 dark:hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-red-200/60">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200" title={userName}>
                  {userName}
                </p>
                <span className="text-[10px] font-medium text-slate-400 capitalize block truncate">
                  {userRole === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                </span>
              </div>
            </div>
            <span className={`material-symbols-outlined text-slate-400 text-base transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}>
              unfold_more
            </span>
          </div>
        </div>
      </div>

      {/* Modal Góp ý */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;