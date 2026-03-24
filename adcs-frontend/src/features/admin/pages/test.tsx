import React, { useMemo, useState } from 'react';

type Role = {
  id: string;
  name: string;
  desc: string;
  colorClass: string;
};

type RoleFormState = {
  id: string;
  name: string;
  desc: string;
  colorClass: string;
};

const INITIAL_ROLES: Role[] = [
  { id: 'admin', name: 'Admin', desc: 'Toàn quyền quản trị hệ thống, quản lý người dùng và cấu hình', colorClass: 'bg-primary/10 text-primary' },
  { id: 'editor', name: 'Editor', desc: 'Biên tập, chỉnh sửa và phê duyệt các tài liệu nội bộ', colorClass: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  { id: 'viewer', name: 'Viewer', desc: 'Chỉ có quyền xem và tải tài liệu được cấp phép', colorClass: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  { id: 'clerk', name: 'Document Clerk', desc: 'Quản lý văn thư, lưu trữ và tải lên hệ thống tài liệu số', colorClass: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
];

const PERMISSIONS = [
  { key: 'document.view', label: 'Xem danh sách và chi tiết tài liệu' },
  { key: 'document.add', label: 'Tạo mới bản ghi tài liệu' },
  { key: 'document.edit', label: 'Sửa đổi thông tin tài liệu hiện có' },
  { key: 'document.delete', label: 'Xóa vĩnh viễn tài liệu khỏi hệ thống' },
  { key: 'document.upload', label: 'Tải tệp đính kèm lên hệ thống' },
];

const COLOR_OPTIONS = [
  { label: 'Primary', value: 'bg-primary/10 text-primary' },
  { label: 'Slate', value: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  { label: 'Green', value: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  { label: 'Amber', value: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { label: 'Red', value: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { label: 'Blue', value: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
];

const createInitialMatrix = (roles: Role[]) => {
  const matrix: Record<string, boolean> = {};

  roles.forEach((role) => {
    PERMISSIONS.forEach((perm) => {
      const key = `${perm.key}_${role.id}`;
      matrix[key] = false;
    });
  });

  return {
    ...matrix,
    'document.view_admin': true, 'document.view_editor': true, 'document.view_viewer': true, 'document.view_clerk': true,
    'document.add_admin': true, 'document.add_editor': true, 'document.add_viewer': false, 'document.add_clerk': true,
    'document.edit_admin': true, 'document.edit_editor': true, 'document.edit_viewer': false, 'document.edit_clerk': false,
    'document.delete_admin': true, 'document.delete_editor': false, 'document.delete_viewer': false, 'document.delete_clerk': false,
    'document.upload_admin': true, 'document.upload_editor': true, 'document.upload_viewer': false, 'document.upload_clerk': true,
  };
};

const cloneMatrix = (matrix: Record<string, boolean>) => ({ ...matrix });

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [matrix, setMatrix] = useState<Record<string, boolean>>(createInitialMatrix(INITIAL_ROLES));
  const [isEditing, setIsEditing] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleMode, setRoleMode] = useState<'add' | 'edit'>('add');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>({
    id: '',
    name: '',
    desc: '',
    colorClass: COLOR_OPTIONS[0].value,
  });

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const initialMatrix: Record<string, boolean> = useMemo(
    () => createInitialMatrix(INITIAL_ROLES),
    []
  );

  const isDirty = Object.keys(matrix).some((key) => matrix[key] !== initialMatrix[key]);

  const handleTogglePermission = (permissionKey: string, roleId: string) => {
    const key = `${permissionKey}_${roleId}`;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveMatrix = () => {
    console.log('Đang lưu ma trận phân quyền:', matrix);
    alert('Lưu ma trận quyền thành công!');
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setMatrix(cloneMatrix(initialMatrix));
    }
    setIsEditing((prev) => !prev);
  };

  const openAddRoleModal = () => {
    setRoleMode('add');
    setSelectedRole(null);
    setRoleForm({
      id: '',
      name: '',
      desc: '',
      colorClass: COLOR_OPTIONS[0].value,
    });
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (role: Role) => {
    setRoleMode('edit');
    setSelectedRole(role);
    setRoleForm({
      id: role.id,
      name: role.name,
      desc: role.desc,
      colorClass: role.colorClass,
    });
    setRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    const trimmedName = roleForm.name.trim();
    const trimmedDesc = roleForm.desc.trim();
    const trimmedId = roleForm.id.trim();

    if (!trimmedName) {
      alert('Vui lòng nhập đầy đủ Role ID và tên role.');
      return;
    }

    if (roleMode === 'add') {
      if (roles.some((r) => r.id === trimmedId)) {
        alert('Role ID đã tồn tại.');
        return;
      }

      const newRole: Role = {
        id: trimmedId,
        name: trimmedName,
        desc: trimmedDesc,
        colorClass: roleForm.colorClass,
      };

      setRoles((prev) => [...prev, newRole]);

      setMatrix((prev) => {
        const next = { ...prev };
        PERMISSIONS.forEach((perm) => {
          next[`${perm.key}_${newRole.id}`] = false;
        });
        return next;
      });

      alert('Thêm role thành công!');
    } else if (roleMode === 'edit' && selectedRole) {
      if (trimmedId !== selectedRole.id && roles.some((r) => r.id === trimmedId)) {
        alert('Role ID mới đã tồn tại.');
        return;
      }

      const oldId = selectedRole.id;
      const nextRole: Role = {
        id: trimmedId,
        name: trimmedName,
        desc: trimmedDesc,
        colorClass: roleForm.colorClass,
      };

      setRoles((prev) => prev.map((r) => (r.id === oldId ? nextRole : r)));

      setMatrix((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          if (key.endsWith(`_${oldId}`)) return;
          next[key] = prev[key];
        });

        PERMISSIONS.forEach((perm) => {
          const oldKey = `${perm.key}_${oldId}`;
          const newKey = `${perm.key}_${trimmedId}`;
          next[newKey] = prev[oldKey] ?? false;
        });

        return next;
      });

      alert('Cập nhật role thành công!');
    }

    setRoleModalOpen(false);
    setSelectedRole(null);
  };

  const openDeleteRoleModal = (role: Role) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  const handleDeleteRole = () => {
    if (!roleToDelete) return;

    setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));

    setMatrix((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        if (!key.endsWith(`_${roleToDelete.id}`)) {
          next[key] = prev[key];
        }
      });
      return next;
    });

    setDeleteModalOpen(false);
    setRoleToDelete(null);
    alert('Xóa role thành công!');
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-10 py-8 gap-8 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-montserrat text-slate-900 dark:text-slate-100 text-3xl font-black leading-tight tracking-tight">
            Quản lý Nhóm quyền
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
            Thiết lập vai trò, phân quyền và ma trận bảo mật hệ thống
          </p>
        </div>

        <button
          onClick={openAddRoleModal}
          className="flex items-center justify-center gap-2 rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 outline-none"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Thêm Role</span>
        </button>
      </div>

      {/* Role List Table */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm font-semibold uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm font-semibold uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm font-semibold uppercase tracking-wider text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.colorClass}`}>
                      {role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                    {role.desc}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditRoleModal(role)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/5 outline-none"
                        title="Sửa role"
                      >
                        <span className="material-symbols-outlined text-xl">edit_square</span>
                      </button>
                      <button
                        onClick={() => openDeleteRoleModal(role)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 outline-none"
                        title="Xóa role"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Permission Matrix Header */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <span className="material-symbols-outlined">rule</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">
            Ma trận quyền hạn
          </h2>
        </div>

        <button
          onClick={handleToggleEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-all outline-none"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          <span>{isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa Ma trận'}</span>
        </button>
      </div>

      {/* Permission Matrix Table */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider w-1/3">
                  Key Quyền hạn
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-4 py-4 text-center text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERMISSIONS.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {perm.key}
                      </span>
                      <span className="text-xs text-slate-500">{perm.label}</span>
                    </div>
                  </td>

                  {roles.map((role) => {
                    const key = `${perm.key}_${role.id}`;
                    const isChanged = matrix[key] !== initialMatrix[key];

                    return (
                      <td key={key} className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={matrix[key] || false}
                          onChange={() => handleTogglePermission(perm.key, role.id)}
                          disabled={!isEditing}
                          className={`h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all
                            ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isChanged ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                          `}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pb-10">
        <button
          onClick={() => setMatrix(cloneMatrix(initialMatrix))}
          disabled={!isEditing || !isDirty}
          className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Khôi phục gốc
        </button>
        <button
          onClick={handleSaveMatrix}
          disabled={!isEditing || !isDirty}
          className={`px-8 py-2.5 rounded-lg font-bold transition-all shadow-md outline-none ${
            isEditing && isDirty
              ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          Lưu Thay đổi
        </button>
      </div>

      {/* Add/Edit Role Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRoleModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {roleMode === 'add' ? 'Thêm Role' : 'Sửa Role'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {roleMode === 'add'
                    ? 'Tạo role mới và thêm vào hệ thống.'
                    : 'Cập nhật thông tin role hiện tại.'}
                </p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Role ID
                </label>
                <input
                  value={roleForm.id}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="vd: manager"
                  disabled={roleMode === 'edit'}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tên role
                </label>
                <input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="vd: Manager"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={roleForm.desc}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder="Mô tả ngắn cho role..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Màu hiển thị
                </label>
                <select
                  value={roleForm.colorClass}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, colorClass: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary"
                >
                  {COLOR_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleForm.colorClass}`}>
                    {roleForm.name || 'Preview Role'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                {roleMode === 'add' ? 'Thêm role' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModalOpen && roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 text-red-600">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Xóa role?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Bạn có chắc muốn xóa role <strong>{roleToDelete.name}</strong>? Hành động này sẽ xóa luôn các quyền liên quan của role này trong ma trận.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteRole}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20"
              >
                Xóa role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;