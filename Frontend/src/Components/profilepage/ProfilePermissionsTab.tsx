// profilePage/ProfilePermissionsTab.tsx
import { Globe, Users } from "lucide-react";
import { PERMISSIONS, type Permission } from "../../userModel/User";
import type { ProfileData, Project } from "./ProfilePage";

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  PROJECT: {
    label: "Project Permissions",
    permissions: [
      PERMISSIONS.CREATE_PROJECT,
      PERMISSIONS.READ_PROJECT,
      PERMISSIONS.UPDATE_PROJECT,
      PERMISSIONS.DELETE_PROJECT,
    ]
  },
  ENVIRONMENT: {
    label: "Environment Permissions",
    permissions: [
      PERMISSIONS.CREATE_ENVIRONMENT,
      PERMISSIONS.READ_ENVIRONMENT,
      PERMISSIONS.UPDATE_ENVIRONMENT,
      PERMISSIONS.DELETE_ENVIRONMENT,
    ]
  },
  MODULE: {
    label: "Module Permissions",
    permissions: [
      PERMISSIONS.CREATE_MODULE,
      PERMISSIONS.READ_MODULE,
      PERMISSIONS.UPDATE_MODULE,
      PERMISSIONS.DELETE_MODULE,
    ]
  },
  CONFIG: {
    label: "Config Permissions",
    permissions: [
      PERMISSIONS.CREATE_CONFIG,
      PERMISSIONS.READ_CONFIG,
      PERMISSIONS.UPDATE_CONFIG,
      PERMISSIONS.DELETE_CONFIG,
    ]
  },
  USER: {
    label: "User Management",
    permissions: [
      PERMISSIONS.ASSIGN_USER,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_REPORTS,
    ]
  }
};

interface ProfilePermissionsTabProps {
  profile: ProfileData;
  form: ProfileData;
  projects: Project[];
  selectedProject: string;
  projectPermissions: Record<string, Permission[]>;
  loadingProjects: boolean;
  permissionEditMode: boolean;
  isSaving: boolean;
  onPermissionToggle: (permission: Permission) => void;
  onProjectPermissionToggle: (projectId: string, permission: Permission) => void;
  onProjectChange: (projectId: string) => void;
  onSaveProjectPermissions: () => void;
}

export default function ProfilePermissionsTab({
  profile,
  form,
  projects,
  selectedProject,
  projectPermissions,
  loadingProjects,
  permissionEditMode,
  isSaving,
  onPermissionToggle,
  onProjectPermissionToggle,
  onProjectChange,
  onSaveProjectPermissions,
}: ProfilePermissionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Global Permissions */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-blue-600" />
          <h3 className="font-semibold">Global Permissions</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
            <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category.label}</h4>
              <div className="grid grid-cols-2 gap-2">
                {category.permissions.map((permission) => {
                  const hasPerm = form.permissions?.includes(permission) || 
                                (form.role === "superadmin") ||
                                (form.role === "admin" && !permission.includes("DELETE"));
                  
                  return (
                    <label
                      key={permission}
                      className={`flex items-center gap-2 text-xs p-2 rounded cursor-pointer ${
                        permissionEditMode ? "hover:bg-gray-50" : ""
                      } ${form.role === "superadmin" ? "opacity-75" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        onChange={() => onPermissionToggle(permission)}
                        disabled={!permissionEditMode || form.role === "superadmin"}
                        className="w-3 h-3 rounded"
                      />
                      <span className="text-gray-700">
                        {permission.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {form.role === "superadmin" && (
          <p className="text-xs text-purple-600 mt-3">
            Superadmins have all permissions by default
          </p>
        )}
      </div>

      {/* Project-Specific Permissions */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-green-600" />
          <h3 className="font-semibold">Project-Specific Permissions</h3>
        </div>

        {loadingProjects ? (
          <p className="text-sm text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500">No projects available</p>
        ) : (
          <>
            {/* Project Selector */}
            <select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            >
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>

            {selectedProject && (
              <>
                {/* Project Permissions */}
                <div className="space-y-3">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                    <div key={key}>
                      <h4 className="text-xs font-medium text-gray-500 mb-2">{category.label}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.permissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center gap-2 text-xs p-1 rounded cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={projectPermissions[selectedProject]?.includes(permission) || false}
                              onChange={() => onProjectPermissionToggle(selectedProject, permission)}
                              disabled={!permissionEditMode}
                              className="w-3 h-3 rounded"
                            />
                            <span className="text-gray-600">
                              {permission.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Project Permissions Button */}
                {permissionEditMode && (
                  <button
                    onClick={onSaveProjectPermissions}
                    disabled={isSaving}
                    className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Project Permissions"}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Permission Summary</h4>
        <div className="space-y-1 text-sm">
          <p className="text-blue-700">
            <span className="font-semibold">Global Permissions:</span> {form.permissions?.length || 0} assigned
          </p>
          <p className="text-blue-700">
            <span className="font-semibold">Project-Specific:</span> {Object.keys(projectPermissions).length} projects with custom permissions
          </p>
          <p className="text-xs text-blue-600 mt-2">
            {form.role === "superadmin" 
              ? "Superadmin has full access to all resources"
              : form.role === "admin"
              ? "Admin has create, read, update permissions by default"
              : "User has read-only permissions by default"}
          </p>
        </div>
      </div>
    </div>
  );
}