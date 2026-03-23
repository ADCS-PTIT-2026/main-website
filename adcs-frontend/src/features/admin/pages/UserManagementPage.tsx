import React, { useEffect, useState } from 'react';
import UserFormPage from './UserFormPage';

// --- Dữ liệu mẫu (Mock Data) ---
const USERS_DATA = [
  { 
    id: 1, avatarStr: 'NA', name: 'Nguyễn Văn A', avatarBg: 'bg-primary/10 text-primary', 
    dept: 'Phòng Kế toán', email: 'anvw@company.com', 
    role: 'Admin', roleStyle: 'bg-primary/5 text-primary border-primary/10', 
    status: 'Đang hoạt động', statusColor: 'emerald' 
  },
  { 
    id: 2, avatarStr: 'TB', name: 'Trần Thị B', avatarBg: 'bg-slate-100 text-slate-500', 
    dept: 'Khối Tài chính', email: 'btt@company.com', 
    role: 'Lãnh đạo học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
    status: 'Chờ duyệt', statusColor: 'amber' 
  },
  { 
    id: 3, avatarStr: 'LH', name: 'Lê Hoàng Nam', avatarBg: 'bg-blue-50 text-blue-600', 
    dept: 'Phòng IT', email: 'namlh@company.com', 
    role: 'Cán bộ học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
    status: 'Đang hoạt động', statusColor: 'emerald' 
  },
    { 
        id: 4, avatarStr: 'NA', name: 'Nguyễn Văn A', avatarBg: 'bg-primary/10 text-primary', 
        dept: 'Phòng Kế toán', email: 'anvw@company.com', 
        role: 'Admin', roleStyle: 'bg-primary/5 text-primary border-primary/10', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 5, avatarStr: 'TB', name: 'Trần Thị B', avatarBg: 'bg-slate-100 text-slate-500', 
        dept: 'Khối Tài chính', email: 'btt@company.com', 
        role: 'Lãnh đạo học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Chờ duyệt', statusColor: 'amber' 
    },
    { 
        id: 6, avatarStr: 'LH', name: 'Lê Hoàng Nam', avatarBg: 'bg-blue-50 text-blue-600', 
        dept: 'Phòng IT', email: 'namlh@company.com', 
        role: 'Cán bộ học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 7, avatarStr: 'NA', name: 'Nguyễn Văn A', avatarBg: 'bg-primary/10 text-primary', 
        dept: 'Phòng Kế toán', email: 'anvw@company.com', 
        role: 'Admin', roleStyle: 'bg-primary/5 text-primary border-primary/10', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 8, avatarStr: 'TB', name: 'Trần Thị B', avatarBg: 'bg-slate-100 text-slate-500', 
        dept: 'Khối Tài chính', email: 'btt@company.com', 
        role: 'Lãnh đạo học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Chờ duyệt', statusColor: 'amber' 
    },
    { 
        id: 9, avatarStr: 'LH', name: 'Lê Hoàng Nam', avatarBg: 'bg-blue-50 text-blue-600', 
        dept: 'Phòng IT', email: 'namlh@company.com', 
        role: 'Cán bộ học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 10, avatarStr: 'NA', name: 'Nguyễn Văn A', avatarBg: 'bg-primary/10 text-primary', 
        dept: 'Phòng Kế toán', email: 'anvw@company.com', 
        role: 'Admin', roleStyle: 'bg-primary/5 text-primary border-primary/10', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 11, avatarStr: 'TB', name: 'Trần Thị B', avatarBg: 'bg-slate-100 text-slate-500', 
        dept: 'Khối Tài chính', email: 'btt@company.com', 
        role: 'Lãnh đạo học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Chờ duyệt', statusColor: 'amber' 
    },
    { 
        id: 12, avatarStr: 'LH', name: 'Lê Hoàng Nam', avatarBg: 'bg-blue-50 text-blue-600', 
        dept: 'Phòng IT', email: 'namlh@company.com', 
        role: 'Cán bộ học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 13, avatarStr: 'NA', name: 'Nguyễn Văn A', avatarBg: 'bg-primary/10 text-primary', 
        dept: 'Phòng Kế toán', email: 'anvw@company.com', 
        role: 'Admin', roleStyle: 'bg-primary/5 text-primary border-primary/10', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    },
    { 
        id: 14, avatarStr: 'TB', name: 'Trần Thị B', avatarBg: 'bg-slate-100 text-slate-500', 
        dept: 'Khối Tài chính', email: 'btt@company.com', 
        role: 'Lãnh đạo học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Chờ duyệt', statusColor: 'amber' 
    },
    { 
        id: 15, avatarStr: 'LH', name: 'Lê Hoàng Nam', avatarBg: 'bg-blue-50 text-blue-600', 
        dept: 'Phòng IT', email: 'namlh@company.com', 
        role: 'Cán bộ học viện', roleStyle: 'bg-slate-100 text-slate-600 border-slate-200', 
        status: 'Đang hoạt động', statusColor: 'emerald' 
    }
];

interface UserFormData {
  display_name: string;
  email: string;
  phone: string;
  department_id: string;
  role_id: string;
  is_active: boolean;
}

