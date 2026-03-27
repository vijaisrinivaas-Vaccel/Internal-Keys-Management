// hooks/usePermissions.ts
import { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../lib/auth";
import { PERMISSIONS, hasPermission as hasGlobalPermission } from "../../lib/permissions";
import type { User } from "../../userModel/User";

interface PermissionCheck {
  hasPermission: (permission: string, envId?: string, moduleId?: string, configId?: string) => boolean;
  canAccessEnvironment: (envId: string, permission?: string) => boolean;
  canAccessModule: (moduleId: string, permission?: string) => boolean;
  canAccessConfig: (configId: string, permission?: string) => boolean;
  loading: boolean;
  userRole?: string;
  isAuthenticated: boolean;
}

const PROJECT_SCOPED_PERMISSIONS = new Set<string>([
  PERMISSIONS.READ_PROJECT,
  PERMISSIONS.ASSIGN_USER,
  PERMISSIONS.ASSIGN_ADMIN,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.CREATE_ENVIRONMENT,
  PERMISSIONS.READ_ENVIRONMENT,
  PERMISSIONS.UPDATE_ENVIRONMENT,
  PERMISSIONS.DELETE_ENVIRONMENT,
  PERMISSIONS.CREATE_MODULE,
  PERMISSIONS.READ_MODULE,
  PERMISSIONS.UPDATE_MODULE,
  PERMISSIONS.DELETE_MODULE,
  PERMISSIONS.CREATE_CONFIG,
  PERMISSIONS.READ_CONFIG,
  PERMISSIONS.UPDATE_CONFIG,
  PERMISSIONS.DELETE_CONFIG
]);

const PROJECT_MEMBERSHIP_PERMISSIONS = new Set<string>([
  PERMISSIONS.READ_PROJECT,
  PERMISSIONS.ASSIGN_USER,
  PERMISSIONS.ASSIGN_ADMIN,
  PERMISSIONS.MANAGE_USERS
]);

const getStoredUser = (): User | null => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
};

const hasPermissionInProjectTree = (permission: string, environments: any[] = []) => {
  return environments.some((env) => {
    if (env.permissions?.includes(permission)) return true;
    if (!Array.isArray(env.modules)) return false;

    return env.modules.some((mod: any) => {
      if (mod.permissions?.includes(permission)) return true;
      if (!Array.isArray(mod.configEntries)) return false;
      return mod.configEntries.some((conf: any) => conf.permissions?.includes(permission));
    });
  });
};

