import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/ptit-logo.png';

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Bảng điều khiển', path: '/dashboard' },
  { icon: 'description', label: 'Xử lý văn bản', path: '/documents' },
  { icon: 'translate', label: 'Dịch thuật văn bản', path: '/translation' },
  { icon: 'archive', label: 'Kho văn bản', path: '/document-repository' },
  { icon: 'groups', label: 'Phòng ban', path: '/departments' },
  { icon: 'history', label: 'Lịch sử xử lý', path: '/history' },
  {
    icon: 'admin_panel_settings',
    label: 'Trang Quản lý',
    children: [
      { label: 'Tài khoản', path: '/admin/users' },
      { label: 'Nhóm quyền', path: '/admin/roles' },
      { label: 'AI Configuration', path: '/admin/ai-config' },
    ],
  },
];



const Sidebar: React.FC = () => {
  const location = useLocation();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const parentIndex = NAV_ITEMS.findIndex(item =>
      item.children?.some(child => child.path === location.pathname)
    );

    if (parentIndex !== -1 && openIndex === null) {
      setOpenIndex(parentIndex);
    }
  }, [location.pathname]);

  return (
    <aside className="w-64 z-50 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-primary/10 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
            <img 
            src={logo} 
            alt="PTIT Logo" 
            className="w-full h-full object-contain"
            />
        </div>
        <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">PTIT AI</h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
            Document System
            </p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map((item, idx) => {
          const isParent = !!item.children;
          const isOpen = openIndex === idx;

          const isActive =
            item.path && location.pathname === item.path;

          const baseClass = `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`;

          return (
            <div key={idx}>
              {isParent ? (
                <div
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className={`${baseClass} cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </div>

                  <span className="material-symbols-outlined text-sm">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              ) : (
                <Link to={item.path!} className={baseClass}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Link>
              )}

              {/* Children */}
              {isParent && isOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child, cIdx) => {
                    const isChildActive =
                      location.pathname === child.path;

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

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          {/* <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm">Cài đặt</span>
          </Link> */}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        {/* <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">Admin PTIT</p>
            <p className="text-[10px] text-slate-500 truncate">Quản trị viên</p>
          </div>
        </div> */}
      </div>
    </aside>
  );
};

export default Sidebar;