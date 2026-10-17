import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  rolePermissionApi,
  type Permission,
} from "../../../api/rolePermission";

type UiRole = {
  role_id: string;
  name: string;
  description: string;
  colorClass: string;
};

type RoleFormState = {
  name: string;
  description: string;
};

const COLOR_OPTIONS = [
  { label: "Primary", value: "bg-primary/10 text-primary" },
  { label: "Slate", value: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" },
  { label: "Green", value: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  { label: "Amber", value: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  { label: "Red", value: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
  { label: "Blue", value: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
];

const colorByIndex = (index: number) => COLOR_OPTIONS[index % COLOR_OPTIONS.length].value;

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<UiRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const [initialMatrix, setInitialMatrix] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [error, setError] = useState("");

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleMode, setRoleMode] = useState<"add" | "edit">("add");
  const [selectedRole, setSelectedRole] = useState<UiRole | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>({
    name: "",
    description: "",
  });
  const [roleToDelete, setRoleToDelete] = useState<UiRole | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [roleData, permData, matrixData] = await Promise.all([
        rolePermissionApi.listRoles(),
        rolePermissionApi.listPermissions(),
        rolePermissionApi.getMatrix(),
      ]);

      const mappedRoles: UiRole[] = roleData.map((r, idx) => ({
        role_id: r.role_id,
        name: r.name,
        description: r.description ?? "",
        colorClass: colorByIndex(idx),
      }));

      setRoles(mappedRoles);
      setPermissions(permData);
      setMatrix(matrixData);
      setInitialMatrix(matrixData);
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDirty = useMemo(() => {
    const keys = new Set([...Object.keys(matrix), ...Object.keys(initialMatrix)]);
    for (const key of keys) {
      if ((matrix[key] ?? false) !== (initialMatrix[key] ?? false)) return true;
    }
    return false;
  }, [matrix, initialMatrix]);

  const handleTogglePermission = (permissionCode: string, roleId: string) => {
    const key = `${permissionCode}_${roleId}`;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setMatrix(initialMatrix);
    }
    setIsEditing((prev) => !prev);
  };

  const handleSaveMatrix = async () => {
    setSavingMatrix(true);
    setError("");
    try {
      await rolePermissionApi.updateMatrix(matrix);
      setInitialMatrix(matrix);
      setIsEditing(false);
      toast.success("Lưu ma trận quyền thành công!");
    } catch (e: any) {
      setError(e?.message || "Không thể lưu ma trận quyền");
      toast.error(e?.message || "Không thể lưu ma trận quyền");
    } finally {
      setSavingMatrix(false);
    }
  };

  const openAddRoleModal = () => {
    setRoleMode("add");
    setSelectedRole(null);
    setRoleForm({ name: "", description: "" });
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (role: UiRole) => {
    setRoleMode("edit");
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
    });
    setRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    const name = roleForm.name.trim();
    const description = roleForm.description.trim();

    if (!name) {
      toast.error("Vui lòng nhập tên role.");
      return;
    }

    try {
      if (roleMode === "add") {
        const created = await rolePermissionApi.createRole({ name, description });
        setRoles((prev) => [
          ...prev,
          {
            role_id: created.role_id,
            name: created.name,
            description: created.description ?? "",
            colorClass: colorByIndex(prev.length),
          },
        ]);
        toast.success("Đã tạo nhóm quyền mới!");
      } else if (roleMode === "edit" && selectedRole) {
        const updated = await rolePermissionApi.updateRole(selectedRole.role_id, { name, description });
        setRoles((prev) =>
          prev.map((r) =>
            r.role_id === selectedRole.role_id
              ? { ...r, name: updated.name, description: updated.description ?? "", colorClass: r.colorClass }
              : r
          )
        );
        toast.success("Đã cập nhật nhóm quyền!");
      }

      setRoleModalOpen(false);
      setSelectedRole(null);
    } catch (e: any) {
      toast.error(e?.message || "Không thể lưu role");
    }
  };

  const openDeleteRoleModal = (role: UiRole) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await rolePermissionApi.deleteRole(roleToDelete.role_id);

      setRoles((prev) => prev.filter((r) => r.role_id !== roleToDelete.role_id));

      setMatrix((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          if (!key.endsWith(`_${roleToDelete.role_id}`)) next[key] = prev[key];
        });
        return next;
      });

      setInitialMatrix((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          if (!key.endsWith(`_${roleToDelete.role_id}`)) next[key] = prev[key];
        });
        return next;
      });

      setDeleteModalOpen(false);
      setRoleToDelete(null);
      toast.success("Đã xóa nhóm quyền thành công!");
    } catch (e: any) {
      toast.error(e?.message || "Không thể xóa role");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Đang tải dữ liệu quyền hạn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 font-display animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-xl sm:text-2xl font-black leading-tight tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">admin_panel_settings</span>
            Quản lý Nhóm quyền
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Thiết lập vai trò, phân quyền và ma trận bảo mật hệ thống ADCS.
          </p>
        </div>

        <button
          onClick={openAddRoleModal}
          className="flex items-center justify-center gap-2 rounded-xl h-10 px-5 bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 outline-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Thêm Role</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map((role) => (
                <tr key={role.role_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${role.colorClass}`}>
                      {role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                    {role.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEditRoleModal(role)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/5 outline-none cursor-pointer"
                        title="Sửa role"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                      </button>
                      <button
                        onClick={() => openDeleteRoleModal(role)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 outline-none cursor-pointer"
                        title="Xóa role"
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
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">rule</span>
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold">
              Ma trận quyền hạn
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bật chế độ chỉnh sửa để cấp hoặc thu hồi quyền hạn cho từng nhóm vai trò.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleEdit}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all outline-none cursor-pointer ${
            isEditing
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{isEditing ? "close" : "edit"}</span>
          <span>{isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa Ma trận"}</span>
        </button>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider min-w-[240px] border-r border-slate-200/60 dark:border-slate-700/60">
                  Key Quyền hạn
                </th>
                {roles.map((role) => (
                  <th
                    key={role.role_id}
                    className="px-4 py-4 text-center text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissions.map((perm) => (
                <tr key={perm.permission_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {perm.code}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {perm.description}
                      </span>
                    </div>
                  </td>

                  {roles.map((role) => {
                    const key = `${perm.code}_${role.role_id}`;
                    const isChanged = matrix[key] !== initialMatrix[key];

                    return (
                      <td key={key} className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={matrix[key] || false}
                          onChange={() => handleTogglePermission(perm.code, role.role_id)}
                          disabled={!isEditing}
                          className={`h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary cursor-pointer transition-all accent-primary
                            ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}
                            ${isChanged ? "ring-2 ring-amber-400 bg-amber-50" : ""}
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

      <div className="flex justify-end gap-3 pb-10">
        <button
          onClick={() => setMatrix(initialMatrix)}
          disabled={!isEditing || !isDirty}
          className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Khôi phục gốc
        </button>
        <button
          onClick={handleSaveMatrix}
          disabled={!isEditing || !isDirty || savingMatrix}
          className={`px-8 py-2.5 rounded-lg font-bold transition-all shadow-md outline-none ${
            isEditing && isDirty
              ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          {savingMatrix ? "Đang lưu..." : "Lưu Thay đổi"}
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
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn cho role..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary resize-none"
                />
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