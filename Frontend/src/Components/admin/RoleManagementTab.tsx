import { useState, useEffect } from "react";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Eye,
  Lock,
  Settings,
  Users,
  FolderKanban,
  Database,
  FileText,
  BarChart3,
  Globe,
  UserCog
} from "lucide-react";
import { authFetch, API_BASE_URL } from "../../lib/auth";

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
}

const formatPermissionForSummary = (permission: string) =>
  permission === "*" ? "full access (*)" : permission.replace(/_/g, " ").toLowerCase();

const buildRoleChangeSummary = (
  editingRole: Role | null,
  formData: { name: string; description: string; permissions: string[] }
) => {
  if (!editingRole) {
    return `Role "${formData.name}" with ${formData.permissions.length} permissions: ${formData.permissions.map(formatPermissionForSummary).join(", ")}`;
  }

  const parts: string[] = [];
  if (editingRole.name !== formData.name) {
    parts.push(`Name: "${editingRole.name}" -> "${formData.name}"`);
  }
  if ((editingRole.description || "") !== (formData.description || "")) {
    parts.push("Description updated");
  }

  const previousPermissions = new Set(editingRole.permissions || []);
  const nextPermissions = new Set(formData.permissions || []);
  const added = [...nextPermissions].filter((permission) => !previousPermissions.has(permission));
  const removed = [...previousPermissions].filter((permission) => !nextPermissions.has(permission));

  if (added.length > 0) {
    parts.push(`Added access: ${added.map(formatPermissionForSummary).join(", ")}`);
  }
  if (removed.length > 0) {
    parts.push(`Removed access: ${removed.map(formatPermissionForSummary).join(", ")}`);
  }

  if (parts.length === 0) {
    parts.push("No role changes.");
  }

  return parts.join(". ");
};

