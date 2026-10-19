import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/ptit-logo.png';
import { authAPI } from '../../api/auth';
import { usePermission } from '../../hooks/usePermission';
import { FeedbackModal } from '../../components/FeedbackModal';

export interface SidebarProps {
  isOpen?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleDesktop?: () => void;
}

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Bảng điều khiển', path: '/dashboard' },
  { icon: 'description', label: 'Xử lý văn bản', path: '/documents' },
  { icon: 'folder_shared', label: 'Văn bản của tôi', path: '/documents/my' },
  { icon: 'translate', label: 'Dịch thuật văn bản', path: '/translation' },
  { icon: 'archive', label: 'Kho văn bản', path: '/document-repository' },
  { icon: 'account_tree', label: 'Phòng ban', path: '/departments' },
  { icon: 'history', label: 'Lịch sử xử lý', path: '/history' },
  {
    icon: 'admin_panel_settings',
    label: 'Trang Quản lý',
    isAdminOnly: true,
    children: [
      { icon: 'group', label: 'Tài khoản', path: '/admin/users' },
      { icon: 'shield_person', label: 'Nhóm quyền', path: '/admin/roles' },
      { icon: 'tune', label: 'Cấu hình AI', path: '/admin/ai-config' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  isMobileOpen = false,
  onCloseMobile,
  onToggleDesktop,
}) => {
  const location = useLocation();
  const { isAdmin, isPending } = usePermission();
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const [userName, setUserName] = useState<string>('Người dùng');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    if (refreshToken) {
      try { await authAPI.logout(refreshToken); } catch { /* Clear the local session even if the server is unavailable. */ }
    }
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
          if (parsedUser.name || parsedUser.username) setUserName(parsedUser.name || parsedUser.username);
          if (parsedUser.email) setUserEmail(parsedUser.email);
          if (parsedUser.role) setUserRole(parsedUser.role.toLowerCase());
        }
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    }
  }, []);

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
    if (isPending) return item.path === '/dashboard';
    if (item.isAdminOnly && !isAdmin) {
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
  }, [location.pathname, visibleNavItems, openIndex]);

  return (
    <>
      {/* Backdrop cho màn hình nhỏ (Mobile / Tablet) */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden animate-fade-in"
        />
      )}

      <aside
        aria-label="Thanh điều hướng chính"
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full w-72'}
          lg:static lg:translate-x-0 lg:shadow-none shrink-0
          ${isOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        <div className="w-full h-full flex flex-col">
          {/* Header Logo & Nút thu gọn/mở rộng Sidebar */}
          <div
            className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800/80 shrink-0 transition-all ${
              isOpen ? 'px-5 justify-between' : 'px-5 justify-between lg:px-2 lg:justify-center'
            }`}
          >
            <Link
              to="/dashboard"
              onClick={onCloseMobile}
              title="PTIT AI - Bảng điều khiển"
              className={`flex items-center gap-3 min-w-0 group focus:outline-none ${
                !isOpen ? 'lg:justify-center' : ''
              }`}
            >
              <div className="size-9 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-100 dark:border-slate-800 shrink-0 p-1 group-hover:scale-105 transition-transform">
                <img src={logo} alt="PTIT Logo" className="w-full h-full object-contain" />
              </div>
              <div className={`min-w-0 transition-opacity duration-200 ${!isOpen ? 'lg:hidden' : ''}`}>
                <h1 className="text-lg font-extrabold tracking-tight text-primary leading-none truncate">
                  PTIT AI
                </h1>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mt-1 truncate">
                  Document System
                </p>
              </div>
            </Link>

            {/* Nút đóng trên Mobile */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng menu"
                aria-label="Đóng menu"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}

            {/* Nút thu gọn trên Desktop khi đang mở rộng */}
            {onToggleDesktop && isOpen && (
              <button
                type="button"
                onClick={onToggleDesktop}
                className="hidden lg:flex size-8 rounded-lg items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Thu gọn thanh bên (chỉ hiện icon)"
                aria-label="Thu gọn thanh bên"
              >
                <span className="material-symbols-outlined text-[20px]">left_panel_close</span>
              </button>
            )}
          </div>

          {/* Danh sách điều hướng */}
          <nav
            className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar transition-all ${
              isOpen ? 'px-3' : 'px-3 lg:px-2'
            }`}
          >
            <p
              className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                !isOpen ? 'lg:hidden' : ''
              }`}
            >
              Chức năng chính
            </p>
            {visibleNavItems.map((item, idx) => {
              const isParent = !!item.children;
              const isOpenSub = openIndex === idx;
              const isChildSelected = item.children?.some(c => location.pathname === c.path);
              const isActive = item.path ? location.pathname === item.path : isChildSelected;

              const baseClass = `w-full flex items-center rounded-xl text-sm transition-all cursor-pointer select-none ${
                isOpen
                  ? 'justify-between gap-3 px-3 py-2.5'
                  : 'justify-between gap-3 px-3 py-2.5 lg:justify-center lg:px-0 lg:py-2.5'
              } ${
                isActive && !isParent
                  ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                  : isActive && isParent
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`;

              return (
                <div
                  key={idx}
                  className={
                    item.isAdminOnly
                      ? 'pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80'
                      : ''
                  }
                >
                  {item.isAdminOnly && (
                    <p
                      className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                        !isOpen ? 'lg:hidden' : ''
                      }`}
                    >
                      Quản trị hệ thống
                    </p>
                  )}

                  {isParent ? (
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpenSub ? null : idx)}
                      aria-expanded={isOpenSub}
                      title={item.label}
                      className={baseClass}
                    >
                      <div className={`flex items-center gap-3 min-w-0 ${!isOpen ? 'lg:justify-center' : ''}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className={`truncate ${!isOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                          isOpenSub ? 'rotate-180' : ''
                        } ${!isOpen ? 'lg:hidden' : ''}`}
                        aria-hidden="true"
                      >
                        expand_more
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={item.path!}
                      onClick={onCloseMobile}
                      title={item.label}
                      className={baseClass}
                    >
                      <div className={`flex items-center gap-3 min-w-0 ${!isOpen ? 'lg:justify-center' : ''}`}>
                        <span className="material-symbols-outlined text-[22px] shrink-0" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className={`truncate ${!isOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
                      </div>
                    </Link>
                  )}

                  {/* Menu con của Quản trị (hỗ trợ cả chế độ mở rộng và thu gọn chỉ hiện icon) */}
                  {isParent && isOpenSub && item.children && (
                    <div
                      className={`mt-1 space-y-1 ${
                        isOpen
                          ? 'ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800'
                          : 'ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800 lg:ml-0 lg:pl-0 lg:border-l-0 lg:bg-slate-50/80 lg:dark:bg-slate-800/40 lg:rounded-xl lg:p-1'
                      }`}
                    >
                      {item.children.map((child, cIdx) => {
                        const isChildActive = location.pathname === child.path;

                        return (
                          <Link
                            key={cIdx}
                            to={child.path}
                            onClick={onCloseMobile}
                            title={child.label}
                            className={`flex items-center rounded-lg transition-all ${
                              isOpen
                                ? 'gap-2.5 px-3 py-2 text-xs'
                                : 'gap-2.5 px-3 py-2 text-xs lg:justify-center lg:px-0 lg:py-2'
                            } ${
                              isChildActive
                                ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20'
                                : 'text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
                              {child.icon}
                            </span>
                            <span className={`truncate ${!isOpen ? 'lg:hidden' : ''}`}>{child.label}</span>
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
          <div
            className={`border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-1.5 shrink-0 transition-all ${
              isOpen ? 'p-3' : 'p-3 lg:p-2'
            }`}
          >
            <div className="space-y-1 pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
              {/* Nút mở rộng lại Sidebar khi đang ở chế độ thu gọn trên Desktop */}
              {onToggleDesktop && !isOpen && (
                <button
                  type="button"
                  onClick={onToggleDesktop}
                  className="hidden lg:flex w-full items-center justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  title="Mở rộng thanh điều hướng"
                  aria-label="Mở rộng thanh điều hướng"
                >
                  <span className="material-symbols-outlined text-[20px]">left_panel_open</span>
                </button>
              )}

              {/* Đổi Theme */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-full flex items-center rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${
                  isOpen ? 'justify-between px-3 py-2' : 'justify-between px-3 py-2 lg:justify-center lg:px-0'
                }`}
                title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="material-symbols-outlined text-[20px] text-amber-500 group-hover:rotate-45 transition-transform duration-300 shrink-0"
                    aria-hidden="true"
                  >
                    {isDarkMode ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span className={!isOpen ? 'lg:hidden' : ''}>
                    {isDarkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}
                  </span>
                </div>
                <div
                  className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                    isDarkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  } ${!isOpen ? 'lg:hidden' : ''}`}
                >
                  <div
                    className={`bg-white size-3 rounded-full shadow-md transform transition-transform ${
                      isDarkMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {/* Góp ý */}
              {!isPending && <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(true)}
                className={`w-full flex items-center rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer group ${
                  isOpen ? 'justify-between px-3 py-2' : 'justify-between px-3 py-2 lg:justify-center lg:px-0'
                }`}
                title="Đóng góp ý kiến"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 transition-transform shrink-0"
                    aria-hidden="true"
                  >
                    rate_review
                  </span>
                  <span className={!isOpen ? 'lg:hidden' : ''}>Đóng góp ý kiến</span>
                </div>
                <span
                  className={`material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-xs ${
                    !isOpen ? 'lg:hidden' : ''
                  }`}
                  aria-hidden="true"
                >
                  arrow_forward_ios
                </span>
              </button>}
            </div>

            {/* Khối User Profile & Dropdown Popover */}
            <div className="relative" ref={userMenuRef}>
              {isUserMenuOpen && (
                <div
                  className={`absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden animate-scale-up ${
                    isOpen ? 'right-0' : 'right-0 lg:right-auto lg:w-56'
                  }`}
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={userName}>
                      {userName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate" title={userEmail || ''}>
                      {userEmail || (userRole === 'admin' ? 'Quản trị viên' : 'Thành viên')}
                    </p>
                  </div>

                  {!isPending && <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onCloseMobile?.();
                      navigate('/profile');
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                      manage_accounts
                    </span>
                    <span>Hồ sơ cá nhân</span>
                  </button>}

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      logout
                    </span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={`${userName} (${isPending ? 'Chờ cấp quyền' : userRole === 'admin' ? 'Quản trị viên' : 'Thành viên'})`}
                className={`w-full flex items-center p-2 rounded-xl cursor-pointer select-none transition-all ${
                  isOpen ? 'justify-between' : 'justify-between lg:justify-center lg:p-1.5'
                } ${
                  isUserMenuOpen
                    ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'hover:bg-white/80 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className={`min-w-0 text-left ${!isOpen ? 'lg:hidden' : ''}`}>
                    <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200" title={userName}>
                      {userName}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 capitalize block truncate">
                      {isPending ? 'Chờ cấp quyền' : userRole === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                    </span>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-slate-400 text-base transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  } ${!isOpen ? 'lg:hidden' : ''}`}
                  aria-hidden="true"
                >
                  unfold_more
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal Góp ý */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
