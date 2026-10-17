import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import logo from '../assets/ptit-logo.png';

const PAGE_METADATA: Record<string, { title: string; subtitle: string; icon: string }> = {
  '/dashboard': { title: 'Bảng điều khiển', subtitle: 'Tổng quan hoạt động hệ thống AI', icon: 'dashboard' },
  '/documents': { title: 'Tiếp nhận & Xử lý văn bản', subtitle: 'Bóc tách OCR & Phân luồng AI tự động', icon: 'description' },
  '/documents/my': { title: 'Văn bản của tôi', subtitle: 'Theo dõi hàng đợi & lịch sử tải lên cá nhân', icon: 'folder_shared' },
  '/translation': { title: 'Dịch thuật văn bản', subtitle: 'Dịch thuật tài liệu đa ngôn ngữ bằng AI', icon: 'translate' },
  '/document-repository': { title: 'Kho văn bản', subtitle: 'Tra cứu ngữ nghĩa (Semantic Search) & Lưu trữ', icon: 'archive' },
  '/departments': { title: 'Sơ đồ Phòng ban', subtitle: 'Cơ cấu tổ chức & Ngữ cảnh phân luồng AI', icon: 'account_tree' },
  '/history': { title: 'Lịch sử xử lý', subtitle: 'Nhật ký phân tích LLM, lưu trữ & thông báo', icon: 'history' },
  '/profile': { title: 'Hồ sơ cá nhân', subtitle: 'Thông tin tài khoản, bảo mật & liên kết Telegram', icon: 'manage_accounts' },
  '/admin/users': { title: 'Quản lý Người dùng', subtitle: 'Quản trị tài khoản & phân quyền phòng ban', icon: 'group' },
  '/admin/roles': { title: 'Quản lý Nhóm quyền', subtitle: 'Thiết lập vai trò & ma trận phân quyền', icon: 'shield_person' },
  '/admin/ai-config': { title: 'Cấu hình AI Hệ thống', subtitle: 'Tinh chỉnh System Prompt & tham số mô hình LLM', icon: 'tune' },
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('adcs_sidebar_open') !== 'false';
  });
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const toggleDesktopSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('adcs_sidebar_open', String(next));
      return next;
    });
  };

  // Tự động đóng menu mobile khi đổi trang
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Đóng menu mobile khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const currentMeta = PAGE_METADATA[location.pathname] || {
    title: 'Hệ thống ADCS',
    subtitle: 'Quản lý và phân loại văn bản thông minh',
    icon: 'auto_awesome',
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-display">
      <Sidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleDesktop={toggleDesktopSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Thanh Top Header đồng bộ cho toàn bộ trang */}
        <header className="h-14 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Nút mở Sidebar trên Mobile (< lg) */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden size-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Mở menu điều hướng"
              aria-label="Mở menu điều hướng"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* Nút Thu gọn/Mở rộng Sidebar trên Desktop (>= lg) */}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="hidden lg:flex items-center justify-center size-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Thu gọn thanh bên (chỉ hiện icon)' : 'Mở rộng thanh bên'}
              aria-label={isSidebarOpen ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarOpen ? 'left_panel_close' : 'left_panel_open'}
              </span>
            </button>

            {/* Hiển thị Logo rút gọn trên Mobile (< lg) */}
            <Link
              to="/dashboard"
              className="flex lg:hidden items-center gap-2 shrink-0"
            >
              <img src={logo} alt="PTIT" className="size-7 object-contain" />
              <span className="font-extrabold text-sm text-primary hidden sm:inline">PTIT AI</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            </Link>

            {/* Breadcrumb / Tiêu đề trang hiện tại */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[18px] hidden sm:inline-block shrink-0" aria-hidden="true">
                {currentMeta.icon}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {currentMeta.title}
              </span>
              <span className="hidden md:inline-block text-xs text-slate-400 dark:text-slate-500 truncate">
                — {currentMeta.subtitle}
              </span>
            </div>
          </div>

          {/* Tác vụ nhanh bên phải Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Sẵn sàng</span>
            </div>

            {location.pathname !== '/documents' && (
              <Link
                to="/documents"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">upload_file</span>
                <span className="hidden sm:inline">Xử lý văn bản</span>
              </Link>
            )}
          </div>
        </header>

        {/* Vùng nội dung chính của các trang */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;