// profilePage/ProfilePermissionsTab.tsx
import { useState } from "react";
import { 
  FolderTree, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Shield,
  Database,
  Settings,
  Key,
  Info
} from "lucide-react";
import { type Permission } from "../../userModel/User";
import type { ProfileData } from "./ProfilePage";

interface EnvironmentPermission {
  environmentId: string;
  environmentName?: string;
  permissions: Permission[];
  modules?: ModulePermission[];
}

interface ModulePermission {
  moduleId: string;
  moduleName?: string;
  permissions: Permission[];
  configEntries?: ConfigPermission[];
}

interface ConfigPermission {
  configId: string;
  configKey?: string;
  permissions: Permission[];
}

interface DetailedProjectPermission {
  projectId: string;
  projectName: string;
  environments: EnvironmentPermission[];
}

interface ProfilePermissionsTabProps {
  profile: ProfileData;
  detailedPermissions?: DetailedProjectPermission[];
}

export default function ProfilePermissionsTab({ 
  profile, 
  detailedPermissions = [] 
}: ProfilePermissionsTabProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [expandedEnvironments, setExpandedEnvironments] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleEnvironmentExpand = (envId: string) => {
    setExpandedEnvironments(prev => ({ ...prev, [envId]: !prev[envId] }));
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const getPermissionIcon = (permission: string) => {
    if (permission.includes("READ")) return <Eye size={12} />;
    if (permission.includes("CREATE")) return <Plus size={12} />;
    if (permission.includes("UPDATE")) return <Edit size={12} />;
    if (permission.includes("DELETE")) return <Trash2 size={12} />;
    return <Shield size={12} />;
  };

  const getPermissionColor = (permission: string) => {
    if (permission.includes("READ")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (permission.includes("CREATE")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (permission.includes("UPDATE")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (permission.includes("DELETE")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const formatPermissionName = (permission: string) => {
    return permission.replace(/_/g, ' ').toLowerCase();
  };

  const getResourceIcon = (type: string) => {
    switch(type) {
      case 'project': return <FolderTree size={16} className="text-blue-600" />;
      case 'environment': return <Database size={14} className="text-emerald-600" />;
      case 'module': return <Settings size={12} className="text-purple-600" />;
      case 'config': return <Key size={10} className="text-amber-600" />;
      default: return <FileText size={12} className="text-gray-500" />;
    }
  };

  const getStats = () => {
    const totalEnvs = detailedPermissions.reduce((acc, p) => acc + p.environments.length, 0);
    const totalModules = detailedPermissions.reduce((acc, p) => 
      acc + p.environments.reduce((acc2, e) => acc2 + (e.modules?.length || 0), 0), 0
    );
    const totalConfigs = detailedPermissions.reduce((acc, p) => 
      acc + p.environments.reduce((acc2, e) => 
        acc2 + (e.modules?.reduce((acc3, m) => acc3 + (m.configEntries?.length || 0), 0) || 0), 0), 0
    );
    return { totalEnvs, totalModules, totalConfigs };
  };

  const stats = getStats();

  if (detailedPermissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Shield size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Permissions</h3>
        <p className="text-sm text-gray-500 max-w-md">
          {profile.role === "superadmin" 
            ? "As a superadmin, you have access to all projects by default."
            : "You haven't been assigned any project-specific permissions yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Projects</p>
              <p className="text-2xl font-bold text-blue-900">{detailedPermissions.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FolderTree size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-medium">Environments</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.totalEnvs}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Database size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Modules</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalModules}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Settings size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Global Permissions Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 flex items-center gap-3">
          <Shield size={20} className="text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Global Permissions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Permissions inherited from role: <span className="font-medium text-blue-600">{profile.role}</span></p>
          </div>
        </div>
        <div className="p-4">
          {profile.permissions && profile.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((perm) => (
                <span
                  key={perm}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getPermissionColor(perm)}`}
                >
                  {getPermissionIcon(perm)}
                  {perm === "*" ? "Full Root Access (*)" : formatPermissionName(perm)}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm italic py-2">
              <Info size={16} className="text-gray-400" />
              {profile.role === "superadmin" 
                ? "Superadmins have full system access by default." 
                : "No global permissions assigned to this role."}
            </div>
          )}
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-3">
        {detailedPermissions.map((project) => (
          <div key={project.projectId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Project Header */}
            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleProjectExpand(project.projectId)}
            >
              <div className="flex items-center gap-3">
                {getResourceIcon('project')}
                <div>
                  <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {project.environments.length} environment{project.environments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedProjects[project.projectId] ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedProjects[project.projectId] && (
              <div className="p-4 pt-0 border-t border-gray-100">
                {project.environments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No environments assigned</p>
                ) : (
                  <div className="space-y-3">
                    {project.environments.map((env) => (
                      <div key={env.environmentId} className="ml-4">
                        {/* Environment Header */}
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleEnvironmentExpand(env.environmentId)}
                        >
                          <div className="flex items-center gap-2">
                            {getResourceIcon('environment')}
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {env.environmentName || env.environmentId.slice(-8)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({env.modules?.length || 0} modules)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Environment Permission Badges */}
                            <div className="flex gap-1">
                              {env.permissions.slice(0, 2).map((perm) => (
                                <span
                                  key={perm}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getPermissionColor(perm)}`}
                                >
                                  {getPermissionIcon(perm)}
                                  <span className="hidden sm:inline">{formatPermissionName(perm).split(' ')[0]}</span>
                                </span>
                              ))}
                              {env.permissions.length > 2 && (
                                <span className="text-xs text-gray-500">+{env.permissions.length - 2}</span>
                              )}
                            </div>
                            {expandedEnvironments[env.environmentId] ? (
                              <ChevronDown size={14} className="text-gray-400" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Environment Details */}
                        {expandedEnvironments[env.environmentId] && (
                          <div className="mt-2 ml-8 space-y-3">
                            {/* Full Environment Permissions */}
                            {env.permissions.length > 0 && (
                              <div className="p-3 bg-white rounded-lg border border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Environment Permissions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {env.permissions.map((perm) => (
                                    <span
                                      key={perm}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPermissionColor(perm)}`}
                                    >
                                      {getPermissionIcon(perm)}
                                      {formatPermissionName(perm)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Modules */}
                            {env.modules && env.modules.length > 0 && (
                              <div className="space-y-2">
                                {env.modules.map((module) => (
                                  <div key={module.moduleId}>
                                    {/* Module Header */}
                                    <div
                                      className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                      onClick={() => toggleModuleExpand(module.moduleId)}
                                    >
                                      <div className="flex items-center gap-2">
                                        {getResourceIcon('module')}
                                        <span className="text-sm text-gray-700">
                                          {module.moduleName || module.moduleId.slice(-8)}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          ({module.configEntries?.length || 0} configs)
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/* Module Permission Badges */}
                                        <div className="flex gap-1">
                                          {module.permissions.slice(0, 2).map((perm) => (
                                            <span
                                              key={perm}
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getPermissionColor(perm)}`}
                                            >
                                              {getPermissionIcon(perm)}
                                            </span>
                                          ))}
                                        </div>
                                        {expandedModules[module.moduleId] ? (
                                          <ChevronDown size={12} className="text-gray-400" />
                                        ) : (
                                          <ChevronRight size={12} className="text-gray-400" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Module Details */}
                                    {expandedModules[module.moduleId] && (
                                      <div className="ml-8 mt-2 space-y-3">
                                        {/* Module Permissions */}
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                          <h5 className="text-xs font-medium text-gray-600 mb-2">Module Permissions</h5>
                                          <div className="flex flex-wrap gap-2">
                                            {module.permissions.map((perm) => (
                                              <span
                                                key={perm}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPermissionColor(perm)}`}
                                              >
                                                {getPermissionIcon(perm)}
                                                {formatPermissionName(perm)}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Config Entries */}
                                        {module.configEntries && module.configEntries.length > 0 && (
                                          <div className="space-y-2">
                                            <h5 className="text-xs font-medium text-gray-600">Configuration Entries</h5>
                                            <div className="grid gap-2">
                                              {module.configEntries.map((config) => (
                                                <div
                                                  key={config.configId}
                                                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    {getResourceIcon('config')}
                                                    <span className="text-sm font-mono text-gray-700">
                                                      {config.configKey || config.configId.slice(-8)}
                                                    </span>
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {config.permissions.map((perm) => (
                                                      <span
                                                        key={perm}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getPermissionColor(perm)}`}
                                                        title={formatPermissionName(perm)}
                                                      >
                                                        {getPermissionIcon(perm)}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Role Info Footer */}
      <div className={`rounded-lg p-4 ${
        profile.role === "superadmin" 
          ? "bg-purple-50 border border-purple-200" 
          : profile.role === "admin"
          ? "bg-blue-50 border border-blue-200"
          : "bg-gray-50 border border-gray-200"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            profile.role === "superadmin" 
              ? "bg-purple-100" 
              : profile.role === "admin"
              ? "bg-blue-100"
              : "bg-gray-200"
          }`}>
            <Shield size={16} className={
              profile.role === "superadmin" 
                ? "text-purple-600" 
                : profile.role === "admin"
                ? "text-blue-600"
                : "text-gray-600"
            } />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Role: {profile.role}</p>
            <p className="text-xs text-gray-500 mt-1">
              {profile.role === "superadmin" 
                ? "Superadmin has full access to all projects, environments, modules, and configs. No additional permissions needed."
                : profile.role === "admin"
                ? "Admin can manage resources. The permissions above show what they can do in each project."
                : "User has limited access. The permissions above show their assigned capabilities."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}