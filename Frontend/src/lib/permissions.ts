// lib/permissions.ts
import { PERMISSIONS, type User } from "../userModel/User";

/* ================= PERMISSION CHECK ================= */

const PERMISSION_ALIASES: Record<string, string[]> = {
  [PERMISSIONS.VIEW_PROJECTS]: [PERMISSIONS.VIEW_ALLPROJECT],
  [PERMISSIONS.VIEW_ALLPROJECT]: [PERMISSIONS.VIEW_PROJECTS],
};

const expandPermissionAliases = (permission: string): string[] => {
  const aliases = PERMISSION_ALIASES[permission] || [];
  return [permission, ...aliases];
};

const getRolePermissions = (user: User | null): string[] => {
  if (!user || !user.roleId || typeof user.roleId === "string") {
    return [];
  }

  const roleDoc = user.roleId as any;
  return Array.isArray(roleDoc.permissions) ? roleDoc.permissions : [];
};

const getAllUserPermissions = (user: User | null): string[] => {
  if (!user) return [];
  const rolePermissions = getRolePermissions(user);
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  const customPermissions = Array.isArray(user.customPermissions) ? user.customPermissions : [];
  return [...new Set([...rolePermissions, ...userPermissions, ...customPermissions])];
};

export const hasPermission = (
  user: User | null,
  requiredPermission: string
): boolean => {
  if (!user) return false;

  const allPermissions = getAllUserPermissions(user);

  // Superadmin override or direct '*' permission
  if (user.role === "superadmin" || allPermissions.includes("*")) {
    return true;
  }

  return expandPermissionAliases(requiredPermission).some((permission) =>
    allPermissions.includes(permission)
  );
};

/* ================= MULTIPLE PERMISSIONS ================= */

export const hasAnyPermission = (
  user: User | null,
  requiredPermissions: string[]
): boolean => {
  if (!user) return false;
  return requiredPermissions.some((perm) => hasPermission(user, perm));
};

export const hasAllPermissions = (
  user: User | null,
  requiredPermissions: string[]
): boolean => {
  if (!user) return false;
  return requiredPermissions.every((perm) => hasPermission(user, perm));
};

/* ================= HELPERS ================= */

// Used for superadmin-only actions
export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === "superadmin" || getAllUserPermissions(user).includes("*") || false;
};

const ENVIRONMENT_ACCESS_MAP: Record<string, string> = {
  development: PERMISSIONS.ACCESS_DEVELOPMENT,
  staging: PERMISSIONS.ACCESS_STAGING,
  uat: PERMISSIONS.ACCESS_UAT,
  production: PERMISSIONS.ACCESS_PRODUCTION,
};

export const getEnvironmentAccessPermission = (environmentName?: string): string | null => {
  if (!environmentName) return null;
  const normalized = environmentName.trim().toLowerCase();
  return ENVIRONMENT_ACCESS_MAP[normalized] || null;
};

export const hasEnvironmentAccessByName = (user: User | null, environmentName?: string): boolean => {
  const environmentPermission = getEnvironmentAccessPermission(environmentName);
  if (!environmentPermission) return true;
  return hasPermission(user, environmentPermission);
};

// Legacy support for RoleGuard if it uses these
export const permissions = {
  forSuperadmin: ["superadmin"],
  forAdmins: ["admin", "superadmin"],
  forUsers: ["user", "admin", "superadmin"],
};

// Re-export PERMISSIONS for convenience
export { PERMISSIONS };
