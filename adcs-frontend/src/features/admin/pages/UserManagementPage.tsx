import React, { useEffect, useMemo, useState } from 'react';
import UserFormPage from './UserFormPage';
import { type ApiUser, userApi } from '../../../api/user';

const ROLE_LABELS: Record<string, string> = {
  role_admin: 'Admin',
  role_editor: 'Lãnh đạo học viện',
  role_viewer: 'Cán bộ học viện',
  role_clerk: 'Document Clerk',
};

const DEPT_LABELS: Record<string, string> = {
  dept_1: 'Phòng Kế toán',
  dept_2: 'Khối Tài chính',
  dept_3: 'Phòng IT',
  dept_4: 'Ban Văn thư',
};

const ROLE_STYLES: Record<string, string> = {
  role_admin: 'bg-primary/5 text-primary border-primary/10',
  role_editor: 'bg-slate-100 text-slate-600 border-slate-200',
  role_viewer: 'bg-slate-100 text-slate-600 border-slate-200',
  role_clerk: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface UserFormData {
  display_name: string;
  email: string;
  phone: string;
  department_id: string;
  role_id: string;
  is_active: boolean;
}

interface UserRow {
  raw: ApiUser;
  id: string;
  avatarStr: string;
  avatarBg: string;
  name: string;
  dept: string;
  deptId: string;
  email: string;
  role: string;
  roleId: string;
  roleStyle: string;
  status: string;
  statusColor: 'emerald' | 'amber';
  statusDotClass: string;
  statusBadgeClass: string;
}

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedRole, selectedStatus]);

  useEffect(() => {
    if (isDeleteOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [isDeleteOpen]);

  useEffect(() => {
    const totalPagesNow = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    if (currentPage > totalPagesNow) setCurrentPage(totalPagesNow);
  }, [currentPage, pageSize]);

  const userRows: UserRow[] = useMemo(() => {
    return users.map((u) => {
      const isActive = u.is_active;
      return {
        raw: u,
        id: u.user_id,
        avatarStr: getInitials(u.username),
        avatarBg: 'bg-slate-100 text-slate-500',
        name: u.username,
        deptId: u.department_id || '',
        dept: DEPT_LABELS[u.department_id || ''] || 'Chưa gán',
        email: u.email,
        roleId: u.role_id || '',
        role: ROLE_LABELS[u.role_id || ''] || 'Chưa gán',
        roleStyle: ROLE_STYLES[u.role_id || ''] || 'bg-slate-100 text-slate-600 border-slate-200',
        status: isActive ? 'Đang hoạt động' : 'Chờ duyệt',
        statusColor: isActive ? 'emerald' : 'amber',
        statusDotClass: isActive ? 'bg-emerald-500' : 'bg-amber-500',
        statusBadgeClass: isActive
          ? 'text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20'
          : 'text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20',
      };
    });
  }, [users]);

  const filteredUsers = userRows.filter((user) => {
    const matchName = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept ? user.deptId === selectedDept : true;
    const matchRole = selectedRole ? user.roleId === selectedRole : true;
    const matchStatus = selectedStatus
      ? (selectedStatus === 'active' ? user.raw.is_active : !user.raw.is_active)
      : true;

    return matchName && matchDept && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const mapUserToFormData = (user: ApiUser): UserFormData => ({
    display_name: user.username,
    email: user.email,
    phone: '',
    department_id: user.department_id || '',
    role_id: user.role_id || '',
    is_active: user.is_active,
  });

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await userApi.remove(userToDelete.user_id);
      setIsDeleteOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Xóa người dùng thất bại.');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-body text-slate-900 dark:text-slate-100">
      {isFormOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-5xl bg-white shadow-2xl animate-slide-left h-full overflow-y-auto">
            <UserFormPage
              isEditMode={!!selectedUser}
              userId={selectedUser?.user_id || null}
              initialData={selectedUser ? mapUserToFormData(selectedUser) : null}
              onSaved={loadUsers}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedUser(null);
              }}
            />
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[1.875rem] font-black tracking-tight font-headline">
                Quản lý Người dùng
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Quản trị và phân quyền truy cập hệ thống ADCS
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedUser(null);
                setIsFormOpen(true);
              }}
              className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-[0_4px_6px_-1px_rgba(213,68,68,0.2)] hover:opacity-90 transition-all active:scale-95 outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span className="text-sm">Thêm người dùng mới</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-slate-100 dark:border-slate-800">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  search
                </span>
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
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Phòng ban
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Tất cả phòng ban</option>
                <option value="dept_1">Phòng Kế toán</option>
                <option value="dept_2">Khối Tài chính</option>
                <option value="dept_3">Phòng IT</option>
                <option value="dept_4">Ban Văn thư</option>
              </select>
            </div>

            <div className="w-full md:w-40">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Tất cả Role</option>
                <option value="role_admin">Admin</option>
                <option value="role_editor">Lãnh đạo học viện</option>
                <option value="role_viewer">Cán bộ học viện</option>
                <option value="role_clerk">Document Clerk</option>
              </select>
            </div>

            <div className="w-full md:w-44">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Trạng thái
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="pending">Chờ duyệt</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    {['STT', 'Họ tên', 'Phòng ban', 'Email', 'Roles', 'Trạng thái tài khoản', 'Hành động'].map((header, idx) => (
                      <th
                        key={idx}
                        className={`px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider ${
                          header === 'Hành động' ? 'text-right' : ''
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!isLoading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        Không tìm thấy người dùng phù hợp
                      </td>
                    </tr>
                  )}

                  {paginatedUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarBg}`}>
                            {user.avatarStr}
                          </div>
                          <span className="text-sm font-semibold">{user.name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {user.dept}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {user.email}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${user.roleStyle}`}>
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.statusDotClass}`}></span>
                          <span className={`text-[12px] font-medium ${user.statusBadgeClass}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user.raw);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all outline-none"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>

                          <button
                            onClick={() => {
                              setUserToDelete(user.raw);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all outline-none"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredUsers.length)} trong số {filteredUsers.length} người dùng
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {isDeleteOpen && (
        <div
          onClick={() => setIsDeleteOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600">warning</span>
            </div>

            <h2 className="text-lg font-bold text-center mb-2">Xóa người dùng?</h2>

            <p className="text-sm text-slate-500 text-center mb-6">
              Bạn có chắc muốn xóa{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {userToDelete?.username}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>

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
                onClick={handleDelete}
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