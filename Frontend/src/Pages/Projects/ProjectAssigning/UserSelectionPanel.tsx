import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  FolderTree,
  FileText,
  Users,
  Settings,
  Key,
  Eye,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import type { SelectedPermissions } from "./AssignProject";
import { IOSSwitch } from "../../../Components/ui/ToggleSwitch";

interface User {
  _id: string;
  fullName: string;
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
  currentUserRole?: string;
  canAssignUsers?: boolean;
  canAssignAdmins?: boolean;
}

// Role-based permission presets
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
  currentUserRole = "admin",
  canAssignUsers = true,
  canAssignAdmins = false
}: UserSelectionPanelProps) {
  const [expandedEnvironments, setExpandedEnvironments] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedRolePreset, setSelectedRolePreset] = useState<Record<string, string>>({});

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
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const env = newPermissions.environments[envId];
    if (env) {
      const newSelected = !env.selected;
      env.selected = newSelected;
      if (newSelected) {
        env.permissions.READ_ENVIRONMENT = true;
      } else {
        Object.keys(env.modules).forEach((modId: string) => {
          const module = env.modules[modId];
          module.selected = false;
          Object.keys(module.configs).forEach((confId: string) => {
            module.configs[confId].selected = false;
          });
        });
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleModule = (userId: string, envId: string, moduleId: string) => {
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const module = newPermissions.environments[envId]?.modules[moduleId];
    if (module) {
      const newSelected = !module.selected;
      module.selected = newSelected;
      if (newSelected) {
        module.permissions.READ_MODULE = true;
        module.accessAll = true;
      } else {
        Object.keys(module.configs).forEach((confId: string) => {
          module.configs[confId].selected = false;
        });
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleConfig = (userId: string, envId: string, moduleId: string, configId: string) => {
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
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
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
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
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const env = newPermissions.environments[envId];
    if (env) {
      const isReadPermission = permission === "READ_ENVIRONMENT";
      const newValue = !env.permissions[permission];
      
      env.permissions[permission] = newValue;
      
      if (!isReadPermission && newValue) {
        env.permissions.READ_ENVIRONMENT = true;
      }
      
      if (isReadPermission && !newValue) {
        Object.keys(env.permissions).forEach(key => {
          if (key !== "READ_ENVIRONMENT") {
            env.permissions[key] = false;
          }
        });
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleModulePermission = (
    userId: string,
    envId: string,
    moduleId: string,
    permission: string
  ) => {
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const module = newPermissions.environments[envId]?.modules[moduleId];
    if (module) {
      const isReadPermission = permission === "READ_MODULE";
      const newValue = !module.permissions[permission];
      
      module.permissions[permission] = newValue;
      
      if (!isReadPermission && newValue) {
        module.permissions.READ_MODULE = true;
      }
      
      if (isReadPermission && !newValue) {
        Object.keys(module.permissions).forEach(key => {
          if (key !== "READ_MODULE") {
            module.permissions[key] = false;
          }
        });
      }
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
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const config = newPermissions.environments[envId]?.modules[moduleId]?.configs[configId];
    if (config) {
      const isReadPermission = permission === "READ_CONFIG";
      const newValue = !config.permissions[permission];
      
      config.permissions[permission] = newValue;
      
      if (!isReadPermission && newValue) {
        config.permissions.READ_CONFIG = true;
      }
      
      if (isReadPermission && !newValue) {
        Object.keys(config.permissions).forEach(key => {
          if (key !== "READ_CONFIG") {
            config.permissions[key] = false;
          }
        });
      }
    }
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleSelectAllEnvironments = (userId: string) => {
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const allSelected = Object.values(newPermissions.environments).every((env: any) => env.selected);
    Object.keys(newPermissions.environments).forEach(envId => {
      newPermissions.environments[envId].selected = !allSelected;
      if (!allSelected) {
        newPermissions.environments[envId].permissions.READ_ENVIRONMENT = true;
      }
    });
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleSelectAllModules = (userId: string, envId: string) => {
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const env = newPermissions.environments[envId];
    const allSelected = Object.values(env.modules).every((mod: any) => mod.selected);
    Object.keys(env.modules).forEach(moduleId => {
      env.modules[moduleId].selected = !allSelected;
      if (!allSelected) {
        env.modules[moduleId].permissions.READ_MODULE = true;
      }
    });
    onUpdateUserPermissions(userId, newPermissions);
  };

  const toggleSelectAllConfigs = (userId: string, envId: string, moduleId: string) => {
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
    const module = newPermissions.environments[envId]?.modules[moduleId];
    if (!module || !module.configs) return;
    const allSelected = Object.values(module.configs).every((config: any) => config.selected);
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
    const newPermissions = JSON.parse(JSON.stringify(userPermissions[userId]));
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

  const canAssign = canAssignUsers;
  const isSuperAdmin = currentUserRole === "superadmin" || canAssignAdmins;

  const permissionOptions = {
    environment: [
      { key: "CREATE_MODULE", label: "Create Module", icon: Plus },
      { key: "READ_ENVIRONMENT", label: "Read", icon: Eye },
      { key: "UPDATE_ENVIRONMENT", label: "Update", icon: Edit },
      { key: "DELETE_ENVIRONMENT", label: "Delete", icon: Trash2 }
    ],
    module: [
      { key: "CREATE_CONFIG", label: "Create Config", icon: Plus },
      { key: "READ_MODULE", label: "Read", icon: Eye },
      { key: "UPDATE_MODULE", label: "Update", icon: Edit },
      { key: "DELETE_MODULE", label: "Delete", icon: Trash2 }
    ],
    config: [
      { key: "READ_CONFIG", label: "Read", icon: Eye },
      { key: "UPDATE_CONFIG", label: "Update", icon: Edit },
      { key: "DELETE_CONFIG", label: "Delete", icon: Trash2 }
    ]
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        {/* Header with gradient accent */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Select Users</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose users to assign permissions</p>
            </div>
          </div>
          <div className="bg-blue-50 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-sm font-semibold text-blue-600">{selectedUsers.length} selected</span>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No users available</p>
            <p className="text-xs text-gray-400 mt-1">Add users to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map((user) => (
              <div key={user._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 group">
                {/* User Header */}
                <div
                  className="flex items-center px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent cursor-pointer bg-white transition-all"
                  onClick={() => onToggleUserExpand(user._id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleUserSelection(user._id);
                    }}
                    className="mr-4 flex-shrink-0"
                    disabled={!canAssign}
                  >
                    {selectedUsers.includes(user._id) ? (
                      <CheckSquare className={`${canAssign ? "text-blue-600" : "text-gray-400"} transition-all`} size={22} />
                    ) : (
                      <Square className={`${canAssign ? "text-gray-400" : "text-gray-300"}`} size={22} />
                    )}
                  </button>
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <span className="text-white text-sm font-bold">
                        {user.firstname?.charAt(0).toUpperCase()}{user.lastname?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">
                          {user.firstname} {user.lastname}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin" ? "bg-blue-100 text-blue-700" :
                          user.role === "superadmin" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                    </div>
                  </div>
                  
                  {expandedUsers[user._id] ? (
                    <ChevronDown size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>

                {/* Permissions Panel */}
                {expandedUsers[user._id] && selectedUsers.includes(user._id) && (
                  <div className="border-t border-gray-100 p-5 bg-gradient-to-br from-gray-50 to-white">
                    {/* Role Preset Dropdown */}
                    <div className="mb-6">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Quick Role Preset
                      </label>
                      <select
                        value={selectedRolePreset[user._id] || ""}
                        onChange={(e) => applyRolePreset(user._id, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Custom Configuration</option>
                        <option value="admin">Admin (Full Access without Delete)</option>
                        <option value="lead">Lead (Create & Read)</option>
                        <option value="dev">Developer (Update & Read)</option>
                        <option value="user">User (Read Only)</option>
                      </select>
                    </div>

                    {/* Global Select All Button */}
                    {canAssign && (
                      <div className="mb-5 flex justify-end">
                        <button
                          onClick={() => toggleSelectAllEnvironments(user._id)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-md transition-all font-medium"
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
                          <div key={env._id} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                            {/* Environment Header */}
                            <div
                              className={`flex items-center px-5 py-3 ${envData.selected ? "bg-gradient-to-r from-blue-50/30 to-transparent cursor-pointer hover:bg-blue-50/50" : "bg-gray-50 cursor-not-allowed opacity-70"}`}
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
                              <FolderTree size={18} className="text-gray-500 mr-2" />
                              <span className="font-semibold text-gray-800 flex-1">{env.name}</span>

                              {/* Permission Checkboxes - Modern Design */}
                              <div className="flex items-center gap-2 mr-4">
                                {permissionOptions.environment
                                  .filter(opt => isSuperAdmin || !opt.key.startsWith("DELETE_"))
                                  .map((opt) => {
                                    const isEnabled = envData.permissions[opt.key];
                                    const isDisabled = !envData.selected || !canAssign;
                                    const isRead = opt.key === "READ_ENVIRONMENT";
                                    const isDependentDisabled = !isRead && !envData.permissions.READ_ENVIRONMENT;

                                    return (
                                      <label
                                        key={opt.key}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                          isEnabled && !isDisabled
                                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-500"
                                        } ${isDisabled || isDependentDisabled ? "opacity-40 cursor-not-allowed" : "hover:border-blue-300 hover:shadow-sm"}`}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                                          isEnabled ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                                        }`}>
                                          {isEnabled && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                        </div>
                                        <input
                                          type="checkbox"
                                          checked={isEnabled}
                                          onChange={() => toggleEnvironmentPermission(user._id, env._id, opt.key)}
                                          disabled={isDisabled || isDependentDisabled}
                                          className="hidden"
                                        />
                                        <span className="text-xs font-medium whitespace-nowrap">{opt.label}</span>
                                      </label>
                                    );
                                  })}
                              </div>

                              <div className="flex items-center gap-3 mr-4">
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-gray-400 font-medium uppercase">All Modules</span>
                                  <IOSSwitch
                                    sx={{ m: 1 }}
                                    checked={Object.values(envData.modules).every(m => m.selected)}
                                    disabled={!canAssign}
                                    onChange={() => {
                                      if (canAssign) {
                                        toggleSelectAllModules(user._id, env._id);
                                      }
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                                  {selectedModulesCount}/{totalModulesCount}
                                </span>
                              </div>

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
                              <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <Settings size={16} className="text-gray-500" />
                                    Modules
                                  </h4>
                                  {canAssign && (
                                    <button
                                      onClick={() => toggleSelectAllModules(user._id, env._id)}
                                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all"
                                    >
                                      {Object.values(envData.modules).every(m => m.selected)
                                        ? "Deselect All"
                                        : "Select All"}
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {env.modules.map((module) => {
                                    const moduleData = envData.modules[module._id];
                                    if (!moduleData) return null;

                                    const selectedConfigsCount = Object.values(moduleData.configs).filter(c => c.selected).length;
                                    const totalConfigsCount = Object.values(moduleData.configs).length;

                                    return (
                                      <div key={module._id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                        {/* Module Header */}
                                        <div
                                          className={`flex items-center px-4 py-3 ${moduleData.selected ? "bg-gradient-to-r from-blue-50/20 to-transparent cursor-pointer hover:bg-blue-50/30" : "bg-gray-50 opacity-70 cursor-not-allowed"}`}
                                          onClick={() => {
                                            if (moduleData.selected && canAssign) {
                                              toggleModuleExpand(module._id);
                                            }
                                          }}
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (canAssign) {
                                                toggleModule(user._id, env._id, module._id);
                                              }
                                            }}
                                            className="mr-3"
                                            disabled={!canAssign}
                                          >
                                            {moduleData.selected ? (
                                              <CheckSquare className="text-blue-600" size={18} />
                                            ) : (
                                              <Square className="text-gray-400" size={18} />
                                            )}
                                          </button>
                                          <FolderTree size={16} className="text-gray-500 mr-2" />
                                          <span className="font-medium text-gray-800 flex-1">{module.moduleName}</span>

                                          {/* Module Permission Checkboxes */}
                                          <div className="flex items-center gap-2 mr-4">
                                            {permissionOptions.module
                                              .filter(opt => isSuperAdmin || !opt.key.startsWith("DELETE_"))
                                              .map((opt) => {
                                                const isEnabled = moduleData.permissions[opt.key];
                                                const isDisabled = !moduleData.selected || !canAssign;
                                                const isRead = opt.key === "READ_MODULE";
                                                const isDependentDisabled = !isRead && !moduleData.permissions.READ_MODULE;

                                                return (
                                                  <label
                                                    key={opt.key}
                                                    onClick={(e) => e.stopPropagation()}
                                                    
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                                      isEnabled && !isDisabled
                                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                                        : "bg-white border-gray-200 text-gray-500"
                                                    } ${isDisabled || isDependentDisabled ? "opacity-40 cursor-not-allowed" : "hover:border-blue-300"}`}
                                                  >
                                                    <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                                                      isEnabled ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                                                    }`}>
                                                      {isEnabled && <div className="w-1 h-1 bg-white rounded-sm" />}
                                                    </div>
                                                    <input
                                                      type="checkbox"
                                                      checked={isEnabled}
                                                      onChange={() => toggleModulePermission(user._id, env._id, module._id, opt.key)}
                                                      disabled={isDisabled || isDependentDisabled}
                                                      className="hidden"
                                                    />
                                                    <span className="text-xs font-medium whitespace-nowrap">{opt.label}</span>
                                                  </label>
                                                );
                                              })}
                                          </div>

                                          {moduleData.selected && (
                                            <div className="mr-3">
                                              <span className="text-[10px] text-gray-400 font-medium uppercase">All Configs</span>
                                              <IOSSwitch
                                                sx={{ m: 1 }}
                                                checked={moduleData.accessAll}
                                                disabled={!canAssign}
                                                onChange={(e: { target: { checked: boolean; }; }) => {
                                                  if (canAssign) {
                                                    toggleAccessAll(user._id, env._id, module._id, e.target.checked);
                                                  }
                                                }}
                                              />
                                            </div>
                                          )}

                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-3">
                                            {selectedConfigsCount}/{totalConfigsCount}
                                          </span>

                                          {moduleData.selected ? (
                                            moduleData.accessAll ? (
                                              <div className="w-5" />
                                            ) : expandedModules[module._id] ? (
                                              <ChevronDown
                                                size={16}
                                                className={`text-gray-500 ${canAssign ? "cursor-pointer" : "cursor-not-allowed"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (canAssign) {
                                                    toggleModuleExpand(module._id);
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <ChevronRight
                                                size={16}
                                                className={`text-gray-500 ${canAssign ? "cursor-pointer" : "cursor-not-allowed"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (canAssign) {
                                                    toggleModuleExpand(module._id);
                                                  }
                                                }}
                                              />
                                            )
                                          ) : (
                                            <ChevronRight size={16} className="text-gray-300 cursor-not-allowed" />
                                          )}
                                        </div>

                                        {/* Config Entries */}
                                        {expandedModules[module._id] && !moduleData.accessAll && (
                                          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Key size={14} className="text-gray-500" />
                                                Configuration Keys
                                              </h5>
                                              {canAssign && (
                                                <button
                                                  onClick={() => toggleSelectAllConfigs(user._id, env._id, module._id)}
                                                  className="px-2.5 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all"
                                                >
                                                  {Object.values(moduleData.configs).every(c => c.selected)
                                                    ? "Deselect All"
                                                    : "Select All"}
                                                </button>
                                              )}
                                            </div>

                                            <div className="space-y-2">
                                              {module.configEntries?.map((config) => {
                                                const configData = moduleData.configs[config._id];
                                                if (!configData) return null;

                                                return (
                                                  <div key={config._id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                                                    <div className="flex items-center flex-1 min-w-0">
                                                      <button
                                                        onClick={() => {
                                                          if (canAssign) {
                                                            toggleConfig(user._id, env._id, module._id, config._id);
                                                          }
                                                        }}
                                                        className="mr-3"
                                                        disabled={!canAssign}
                                                      >
                                                        {configData.selected ? (
                                                          <CheckSquare className="text-blue-600" size={16} />
                                                        ) : (
                                                          <Square className="text-gray-400" size={16} />
                                                        )}
                                                      </button>
                                                      <FileText size={14} className="text-gray-500 mr-2" />
                                                      <span className="text-sm font-mono text-gray-700 truncate">{config.key}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      {permissionOptions.config
                                                        .filter(opt => isSuperAdmin || !opt.key.startsWith("DELETE_"))
                                                        .map((opt) => {
                                                          const isEnabled = configData.permissions[opt.key];
                                                          const isDisabled = !configData.selected || !canAssign;
                                                          const isRead = opt.key === "READ_CONFIG";
                                                          const isDependentDisabled = !isRead && !configData.permissions.READ_CONFIG;

                                                          return (
                                                            <label
                                                              key={opt.key}
                                                              onClick={(e) => e.stopPropagation()}
                                                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                                                isEnabled && !isDisabled
                                                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                                                  : "bg-white border-gray-200 text-gray-500"
                                                              } ${isDisabled || isDependentDisabled ? "opacity-40 cursor-not-allowed" : "hover:border-blue-300"}`}
                                                            >
                                                              <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                                                                isEnabled ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                                                              }`}>
                                                                {isEnabled && <div className="w-1 h-1 bg-white rounded-sm" />}
                                                              </div>
                                                              <input
                                                                type="checkbox"
                                                                checked={isEnabled}
                                                                onChange={() => toggleConfigPermission(user._id, env._id, module._id, config._id, opt.key)}
                                                                disabled={isDisabled || isDependentDisabled}
                                                                className="hidden"
                                                              />
                                                              <span className="text-xs font-medium whitespace-nowrap">{opt.label}</span>
                                                            </label>
                                                          );
                                                        })}
                                                    </div>
                                                  </div>
                                                );
                                              })}
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
