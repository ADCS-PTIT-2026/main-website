import { useMemo } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  permissions?: string[];
  is_telegram_connected?: boolean;
  telegram_chat_id?: string | null;
  department_id?: string | null;
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing user from storage:', e);
    return null;
  }
}

export const usePermission = () => {
  const user = useMemo(() => getCurrentUser(), []);

  const permissions = useMemo(() => {
    return Array.isArray(user?.permissions) ? user!.permissions : [];
  }, [user]);

  const role = useMemo(() => {
    return (user?.role || '').toLowerCase();
  }, [user]);

  const isAdmin = useMemo(() => {
    return (
      role === 'admin' ||
      role === 'administrator' ||
      permissions.includes('admin:all') ||
      permissions.includes('*')
    );
  }, [role, permissions]);

  const hasPermission = (permissionCode: string): boolean => {
    if (isAdmin) return true;
    if (permissions.includes(permissionCode)) return true;

    // Mapping tương thích hai chiều giữa format doc:action và file.action
    const altCode = permissionCode.startsWith('doc:')
      ? permissionCode.replace('doc:', 'file.')
      : permissionCode.startsWith('file.')
      ? permissionCode.replace('file.', 'doc:')
      : null;

    if (altCode && permissions.includes(altCode)) return true;
    return false;
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (isAdmin) return true;
    return codes.some((code) => permissions.includes(code));
  };

  const hasAllPermissions = (codes: string[]): boolean => {
    if (isAdmin) return true;
    return codes.every((code) => permissions.includes(code));
  };

  const hasRole = (targetRole: string): boolean => {
    return role === targetRole.toLowerCase();
  };

  return {
    user,
    role: user?.role,
    permissions,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };
};

export default usePermission;
