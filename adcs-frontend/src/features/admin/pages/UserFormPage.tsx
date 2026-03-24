import React, { useState, useEffect } from 'react';
import { userApi } from '../../../api/user';

interface UserFormData {
  display_name: string;
  email: string;
  phone: string;
  department_id: string;
  role_id: string;
  password: string;
  is_active: boolean;
}

interface UserFormPageProps {
  isEditMode?: boolean;
  initialData?: Omit<UserFormData, 'password'> | null;
  userId?: string | null;
  onClose?: () => void;
  onSaved?: () => void;
}

const UserFormPage: React.FC<UserFormPageProps> = ({
  isEditMode = false,
  initialData = null,
  userId = null,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    display_name: '',
    email: '',
    phone: '',
    department_id: '',
    role_id: '',
    password: '',
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        ...initialData,
        password: '',
      });
    } else {
      setFormData({
        display_name: '',
        email: '',
        phone: '',
        department_id: '',
        role_id: '',
        password: '',
        is_active: true,
      });
    }
  }, [isEditMode, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode) {
        if (!userId) throw new Error('Thiếu userId khi cập nhật.');

        await userApi.updateInfo(userId, {
          username: formData.display_name,
          email: formData.email,
        });

        await userApi.assign(userId, {
          role_id: formData.role_id || null,
          department_id: formData.department_id || null,
        });

        await userApi.changeStatus(userId, {
          is_active: formData.is_active,
        });
      } else {
        await userApi.create({
          email: formData.email,
          username: formData.display_name,
          password: formData.password,
        });
      }

      alert(isEditMode ? 'Cập nhật thành công!' : 'Thêm người dùng thành công!');
      onSaved?.();
      onClose?.();
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Lưu dữ liệu thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-body text-slate-900 dark:text-slate-100 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors outline-none"
            >
              <span className="material-symbols-outlined text-slate-500">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight font-headline">
                {isEditMode ? 'Chỉnh sửa Người dùng' : 'Thêm Người dùng mới'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isEditMode ? 'Cập nhật thông tin và quyền hạn' : 'Tạo hồ sơ truy cập hệ thống ADCS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all outline-none"
            >
              Hủy
            </button>

            <button
              type="submit"
              form="user-form"
              disabled={isLoading}
              className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-[0_4px_6px_-1px_rgba(213,68,68,0.2)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-70 outline-none"
            >
              {isLoading && (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  sync
                </span>
              )}
              {!isLoading && (
                <span className="material-symbols-outlined text-[20px]">save</span>
              )}
              <span>Lưu thông tin</span>
            </button>
          </div>
        </div>

        <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                Thông tin cá nhân
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Họ và tên <span className="text-primary">*</span>
                  </label>
                  <input
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email công việc <span className="text-primary">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="anv@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="0912 345 678"
                  />
                </div>

                {!isEditMode && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Mật khẩu <span className="text-primary">*</span>
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Nhập mật khẩu cho tài khoản"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                Phân quyền truy cập
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Phòng ban (Department)
                  </label>
                  <div className="relative">
                    <select
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none"
                    >
                      <option value="">-- Chọn phòng ban --</option>
                      <option value="dept_1">Phòng Kế toán</option>
                      <option value="dept_2">Khối Tài chính</option>
                      <option value="dept_3">Phòng IT</option>
                      <option value="dept_4">Ban Văn thư</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nhóm quyền (Role)
                  </label>
                  <div className="relative">
                    <select
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none"
                    >
                      <option value="">-- Chọn nhóm quyền --</option>
                      <option value="role_admin">Admin</option>
                      <option value="role_editor">Lãnh đạo học viện</option>
                      <option value="role_viewer">Cán bộ học viện</option>
                      <option value="role_clerk">Document Clerk</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    Trạng thái tài khoản
                  </h3>

                  <div className="flex flex-col gap-3">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="is_active"
                        checked={formData.is_active === true}
                        onChange={() => setFormData((prev) => ({ ...prev, is_active: true }))}
                        className="mt-1 w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <p className={`text-sm font-bold ${formData.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          Đang hoạt động
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Người dùng có thể đăng nhập và sử dụng hệ thống bình thường.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        !formData.is_active
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="is_active"
                        checked={formData.is_active === false}
                        onChange={() => setFormData((prev) => ({ ...prev, is_active: false }))}
                        className="mt-1 w-4 h-4 text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className={`text-sm font-bold ${!formData.is_active ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          Khóa / Chờ duyệt
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tài khoản bị vô hiệu hóa, không thể truy cập hệ thống.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default UserFormPage;