export const usePermissions = (
  projectId: string,
  environmentId?: string,
  moduleId?: string,
  _configId?: string
): PermissionCheck => {
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const user = getStoredUser();

        if (!user) {
          console.error("User not found in localStorage");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setUserRole(user.role);
        setIsAuthenticated(true);

        // Superadmin has all permissions
        if (user.role === "superadmin") {
          setUserPermissions({ role: "superadmin" });
          setLoading(false);
          return;
        }

        // For non-superadmin, fetch project-specific permissions
        if (projectId && user.id) {
          const res = await authFetch(
            `http://localhost:8000/api/projectPermission/projects/${projectId}/users/${user.id}`
          );

          if (res.ok) {
            const data = await res.json();
            setUserPermissions(data);
          } else if (res.status === 404) {
            setUserPermissions({ environments: [] });
          } else {
            setUserPermissions({ environments: [] });
          }
        } else {
          setUserPermissions({ environments: [] });
        }
      } catch (err) {
        console.error("Error fetching permissions:", err);
        setUserPermissions({ environments: [] });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const hasPermission = useCallback((
    permission: string,
    envId?: string,
    modId?: string,
    confId?: string
  ): boolean => {
    if (loading) return false;
    if (!isAuthenticated) return false;

    const currentUser = getStoredUser();
    if (!currentUser) return false;

    // 1) Role/global permission must pass first
    if (!hasGlobalPermission(currentUser, permission)) return false;

    // 2) Superadmin bypasses project-level scoping
    if (userRole === "superadmin") return true;

    // 3) If this is not project-scoped, role check is enough
    if (!projectId || !PROJECT_SCOPED_PERMISSIONS.has(permission)) return true;

    const environments = userPermissions?.environments || [];
    if (environments.length === 0) return false;

    // Convert all IDs to strings for comparison
    const envIdStr = envId?.toString();
    const modIdStr = modId?.toString();
    const confIdStr = confId?.toString();

    // Check config level first (most specific)
    if (confIdStr && modIdStr && envIdStr) {
      const env = environments.find(
        (e: any) => e.environmentId && e.environmentId.toString() === envIdStr
      );
      if (!env) return false;

      const mod = env.modules?.find(
        (m: any) => m.moduleId && m.moduleId.toString() === modIdStr
      );
      if (!mod) return false;

      // If accessAll is true, derive config permissions from the module permissions
      if (mod.accessAll) {
        if (permission === PERMISSIONS.READ_CONFIG && mod.permissions?.includes(PERMISSIONS.READ_MODULE)) return true;
        if (permission === PERMISSIONS.UPDATE_CONFIG && mod.permissions?.includes(PERMISSIONS.UPDATE_MODULE)) return true;
        if (permission === PERMISSIONS.DELETE_CONFIG && mod.permissions?.includes(PERMISSIONS.DELETE_MODULE)) return true;
      }

      const config = mod.configEntries?.find(
        (c: any) => c.configId && c.configId.toString() === confIdStr
      );
      
      return config?.permissions?.includes(permission) || false;
    }

    // Check module level
    if (modIdStr && envIdStr) {
      const env = environments.find(
        (e: any) => e.environmentId && e.environmentId.toString() === envIdStr
      );
      if (!env) return false;

      const mod = env.modules?.find(
        (m: any) => m.moduleId && m.moduleId.toString() === modIdStr
      );
      if (!mod) return false;

      return mod.permissions?.includes(permission) || false;
    }

    // Check environment level
    if (envIdStr) {
      const env = environments.find(
        (e: any) => e.environmentId && e.environmentId.toString() === envIdStr
      );
      return env?.permissions?.includes(permission) || false;
    }

    // Project membership check for high-level project actions
    if (PROJECT_MEMBERSHIP_PERMISSIONS.has(permission)) {
      return environments.length > 0;
    }

    // Generic fallback in project permission tree
    return hasPermissionInProjectTree(permission, environments);
  }, [userPermissions, userRole, isAuthenticated, loading, projectId]);

  const canAccessEnvironment = useCallback((envId: string, permission?: string): boolean => {
    if (!envId) return false;
    
    if (permission) {
      return hasPermission(permission, envId);
    }
    
    return userPermissions?.environments?.some(
      (env: any) => env.environmentId?.toString() === envId.toString()
    ) || false;
  }, [hasPermission, userPermissions]);

  const canAccessModule = useCallback((modId: string, permission?: string): boolean => {
    if (!environmentId || !modId) return false;
    
    if (permission) {
      return hasPermission(permission, environmentId, modId);
    }
    
    const env = userPermissions?.environments?.find(
      (e: any) => e.environmentId?.toString() === environmentId.toString()
    );
    return env?.modules?.some(
      (m: any) => m.moduleId?.toString() === modId.toString()
    ) || false;
  }, [hasPermission, environmentId, userPermissions]);

  const canAccessConfig = useCallback((confId: string, permission?: string): boolean => {
    if (!environmentId || !moduleId || !confId) return false;
    
    if (permission) {
      return hasPermission(permission, environmentId, moduleId, confId);
    }
    
    const env = userPermissions?.environments?.find(
      (e: any) => e.environmentId?.toString() === environmentId.toString()
    );
    const mod = env?.modules?.find(
      (m: any) => m.moduleId?.toString() === moduleId.toString()
    );
    return mod?.configEntries?.some(
      (c: any) => c.configId?.toString() === confId.toString()
    ) || false;
  }, [hasPermission, environmentId, moduleId, userPermissions]);

  return {
    hasPermission,
    canAccessEnvironment,
    canAccessModule,
    canAccessConfig,
    loading,
    userRole,
    isAuthenticated
  };
};
