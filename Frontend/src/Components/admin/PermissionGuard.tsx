// Components/admin/PermissionGuard.tsx
import type { ReactNode } from "react";
import { hasPermission } from "../../lib/permissions";
import type { Permission } from "../../userModel/User";

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  // Keep the old way for backward compatibility
  allowedRoles?: string[];
}

export default function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  allowedRoles
}: PermissionGuardProps) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Handle case when user is not logged in
  if (!user) {
    return <>{fallback}</>;
  }

  // Backward compatibility: if allowedRoles is provided, use the old system
  if (allowedRoles) {
    const hasAccess = allowedRoles.includes(user.role);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // If no permission required, always show
  if (!requiredPermission && requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (requiredPermission) {
    hasAccess = hasPermission(user, requiredPermission);
  } else if (requiredPermissions.length > 0) {
    hasAccess = requireAll
      ? requiredPermissions.every(p => hasPermission(user, p))
      : requiredPermissions.some(p => hasPermission(user, p));
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}