const UserManagementPage: React.FC = () => {
  // State phục vụ tìm kiếm cơ bản
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedRole, selectedStatus]);

  // Pageination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);

  // State để lưu thông tin người dùng đang được chỉnh sửa (nếu có)   
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const mapUserToFormData = (user: any): UserFormData => ({
    display_name: user.name,
    email: user.email,
    phone: '',
    department_id: 'dept_1',
    role_id: user.role.toLowerCase(),
    is_active: user.status === 'Đang hoạt động',
  });

  const filteredUsers = USERS_DATA.filter(user => {
    const matchName = user.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchDept = selectedDept
        ? user.dept === selectedDept
        : true;

    const matchRole = selectedRole
        ? user.role === selectedRole
        : true;

    const matchStatus = selectedStatus
        ? user.status === selectedStatus
        : true;

    return matchName && matchDept && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  }, [totalPages]);

  const paginatedUsers = filteredUsers.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
  );

// State cho modal xóa người dùng
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  useEffect(() => {
  if (isDeleteOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  }, [isDeleteOpen]);

// System Stats  
  const activeCount = filteredUsers.filter(
    u => u.status === 'Đang hoạt động'
  ).length;

  const pendingCount = filteredUsers.filter(
    u => u.status === 'Chờ duyệt'
  ).length;

  const total = filteredUsers.length || 1;
  const activePercent = (activeCount / total) * 100;
  const pendingPercent = (pendingCount / total) * 100;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-body text-slate-900 dark:text-slate-100">
      {isFormOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-5xl bg-white shadow-2xl animate-slide-left h-full overflow-y-auto">
                <UserFormPage
                isEditMode={!!selectedUser}
                initialData={selectedUser ? mapUserToFormData(selectedUser) : null}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedUser(null);
                }}
                />
            </div>
        </div>
        ) : (
        

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[1.875rem] font-black tracking-tight font-headline">Quản lý Người dùng</h1>
            <p className="text-sm text-slate-500 mt-1">Quản trị và phân quyền truy cập hệ thống ADCS</p>
          </div>
          <button onClick={() => {
                setSelectedUser(null);
                setIsFormOpen(true);
            }}  
            className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-[0_4px_6px_-1px_rgba(213,68,68,0.2)] hover:opacity-90 transition-all active:scale-95 outline-none">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="text-sm">Thêm người dùng mới</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-slate-100 dark:border-slate-800">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tìm kiếm</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 outline-none" 
                placeholder="Tìm kiếm theo tên..." 
                type="text"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Phòng ban</label>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">Tất cả phòng ban</option>
              <option value="Phòng Kế toán">Phòng Kế toán</option>
              <option value="Khối Tài chính">Khối Tài chính</option>
              <option value="Phòng IT">Phòng IT</option>
            </select>
          </div>
          <div className="w-full md:w-40">
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Role</label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">Tất cả Role</option>
              <option value="Admin">Admin</option>
              <option value="Lãnh đạo học viện">Lãnh đạo học viện   </option>
              <option value="Cán bộ học viện">Cán bộ học viện</option>
            </select>
          </div>
          <div className="w-full md:w-44">
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Trạng thái</label>
            <select 
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  {['STT', 'Họ tên', 'Phòng ban', 'Email', 'Roles', 'Trạng thái tài khoản', 'Hành động'].map((header, idx) => (
                    <th key={idx} className={`px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider ${header === 'Hành động' ? 'text-right' : ''}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                    Không tìm thấy người dùng phù hợp
                    </td>
                </tr>
                )}
                {paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarBg}`}>
                          {user.avatarStr}
                        </div>
                        <span className="text-sm font-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.dept}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${user.roleStyle}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full bg-${user.statusColor}-500`}></span>
                        <span className={`text-[12px] font-medium text-${user.statusColor}-700 dark:text-${user.statusColor}-400 px-2 py-0.5 rounded bg-${user.statusColor}-50 dark:bg-${user.statusColor}-900/20`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => {
                            setSelectedUser(user);
                            setIsFormOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all outline-none">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all outline-none">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <span className="text-xs text-slate-500 font-medium">
                Hiển thị {(currentPage - 1) * pageSize + 1}
                -
                {Math.min(currentPage * pageSize, filteredUsers.length)}
                trong số {filteredUsers.length} người dùng
            </span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all outline-none">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${
                  currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 text-slate-600'
                  }`}
              >
                {page}
            </button>
            ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all outline-none">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Stats / Bento Style Info Grid */}    
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Hoạt động</p>
                <h3 className="text-2xl font-black font-headline">{activeCount}</h3>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activePercent}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined">pending</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Chờ duyệt</p>
                <h3 className="text-2xl font-black font-headline">{pendingCount}</h3>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pendingPercent}%` }}></div>
            </div>
          </div>
        </div>

      </main>
      )}
    
    {isDeleteOpen && (
      <div onClick={() => setIsDeleteOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
          
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
            <span className="material-symbols-outlined text-red-600">
              warning
            </span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-center mb-2">
            Xóa người dùng?
          </h2>

          {/* Content */}
          <p className="text-sm text-slate-500 text-center mb-6">
            Bạn có chắc muốn xóa{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {userToDelete?.name}
            </span>? Hành động này không thể hoàn tác.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsDeleteOpen(false);
                setUserToDelete(null);
              }}
              className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>

            <button
              onClick={() => {
                console.log('Delete user:', userToDelete);
                // TODO: call API delete

                setIsDeleteOpen(false);
                setUserToDelete(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default UserManagementPage;