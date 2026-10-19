import axiosClient from "./axiosClient";
const ROLE_API = "/role-permissions";

export type Role = {
  role_id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
};

export type Permission = {
  permission_id: string;
  code: string;
  description?: string | null;
};

export type RoleCreateUpdatePayload = {
  name: string;
  description?: string | null;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  return axiosClient.request<T, T>({
    url,
    method: init?.method || 'GET',
    data: init?.body ? JSON.parse(String(init.body)) : undefined,
  });
}

export const rolePermissionApi = {
  listRoles: () => request<Role[]>(`${ROLE_API}/roles`),
  createRole: (payload: RoleCreateUpdatePayload) =>
    request<Role>(`${ROLE_API}/roles`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRole: (roleId: string, payload: RoleCreateUpdatePayload) =>
    request<Role>(`${ROLE_API}/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteRole: (roleId: string) =>
    request<{ message: string }>(`${ROLE_API}/roles/${roleId}`, {
      method: "DELETE",
    }),

  listPermissions: () => request<Permission[]>(`${ROLE_API}/permissions`),

  getMatrix: () => request<Record<string, boolean>>(`${ROLE_API}/roles/permissions-matrix`),
  updateMatrix: (payload: Record<string, boolean>) =>
    request<{ message: string }>(`${ROLE_API}/roles/permissions-matrix`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};