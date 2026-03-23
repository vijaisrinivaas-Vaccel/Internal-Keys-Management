// hooks/usePermissions.ts
import { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../lib/auth";
import { PERMISSIONS } from "../../lib/permissions";

interface PermissionCheck {
  hasPermission: (permission: string, envId?: string, moduleId?: string, configId?: string) => boolean;
  canAccessEnvironment: (envId: string, permission?: string) => boolean;
  canAccessModule: (moduleId: string, permission?: string) => boolean;
  canAccessConfig: (configId: string, permission?: string) => boolean;
  loading: boolean;
  userRole?: string;
  isAuthenticated: boolean;
}

export const usePermissions = (
  projectId: string,
  environmentId?: string,
  moduleId?: string,
  configId?: string
): PermissionCheck => {
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          console.error("User not found in localStorage");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const user = JSON.parse(storedUser);
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
          }
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
    
    // Superadmin has all permissions
    if (userRole === "superadmin") return true;

    // No permissions found
    if (!userPermissions || !userPermissions.environments) {
      return false;
    }

    // Convert all IDs to strings for comparison
    const envIdStr = envId?.toString();
    const modIdStr = modId?.toString();
    const confIdStr = confId?.toString();

    // Check config level first (most specific)
    if (confIdStr && modIdStr && envIdStr) {
      const env = userPermissions.environments.find(
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
      const env = userPermissions.environments.find(
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
      const env = userPermissions.environments.find(
        (e: any) => e.environmentId && e.environmentId.toString() === envIdStr
      );
      return env?.permissions?.includes(permission) || false;
    }

    // Check project level (CREATE_ENVIRONMENT, READ_ENVIRONMENT)
    if (permission === PERMISSIONS.CREATE_ENVIRONMENT ||
        permission === PERMISSIONS.READ_ENVIRONMENT) {
      return userPermissions.environments.some((env: any) =>
        env.permissions?.includes(permission)
      );
    }

    return false;
  }, [userPermissions, userRole, isAuthenticated, loading]);

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