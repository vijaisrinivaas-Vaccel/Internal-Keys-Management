import { hasPermission } from "../lib/permissions";

interface RoleGuardProps {
  allowedRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  children
}: RoleGuardProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // If specific permission is required, check it
  if (requiredPermission) {
    if (!hasPermission(user, requiredPermission)) {
      return null;
    }
    return <>{children}</>;
  }

  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? requiredPermissions.every((permission) => hasPermission(user, permission))
      : requiredPermissions.some((permission) => hasPermission(user, permission));

    if (!hasAccess) {
      return null;
    }
    return <>{children}</>;
  }

  // Fallback to role-based check if provided
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