export default function RoleManagementTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(permissionCategories)));
  
  // New Role Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE_URL}/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        setError("Failed to fetch roles");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role: Role | null = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        description: "",
        permissions: []
      });
    }
    setIsModalOpen(true);
    setExpandedCategories(new Set(Object.keys(permissionCategories)));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      const alreadyHas = prev.permissions.includes(permission);
      if (alreadyHas) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permission] };
      }
    });
  };

  const handleSelectAllCategory = (permissions: string[]) => {
    setFormData(prev => {
      const categoryPermissions = permissions;
      const allSelected = categoryPermissions.every(p => prev.permissions.includes(p));
      
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
        };
      } else {
        const newPermissions = [...prev.permissions];
        categoryPermissions.forEach(p => {
          if (!newPermissions.includes(p)) {
            newPermissions.push(p);
          }
        });
        return { ...prev, permissions: newPermissions };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const changeSummary = buildRoleChangeSummary(editingRole, formData);
    const reasonInput = window.prompt(
      `Please provide a reason to ${editingRole ? "update" : "create"} this role.\n\nChanges:\n${changeSummary}`
    );
    if (reasonInput === null) return;

    const reason = reasonInput.trim();
    if (!reason) {
      alert("Reason is required.");
      return;
    }

    try {
      const url = editingRole ? `${API_BASE_URL}/roles/${editingRole._id}` : `${API_BASE_URL}/roles`;
      const method = editingRole ? "PUT" : "POST";
      
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reason,
          changeSummary
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchRoles();
      } else {
        const data = await response.json();
        alert(data.message || "Operation failed");
      }
    } catch (err) {
      alert("Error saving role");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const roleToDelete = roles.find((role) => role._id === id);
    const rolePermissions = roleToDelete?.permissions || [];
    const changeSummary = `Deleting role "${name}" with ${rolePermissions.length} permissions: ${rolePermissions.map(formatPermissionForSummary).join(", ")}`;
    const reasonInput = window.prompt(
      `Please provide a reason to delete this role.\n\nChanges:\n${changeSummary}`
    );
    if (reasonInput === null) return;

    const reason = reasonInput.trim();
    if (!reason) {
      alert("Reason is required.");
      return;
    }

    if (!confirm(`Are you sure you want to delete the role '${name}'?`)) return;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/roles/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, changeSummary })
      });

      if (response.ok) {
        fetchRoles();
      } else {
        const data = await response.json();
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      alert("Error deleting role");
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const isCategoryFullySelected = (permissions: string[]) => {
    return permissions.length > 0 && permissions.every(p => formData.permissions.includes(p));
  };

  const isCategoryPartiallySelected = (permissions: string[]) => {
    const selectedCount = permissions.filter(p => formData.permissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < permissions.length;
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Roles</h2>
          <p className="text-sm text-gray-500">Manage application-level roles and their permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Create New Role
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Role List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${role.isSystem ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <Shield size={18} className={role.isSystem ? "text-purple-600" : "text-blue-600"} />
                  </div>
                  <h3 className="font-bold text-gray-900">{role.name}</h3>
                </div>
                {role.isSystem && (
                  <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded-full font-bold">
                    System
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                {role.description || "No description provided."}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Permissions ({role.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <span key={perm} className="bg-gray-100 text-gray-700 text-[10px] px-2 py-1 rounded-full border border-gray-200 font-medium">
                      {perm === "*" ? "Full Access" : perm.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                  {role.permissions.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${role.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">{role.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(role)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Role"
                  >
                    <Edit size={16} />
                  </button>
                  {!role.isSystem && (
                    <button 
                      onClick={() => handleDelete(role._id, role.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Modal - Multi-column Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Shield size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingRole ? "Edit User Role" : "Create New Role"}</h3>
                  <p className="text-xs text-gray-500">Define role details and application permissions</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Role Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Developer, Support, Manager"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                    disabled={editingRole?.isSystem}
                  />
                  {editingRole?.isSystem && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600">
                      <AlertCircle size={12} /> System role names cannot be changed.
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this role"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10 border-b border-gray-200">
                  <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Layers size={18} className="text-blue-600" />
                    Assign Permissions
                  </label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, permissions: allCategorizedPermissions})}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, permissions: []})}
                      className="text-xs text-gray-500 hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Multi-column Grid Layout for Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(permissionCategories).map(([category, perms]) => {
                    const fullySelected = isCategoryFullySelected(perms);
                    const partiallySelected = isCategoryPartiallySelected(perms);
                    const isExpanded = expandedCategories.has(category);
                    
                    return (
                      <div key={category} className="border border-gray-200 rounded-xl overflow-hidden h-fit">
                        <div 
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            fullySelected ? 'bg-green-50 border-green-200' : partiallySelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                          }`}
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {isExpanded ? <ChevronDown size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getCategoryIcon(category)}
                              <h4 className="text-sm font-bold text-gray-800 truncate">{category}</h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">{perms.length}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAllCategory(perms);
                              }}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                fullySelected 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {fullySelected ? 'Clear' : 'All'}
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-3 space-y-2 bg-white max-h-64 overflow-y-auto">
                            {/* Multi-column layout for permissions within category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {perms.map((perm) => (
                                <div 
                                  key={perm}
                                  onClick={() => handlePermissionToggle(perm)}
                                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                                    formData.permissions.includes(perm)
                                      ? "bg-blue-50 border-blue-200"
                                      : "bg-white border-gray-200 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {getPermissionIcon(perm)}
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs font-medium truncate block">
                                        {perm === "*" ? "Full Access" : formatPermissionName(perm)}
                                      </span>
                                      {getPermissionDescription(perm) && (
                                        <p className="text-[10px] text-gray-500 truncate">
                                          {getPermissionDescription(perm)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {formData.permissions.includes(perm) ? (
                                    <div className="bg-blue-600 text-white p-0.5 rounded-full ring-2 ring-blue-100 flex-shrink-0">
                                      <Check size={10} />
                                    </div>
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all font-bold"
              >
                {editingRole ? "Save Changes" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Updated Permission Categories with conditional visibility logic
const permissionCategories: Record<string, string[]> = {
  "Global Page Permissions": [
    "VIEW_DASHBOARD", 
    "VIEW_ALLPROJECT", 
    "VIEW_MANAGEASSIGNING",
    "VIEW_MYASSIGNMENT", 
    "VIEW_REPORTS", 
    "ACCESS_SETTINGS", 
    "*"
  ],
  
  "Project Management": [
    "VIEW_ALLPROJECT",
    "READ_PROJECT",
    "CREATE_PROJECT",
    "UPDATE_PROJECT", 
    "DELETE_PROJECT",
    "ASSIGN_USER"
  ],
  
  "Manage Assigning": [
    "MANAGE_USERS",
    "ASSIGN_ADMIN",
    "ASSIGN_USER"
  ],
  
  "Admin Panel Access": [
    "VIEW_PROJECT_TEMPLATES",
    "VIEW_CONFIG_TEMPLATES", 
    "VIEW_USER_ROLES",
    "VIEW_SYSTEM_SETTINGS"
  ],
  
  "User & Role Management": [
    "VIEW_USERS",
    "CREATE_USER", 
    "UPDATE_USER",
    "DELETE_USER",
    "VIEW_ROLES",
    "CREATE_ROLE",
    "UPDATE_ROLE",
    "DELETE_ROLE"
  ],
  
  "Environments": [
    "ACCESS_DEVELOPMENT",
    "ACCESS_STAGING",
    "ACCESS_UAT",
    "ACCESS_PRODUCTION"
  ],
  
  "Resources (Env/Mod/Config)": [
    "CREATE_ENVIRONMENT",
    "READ_ENVIRONMENT",
    "UPDATE_ENVIRONMENT",
    "DELETE_ENVIRONMENT",
    "CREATE_MODULE",
    "READ_MODULE",
    "UPDATE_MODULE",
    "DELETE_MODULE",
    "CREATE_CONFIG",
    "READ_CONFIG",
    "UPDATE_CONFIG",
    "DELETE_CONFIG"
  ],
  
  "Report Page": [
    "VIEW_AUTH_LOGS",
    "VIEW_USER_LOGS",
    "VIEW_PERMISSION_LOGS",
    "VIEW_ACTIVITY_LOGS",
    "VIEW_ADMIN_LOGS"
  ]
};

const allCategorizedPermissions = Array.from(
  new Set(Object.values(permissionCategories).flat())
);

// Helper functions for icons and formatting
function getCategoryIcon(category: string) {
  if (category.includes("Global")) return <Globe size={16} className="text-purple-600 flex-shrink-0" />;
  if (category.includes("Project")) return <FolderKanban size={16} className="text-blue-600 flex-shrink-0" />;
  if (category.includes("Manage Assigning")) return <UserCog size={16} className="text-green-600 flex-shrink-0" />;
  if (category.includes("Admin Panel")) return <Settings size={16} className="text-orange-600 flex-shrink-0" />;
  if (category.includes("User")) return <Users size={16} className="text-emerald-600 flex-shrink-0" />;
  if (category.includes("Environment")) return <Database size={16} className="text-cyan-600 flex-shrink-0" />;
  if (category.includes("Resources")) return <FileText size={16} className="text-red-600 flex-shrink-0" />;
  if (category.includes("Report")) return <BarChart3 size={16} className="text-amber-600 flex-shrink-0" />;
  return <Lock size={16} className="text-gray-600 flex-shrink-0" />;
}

function getPermissionIcon(permission: string) {
  if (permission.includes("VIEW") || permission.includes("READ")) return <Eye size={12} className="text-blue-500 flex-shrink-0" />;
  if (permission.includes("CREATE")) return <Plus size={12} className="text-green-500 flex-shrink-0" />;
  if (permission.includes("UPDATE") || permission.includes("EDIT")) return <Edit size={12} className="text-orange-500 flex-shrink-0" />;
  if (permission.includes("DELETE") || permission.includes("REMOVE")) return <Trash2 size={12} className="text-red-500 flex-shrink-0" />;
  if (permission === "*") return <Shield size={12} className="text-purple-500 flex-shrink-0" />;
  if (permission.includes("ASSIGN")) return <Users size={12} className="text-emerald-500 flex-shrink-0" />;
  if (permission.includes("ACCESS")) return <Lock size={12} className="text-amber-500 flex-shrink-0" />;
  return <Lock size={12} className="text-gray-500 flex-shrink-0" />;
}

function formatPermissionName(permission: string): string {
  return permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    "VIEW_DASHBOARD": "Access to main dashboard",
    "VIEW_ALLPROJECT": "View all projects",
    "VIEW_MANAGEASSIGNING": "Manage assignments page",
    "VIEW_MYASSIGNMENT": "My assignments only",
    "VIEW_REPORTS": "Reports & analytics",
    "ACCESS_SETTINGS": "System settings",
    "*": "Complete system access",
    "READ_PROJECT": "View assigned projects",
    "CREATE_PROJECT": "Create new projects",
    "UPDATE_PROJECT": "Edit projects",
    "DELETE_PROJECT": "Delete projects",
    "ASSIGN_USER": "Assign users to projects",
    "MANAGE_USERS": "Manage all users",
    "ASSIGN_ADMIN": "Assign admin roles",
    "VIEW_PROJECT_TEMPLATES": "Project templates",
    "VIEW_CONFIG_TEMPLATES": "Config templates",
    "VIEW_USER_ROLES": "Role management",
    "VIEW_SYSTEM_SETTINGS": "System config",
    "ACCESS_DEVELOPMENT": "Dev environment",
    "ACCESS_STAGING": "Staging environment",
    "ACCESS_UAT": "UAT environment",
    "ACCESS_PRODUCTION": "Production access",
    "CREATE_ENVIRONMENT": "Create environments",
    "READ_ENVIRONMENT": "View environments",
    "UPDATE_ENVIRONMENT": "Edit environments",
    "DELETE_ENVIRONMENT": "Delete environments",
    "CREATE_MODULE": "Create modules",
    "READ_MODULE": "View modules",
    "UPDATE_MODULE": "Edit modules",
    "DELETE_MODULE": "Delete modules",
    "CREATE_CONFIG": "Create configs",
    "READ_CONFIG": "View configs",
    "UPDATE_CONFIG": "Edit configs",
    "DELETE_CONFIG": "Delete configs",
    "VIEW_AUTH_LOGS": "Authentication logs",
    "VIEW_USER_LOGS": "User activity logs",
    "VIEW_PERMISSION_LOGS": "Permission changes",
    "VIEW_ACTIVITY_LOGS": "System activity",
    "VIEW_ADMIN_LOGS": "Admin actions"
  };
  
  return descriptions[permission] || "";
}
