import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  FolderTree,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import type { SelectedPermissions } from "./AssignProject";
import AccessToggle from "../../../Components/common/AccessToggle";

interface User {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface Environment {
  _id: string;
  name: string;
  modules: Module[];
}

interface Module {
  _id: string;
  moduleName: string;
  configEntries?: ConfigEntry[];
}

interface ConfigEntry {
  _id: string;
  key: string;
}

interface UserSelectionPanelProps {
  users: User[];
  environments: Environment[];
  selectedUsers: string[];
  expandedUsers: Record<string, boolean>;
  userPermissions: Record<string, SelectedPermissions>;
  onToggleUserSelection: (userId: string) => void;
  onToggleUserExpand: (userId: string) => void;
  onUpdateUserPermissions: (userId: string, newPermissions: SelectedPermissions) => void;
  currentUserRole?: string; // Add this prop
}

// Role-based permission presets (unchanged)
const ROLE_PRESETS = {
  admin: {
    environment: {
      READ_ENVIRONMENT: true,
      CREATE_MODULE: true,
      UPDATE_ENVIRONMENT: true,
      DELETE_ENVIRONMENT: false
    },
    module: {
      READ_MODULE: true,
      CREATE_CONFIG: true,
      UPDATE_MODULE: true,
      DELETE_MODULE: false
    },
    config: {
      READ_CONFIG: true,
      UPDATE_CONFIG: true,
      DELETE_CONFIG: false
    }
  },
  lead: {
    environment: {
      READ_ENVIRONMENT: true,
      CREATE_MODULE: true,
      UPDATE_ENVIRONMENT: false,
      DELETE_ENVIRONMENT: false
    },
    module: {
      READ_MODULE: true,
      CREATE_CONFIG: true,
      UPDATE_MODULE: false,
      DELETE_MODULE: false
    },
    config: {
      READ_CONFIG: true,
      UPDATE_CONFIG: false,
      DELETE_CONFIG: false
    }
  },
  dev: {
    environment: {
      READ_ENVIRONMENT: true,
      CREATE_MODULE: false,
      UPDATE_ENVIRONMENT: true,
      DELETE_ENVIRONMENT: false
    },
    module: {
      READ_MODULE: true,
      CREATE_CONFIG: false,
      UPDATE_MODULE: true,
      DELETE_MODULE: false
    },
    config: {
      READ_CONFIG: true,
      UPDATE_CONFIG: true,
      DELETE_CONFIG: false
    }
  },
  user: {
    environment: {
      READ_ENVIRONMENT: true,
      CREATE_MODULE: false,
      UPDATE_ENVIRONMENT: false,
      DELETE_ENVIRONMENT: false
    },
    module: {
      READ_MODULE: true,
      CREATE_CONFIG: false,
      UPDATE_MODULE: false,
      DELETE_MODULE: false
    },
    config: {
      READ_CONFIG: true,
      UPDATE_CONFIG: false,
      DELETE_CONFIG: false
    }
  }
};

export default function UserSelectionPanel({
  users,
  environments,
  selectedUsers,
  expandedUsers,
  userPermissions,
  onToggleUserSelection,
  onToggleUserExpand,
  onUpdateUserPermissions,
  currentUserRole = "admin" // Default to admin
}: UserSelectionPanelProps) {
  const [expandedEnvironments, setExpandedEnvironments] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedRolePreset, setSelectedRolePreset] = useState<Record<string, string>>({});

  // Initialize permissions for new users (showing all environments/modules/configs)
  useEffect(() => {
    selectedUsers.forEach(userId => {
      if (!userPermissions[userId]) {
        initializeUserPermissions(userId);
      }
    });
  }, [selectedUsers]);

