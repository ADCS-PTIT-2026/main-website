import { useMemo } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  is_active?: boolean;
  account_status?: 'active' | 'pending_approval' | 'pending_role';
  is_admin?: boolean;
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
  const isPending = Boolean(user?.account_status && user.account_status !== 'active');

  const permissions = useMemo(() => {
    return !isPending && Array.isArray(user?.permissions) ? user!.permissions : [];
  }, [user, isPending]);

  const role = useMemo(() => {
    return (user?.role || '').toLowerCase();
  }, [user]);

  const isAdmin = !isPending && user?.is_admin === true;
  const canonical = (code: string): string => {
    const aliases: Record<string, string> = {
      'doc:view': 'file.read', 'doc:read': 'file.read', 'doc:download': 'file.read',
      'doc:edit': 'file.update', 'doc:update': 'file.update', 'file.edit': 'file.update',
      'doc:create': 'file.create', 'doc:upload': 'file.create',
      'doc:approve': 'file.approve', 'doc:delete': 'file.delete',
    };
    return aliases[code] || code;
  };

  const hasPermission = (permissionCode: string): boolean => {
    return isAdmin || permissions.some(code => canonical(code) === canonical(permissionCode));
  };

  const hasAnyPermission = (codes: string[]): boolean => codes.some(hasPermission);
  const hasAllPermissions = (codes: string[]): boolean => codes.every(hasPermission);

  const hasRole = (targetRole: string): boolean => {
    return role === targetRole.toLowerCase();
  };

  return {
    user,
    role: user?.role,
    permissions,
    isAdmin,
    isPending,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };
};

export default usePermission;
