import { PERMISSIONS, type Permission } from "../userModel/User";

/* ================= ROLE TYPE ================= */

export type Role = "superadmin" | "admin" | "user";

/* ================= ROLE PERMISSIONS ================= */

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: Object.values(PERMISSIONS),

  admin: [
    // ===== PROJECT =====
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,

    // ===== ENVIRONMENT =====
    PERMISSIONS.CREATE_ENVIRONMENT,
    PERMISSIONS.READ_ENVIRONMENT,
    PERMISSIONS.UPDATE_ENVIRONMENT,

    // ===== MODULE =====
    PERMISSIONS.CREATE_MODULE,
    PERMISSIONS.READ_MODULE,
    PERMISSIONS.UPDATE_MODULE,

    // ===== CONFIG =====
    PERMISSIONS.CREATE_CONFIG,
    PERMISSIONS.READ_CONFIG,
    PERMISSIONS.UPDATE_CONFIG,

    // ===== USER MANAGEMENT =====
    PERMISSIONS.ASSIGN_USER,

    // ===== REPORTS =====
    PERMISSIONS.VIEW_REPORTS,
  ],

  user: [
    // ===== READ ONLY =====
    PERMISSIONS.READ_PROJECT,
    PERMISSIONS.READ_ENVIRONMENT,
    PERMISSIONS.READ_MODULE,
    PERMISSIONS.READ_CONFIG,
  ],
};

/* ================= PERMISSION CHECK ================= */

export const hasPermission = (
  user: { role: Role; permissions?: Permission[] },
  requiredPermission: Permission
): boolean => {

  if (!user) return false;

  // Superadmin always has access
  if (user.role === "superadmin") return true;

  // Custom permissions override
  if (user.permissions?.includes(requiredPermission)) return true;

  // Role permissions
  return ROLE_PERMISSIONS[user.role]?.includes(requiredPermission) ?? false;
};

/* ================= MULTIPLE PERMISSIONS ================= */

export const hasAnyPermission = (
  user: { role: Role; permissions?: Permission[] },
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some((perm) =>
    hasPermission(user, perm)
  );
};

export const hasAllPermissions = (
  user: { role: Role; permissions?: Permission[] },
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every((perm) =>
    hasPermission(user, perm)
  );
};

/* ================= HELPERS ================= */

// Used for superadmin-only actions like delete
export const canDelete = (user: { role: Role }) => {
  return user.role === "superadmin";
};

/* ================= LEGACY ROLE SYSTEM ================= */

export const permissions = {
  forSuperadmin: ["superadmin"] as Role[],
  forAdmins: ["admin", "superadmin"] as Role[],
  forUsers: ["user", "admin", "superadmin"] as Role[],
};