  const initializeUserPermissions = (userId: string) => {
    const initialPermissions: SelectedPermissions = {
      environments: {}
    };

    environments.forEach(env => {
      // Initialize environment with all permissions set to false
      initialPermissions.environments[env._id] = {
        selected: false,
        permissions: {
          READ_ENVIRONMENT: false,
          CREATE_MODULE: false,
          UPDATE_ENVIRONMENT: false,
          DELETE_ENVIRONMENT: false
        },
        modules: {}
      };

      // Initialize modules for this environment
      env.modules.forEach(module => {
        initialPermissions.environments[env._id].modules[module._id] = {
          selected: false,
          accessAll: false,
          permissions: {
            READ_MODULE: false,
            CREATE_CONFIG: false,
            UPDATE_MODULE: false,
            DELETE_MODULE: false
          },
          configs: {}
        };

        // Initialize configs for this module
        module.configEntries?.forEach(config => {
          initialPermissions.environments[env._id].modules[module._id].configs[config._id] = {
            selected: false,
            permissions: {
              READ_CONFIG: false,
              UPDATE_CONFIG: false,
              DELETE_CONFIG: false
            }
          };
        });
      });
    });

    onUpdateUserPermissions(userId, initialPermissions);
  };

  const toggleEnvironmentExpand = (envId: string) => {
    setExpandedEnvironments(prev => ({
      ...prev,
      [envId]: !prev[envId]
    }));
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleEnvironment = (userId: string, envId: string) => {
    const newPermissions = { ...userPermissions[userId] };
    if (newPermissions.environments[envId]) {
      const newSelected = !newPermissions.environments[envId].selected;
      newPermissions.environments[envId].selected = newSelected;

      if (newSelected) {
        newPermissions.environments[envId].permissions.READ_ENVIRONMENT = true;
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleModule = (userId: string, envId: string, moduleId: string) => {
    const newPermissions = { ...userPermissions[userId] };
    const module = newPermissions.environments[envId]?.modules[moduleId];
    if (module) {
      const newSelected = !module.selected;
      module.selected = newSelected;

      if (newSelected) {
        module.permissions.READ_MODULE = true;
        module.accessAll = true;
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleConfig = (userId: string, envId: string, moduleId: string, configId: string) => {
    const newPermissions = { ...userPermissions[userId] };
    const config = newPermissions.environments[envId]?.modules[moduleId]?.configs[configId];
    if (config) {
      const newSelected = !config.selected;
      config.selected = newSelected;

      if (newSelected) {
        config.permissions.READ_CONFIG = true;
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleAccessAll = (userId: string, envId: string, moduleId: string, value: boolean) => {
    const newPermissions = { ...userPermissions[userId] };
    const module = newPermissions.environments[envId]?.modules[moduleId];
    if (module) {
      module.accessAll = value;
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleEnvironmentPermission = (
    userId: string,
    envId: string,
    permission: string
  ) => {
    const newPermissions = { ...userPermissions[userId] };
    const env = newPermissions.environments[envId];
    if (env) {
      env.permissions[permission] = !env.permissions[permission];
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleModulePermission = (
    userId: string,
    envId: string,
    moduleId: string,
    permission: string
  ) => {
    const newPermissions = { ...userPermissions[userId] };
    const module = newPermissions.environments[envId]?.modules[moduleId];
    if (module) {
      module.permissions[permission] = !module.permissions[permission];
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleConfigPermission = (
    userId: string,
    envId: string,
    moduleId: string,
    configId: string,
    permission: string
  ) => {
    const newPermissions = { ...userPermissions[userId] };
    const config = newPermissions.environments[envId]?.modules[moduleId]?.configs[configId];
    if (config) {
      config.permissions[permission] = !config.permissions[permission];
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleSelectAllEnvironments = (userId: string) => {
    const newPermissions = { ...userPermissions[userId] };
    const allSelected = Object.values(newPermissions.environments).every(env => env.selected);

    Object.keys(newPermissions.environments).forEach(envId => {
      newPermissions.environments[envId].selected = !allSelected;
      if (!allSelected) {
        newPermissions.environments[envId].permissions.READ_ENVIRONMENT = true;
      }
    });

    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleSelectAllModules = (userId: string, envId: string) => {
    const newPermissions = { ...userPermissions[userId] };
    const env = newPermissions.environments[envId];
    const allSelected = Object.values(env.modules).every(mod => mod.selected);

    Object.keys(env.modules).forEach(moduleId => {
      env.modules[moduleId].selected = !allSelected;
      if (!allSelected) {
        env.modules[moduleId].permissions.READ_MODULE = true;
      }
    });

    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleSelectAllConfigs = (userId: string, envId: string, moduleId: string) => {
    const newPermissions = { ...userPermissions[userId] };
    const module = newPermissions.environments[envId]?.modules[moduleId];

    if (!module || !module.configs) return;

    const allSelected = Object.values(module.configs).every(config => config.selected);

    Object.keys(module.configs).forEach(configId => {
      module.configs[configId].selected = !allSelected;
      if (!allSelected) {
        module.configs[configId].permissions.READ_CONFIG = true;
      }
    });

    onUpdateUserPermissions(userId, newPermissions);
  };

  const applyRolePreset = (userId: string, presetRole: string) => {
    setSelectedRolePreset(prev => ({ ...prev, [userId]: presetRole }));

    const preset = ROLE_PRESETS[presetRole as keyof typeof ROLE_PRESETS];
    if (!preset) return;

    const newPermissions = { ...userPermissions[userId] };

    Object.keys(newPermissions.environments).forEach(envId => {
      const env = newPermissions.environments[envId];
      env.permissions = { ...preset.environment };

      Object.keys(env.modules).forEach(moduleId => {
        const module = env.modules[moduleId];
        module.permissions = { ...preset.module };

        Object.keys(module.configs).forEach(configId => {
          const config = module.configs[configId];
          config.permissions = { ...preset.config };
        });
      });
    });

    onUpdateUserPermissions(userId, newPermissions);
  };

  // Check if current user can assign permissions
  const canAssign = currentUserRole === "superadmin" || currentUserRole === "admin";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4">Select Users</h2>

        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No users available</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {users.map((user) => (
              <div key={user._id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* User Header */}
                <div
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer bg-white"
                  onClick={() => onToggleUserExpand(user._id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleUserSelection(user._id);
                    }}
                    className="mr-3"
                    disabled={!canAssign}
                  >
                    {selectedUsers.includes(user._id) ? (
                      <CheckSquare className={`${canAssign ? "text-blue-600" : "text-gray-400"}`} size={22} />
                    ) : (
                      <Square className={`${canAssign ? "text-gray-400" : "text-gray-300"}`} size={22} />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="font-semibold text-base">
                      {user.firstname} {user.lastname}
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {user.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  {expandedUsers[user._id] ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </div>

                {/* Permissions Panel */}
                {expandedUsers[user._id] && selectedUsers.includes(user._id) && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Role Preset Dropdown */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Role Preset
                      </label>
                      <select
                        value={selectedRolePreset[user._id] || ""}
                        onChange={(e) => applyRolePreset(user._id, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Custom Configuration</option>
                        <option value="admin">Admin (Full Access without Delete)</option>
                        <option value="lead">Lead (Create & Read)</option>
                        <option value="dev">Developer (Update & Read)</option>
                        <option value="user">User (Read Only)</option>
                      </select>
                    </div>

                    {/* Global Select All Button - Only show if user can assign */}
                    {canAssign && (
                      <div className="mb-4 flex justify-end">
                        <button
                          onClick={() => toggleSelectAllEnvironments(user._id)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          {Object.values(userPermissions[user._id]?.environments || {}).every(e => e.selected)
                            ? "Deselect All Environments"
                            : "Select All Environments"}
                        </button>
                      </div>
                    )}

                    {/* Environments Section */}
                    <div className="space-y-4">
                      {environments.map((env) => {
                        const envData = userPermissions[user._id]?.environments[env._id];
                        if (!envData) return null;

                        const allEnvModules = Object.values(envData.modules);
                        const selectedModulesCount = allEnvModules.filter(m => m.selected).length;
                        const totalModulesCount = allEnvModules.length;

                        return (
                          <div key={env._id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            {/* Environment Header */}
                            <div
                              className={`flex items-center px-4 py-3 bg-gray-100 ${envData.selected ? "cursor-pointer hover:bg-gray-200" : "cursor-not-allowed opacity-60"
                                }`}
                              onClick={() => {
                                if (envData.selected && canAssign) {
                                  toggleEnvironmentExpand(env._id);
                                }
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canAssign) {
                                    toggleEnvironment(user._id, env._id);
                                  }
                                }}
                                className="mr-3"
                                disabled={!canAssign}
                              >
                                {envData.selected ? (
                                  <CheckSquare className="text-blue-600" size={20} />
                                ) : (
                                  <Square className="text-gray-400" size={20} />
                                )}
                              </button>
                              <span className="font-medium text-base flex-1">{env.name}</span>

                              {/* Environment Action Buttons - Only show if user can assign */}
                              {canAssign && (
                                <div className="flex items-center gap-2 mr-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEnvironmentPermission(user._id, env._id, "CREATE_MODULE");
                                    }}
                                    disabled={!envData.selected || !envData.permissions.READ_ENVIRONMENT}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${envData.permissions.CREATE_MODULE && envData.selected && envData.permissions.READ_ENVIRONMENT
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title="Create Module"
                                  >
                                    <Plus size={12} />
                                    <span className="hidden sm:inline">Module</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEnvironmentPermission(user._id, env._id, "READ_ENVIRONMENT");
                                    }}
                                    disabled={!envData.selected}
                                    className={`p-1.5 rounded-md transition ${envData.permissions.READ_ENVIRONMENT && envData.selected
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title="Read (Required)"
                                  >
                                    <Eye size={14} />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEnvironmentPermission(user._id, env._id, "UPDATE_ENVIRONMENT");
                                    }}
                                    disabled={!envData.selected || !envData.permissions.READ_ENVIRONMENT}
                                    className={`p-1.5 rounded-md transition ${envData.permissions.UPDATE_ENVIRONMENT && envData.selected && envData.permissions.READ_ENVIRONMENT
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title="Update"
                                  >
                                    <Edit size={14} />
                                  </button>

                                  {/* Delete button - Only visible to superadmin */}
                                  {currentUserRole === "superadmin" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleEnvironmentPermission(user._id, env._id, "DELETE_ENVIRONMENT");
                                      }}
                                      disabled={!envData.selected || !envData.permissions.READ_ENVIRONMENT}
                                      className={`p-1.5 rounded-md transition ${envData.permissions.DELETE_ENVIRONMENT && envData.selected && envData.permissions.READ_ENVIRONMENT
                                          ? "bg-green-100 text-green-700 border border-green-300"
                                          : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              )}

                              <span className="text-sm text-gray-600 mr-4">
                                {selectedModulesCount}/{totalModulesCount} Modules
                              </span>

                              {/* Chevron - Only clickable when environment is selected and user can assign */}
                              {envData.selected ? (
                                expandedEnvironments[env._id] ? (
                                  <ChevronDown
                                    size={18}
                                    className={`text-gray-500 ${canAssign ? "cursor-pointer" : "cursor-not-allowed"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canAssign) {
                                        toggleEnvironmentExpand(env._id);
                                      }
                                    }}
                                  />
                                ) : (
                                  <ChevronRight
                                    size={18}
                                    className={`text-gray-500 ${canAssign ? "cursor-pointer" : "cursor-not-allowed"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canAssign) {
                                        toggleEnvironmentExpand(env._id);
                                      }
                                    }}
                                  />
                                )
                              ) : (
                                <ChevronRight size={18} className="text-gray-300 cursor-not-allowed" />
                              )}
                            </div>

                            {/* Environment Expanded Content */}
                            {expandedEnvironments[env._id] && (
                              <div className="p-4 border-t border-gray-200">
                                {/* Modules Section */}
                                <div className="mt-2">
                                  {/* Module Access Header with Select All */}
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-base font-semibold text-gray-800">MODULES</h4>
                                    {canAssign && (
                                      <button
                                        onClick={() => toggleSelectAllModules(user._id, env._id)}
                                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200"
                                      >
                                        {Object.values(envData.modules).every(m => m.selected)
                                          ? "Deselect All"
                                          : "Select All"}
                                      </button>
                                    )}
                                  </div>

                                  {/* Modules List */}
                                  <div className="space-y-3">
                                    {env.modules.map((module) => {
                                      const moduleData = envData.modules[module._id];
                                      if (!moduleData) return null;

                                      const selectedConfigsCount = Object.values(moduleData.configs).filter(c => c.selected).length;
                                      const totalConfigsCount = Object.values(moduleData.configs).length;

                                      return (
  <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden mb-2">
    {/* Module Header */}
    <div
      className={`flex items-center px-4 py-3 ${
        moduleData.selected 
          ? "bg-blue-50/50 hover:bg-blue-100/50 cursor-pointer" 
          : "bg-gray-50 opacity-70 cursor-not-allowed"
      } transition-colors`}
      onClick={() => {
        if (moduleData.selected && canAssign) {
          toggleModuleExpand(module._id);
        }
      }}
    >
      {/* Selection Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canAssign) {
            toggleModule(user._id, env._id, module._id);
          }
        }}
        className="mr-3 flex-shrink-0"
        disabled={!canAssign}
      >
        {moduleData.selected ? (
          <CheckSquare className="text-blue-600" size={20} />
        ) : (
          <Square className="text-gray-400" size={20} />
        )}
      </button>

      {/* Module Icon and Name */}
      <div className="flex items-center flex-1 min-w-0">
        <FolderTree size={18} className="text-gray-500 mr-2 flex-shrink-0" />
        <span className="font-medium text-sm truncate">{module.moduleName}</span>
      </div>

      {/* Access Toggle (if applicable) */}
      {moduleData.selected && (
        <div className="mr-4 flex-shrink-0">
          <AccessToggle 
            enabled={moduleData.accessAll} 
            setEnabled={(val) => {
              if (canAssign) {
                toggleAccessAll(user._id, env._id, module._id, val);
              }
            }}
          />
        </div>
      )}

      {/* Config Count Badge */}
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-4 flex-shrink-0">
        {selectedConfigsCount}/{totalConfigsCount} keys
      </span>

      {/* Action Buttons - Only if canAssign */}
      {canAssign && (
        <div className="flex items-center gap-1 mr-4 flex-shrink-0">
          {/* Create Config Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleModulePermission(user._id, env._id, module._id, "CREATE_CONFIG");
            }}
            disabled={!moduleData.selected || !moduleData.permissions.READ_MODULE}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              moduleData.permissions.CREATE_CONFIG && moduleData.selected && moduleData.permissions.READ_MODULE
                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Create Config"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Config</span>
          </button>

          {/* Read Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleModulePermission(user._id, env._id, module._id, "READ_MODULE");
            }}
            disabled={!moduleData.selected}
            className={`p-1.5 rounded-md transition-all ${
              moduleData.permissions.READ_MODULE && moduleData.selected
                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Read (Required)"
          >
            <Eye size={16} />
          </button>

          {/* Update Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleModulePermission(user._id, env._id, module._id, "UPDATE_MODULE");
            }}
            disabled={!moduleData.selected || !moduleData.permissions.READ_MODULE}
            className={`p-1.5 rounded-md transition-all ${
              moduleData.permissions.UPDATE_MODULE && moduleData.selected && moduleData.permissions.READ_MODULE
                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Update"
          >
            <Edit size={16} />
          </button>

          {/* Delete Button - Superadmin only */}
          {currentUserRole === "superadmin" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleModulePermission(user._id, env._id, module._id, "DELETE_MODULE");
              }}
              disabled={!moduleData.selected || !moduleData.permissions.READ_MODULE}
              className={`p-1.5 rounded-md transition-all ${
                moduleData.permissions.DELETE_MODULE && moduleData.selected && moduleData.permissions.READ_MODULE
                  ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Expand/Collapse Chevron */}
      {moduleData.selected ? (
        moduleData.accessAll ? (
          <div className="w-5 flex-shrink-0" />
        ) : expandedModules[module._id] ? (
          <ChevronDown
            size={18}
            className={`text-gray-500 flex-shrink-0 ${
              canAssign ? "cursor-pointer hover:text-gray-700" : "cursor-not-allowed"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (canAssign) {
                toggleModuleExpand(module._id);
              }
            }}
          />
        ) : (
          <ChevronRight
            size={18}
            className={`text-gray-500 flex-shrink-0 ${
              canAssign ? "cursor-pointer hover:text-gray-700" : "cursor-not-allowed"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (canAssign) {
                toggleModuleExpand(module._id);
              }
            }}
          />
        )
      ) : (
        <ChevronRight size={18} className="text-gray-300 cursor-not-allowed flex-shrink-0" />
      )}
    </div>

    {/* Expanded Content - Config Entries */}
    {expandedModules[module._id] && !moduleData.accessAll && (
      <div className="border-t border-gray-200 bg-gray-50/80 p-4">
        {module.configEntries && module.configEntries.length > 0 ? (
          <>
            {/* Config Header with Select All */}
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                <FileText size={14} className="mr-2 text-gray-500" />
                Configuration Keys
              </h5>
              {canAssign && (
                <button
                  onClick={() => toggleSelectAllConfigs(user._id, env._id, module._id)}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200 transition-colors"
                >
                  {Object.values(moduleData.configs).every(c => c.selected)
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {/* Config Entries List */}
            <div className="space-y-2">
              {module.configEntries.map((config) => {
                const configData = moduleData.configs[config._id];
                if (!configData) return null;

                return (
                  <div key={config._id} className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-white transition-colors">
                    {/* Config Info */}
                    <div className="flex items-center flex-1 min-w-0">
                      <button
                        onClick={() => {
                          if (canAssign) {
                            toggleConfig(user._id, env._id, module._id, config._id);
                          }
                        }}
                        className="mr-3 flex-shrink-0"
                        disabled={!canAssign}
                      >
                        {configData.selected ? (
                          <CheckSquare className="text-blue-600" size={16} />
                        ) : (
                          <Square className="text-gray-400" size={16} />
                        )}
                      </button>
                      <FileText size={14} className="text-gray-500 mr-2 flex-shrink-0" />
                      <span className="text-sm font-mono truncate">{config.key}</span>
                    </div>

                    {/* Config Action Buttons */}
                    {canAssign && (
                      <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                        {/* Read Button */}
                        <button
                          onClick={() => toggleConfigPermission(user._id, env._id, module._id, config._id, "READ_CONFIG")}
                          disabled={!configData.selected}
                          className={`p-1.5 rounded-md transition-all ${
                            configData.permissions.READ_CONFIG && configData.selected
                              ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title="Read"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Update Button */}
                        <button
                          onClick={() => toggleConfigPermission(user._id, env._id, module._id, config._id, "UPDATE_CONFIG")}
                          disabled={!configData.selected || !configData.permissions.READ_CONFIG}
                          className={`p-1.5 rounded-md transition-all ${
                            configData.permissions.UPDATE_CONFIG && configData.selected && configData.permissions.READ_CONFIG
                              ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title="Update"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Delete Button - Superadmin only */}
                        {currentUserRole === "superadmin" && (
                          <button
                            onClick={() => toggleConfigPermission(user._id, env._id, module._id, config._id, "DELETE_CONFIG")}
                            disabled={!configData.selected || !configData.permissions.READ_CONFIG}
                            className={`p-1.5 rounded-md transition-all ${
                              configData.permissions.DELETE_CONFIG && configData.selected && configData.permissions.READ_CONFIG
                                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No configuration keys for this module
          </div>
        )}
      </div>
    )}
  </div>
);
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}