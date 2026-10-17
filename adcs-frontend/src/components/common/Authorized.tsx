import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface AuthorizedProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component kiểm tra quyền truy cập của người dùng hiện tại trước khi render children.
 * Sử dụng cho việc ẩn/hiện các nút bấm nhạy cảm (Xóa, Phê duyệt, Sửa, v.v.).
 */
export const Authorized: React.FC<AuthorizedProps> = ({
  permission,
  permissions,
  requireAll = false,
  role,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = usePermission();

  // Kiểm tra vai trò nếu có yêu cầu
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Kiểm tra đơn quyền
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Kiểm tra danh sách quyền
  if (permissions && permissions.length > 0) {
    const isAllowed = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!isAllowed) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default Authorized;
