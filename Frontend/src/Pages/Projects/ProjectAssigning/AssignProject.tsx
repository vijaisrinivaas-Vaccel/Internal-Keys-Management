import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../../../lib/auth";
import RoleGuard from "../../../Components/RoleGuard";
import Button from "../../../Components/ui/Button";
import AlertDialog from "../../../Components/ui/AlertDialog";
import UserSelectionPanel from "./UserSelectionPanel";
import ProjectSummaryPanel from "./ProjectSummaryPanel";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

interface User {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "superadmin" | "admin" | "user";
  isActive: boolean;
}

interface Project {
  _id: string;
  title: string;
  description?: string;
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

export interface PermissionState {
  [key: string]: boolean;
}

export interface SelectedPermissions {
  environments: {
    [envId: string]: {
      selected: boolean;
      permissions: PermissionState;
      modules: {
        [moduleId: string]: {
          selected: boolean;
          accessAll?: boolean;
          permissions: PermissionState;
          configs: {
            [configId: string]: {
              selected: boolean;
              permissions: PermissionState;
            };
          };
        };
      };
    };
  };
}

export default function AssignProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  
  // Permission states for each user
  const [userPermissions, setUserPermissions] = useState<Record<string, SelectedPermissions>>({});
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const fetchProject = async () => {
    try {
      const res = await authFetch(`http://localhost:8000/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      setErrorMessage("Failed to fetch project");
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch("http://localhost:8000/api/users");
      if (res.ok) {
        const data = await res.json();
        let filteredUsers = data.filter((user: User) => user.isActive);

        if (currentUser.role === "superadmin") {
          filteredUsers = filteredUsers.filter((user: User) => user.role !== "superadmin");
        } else if (currentUser.role === "admin") {
          filteredUsers = filteredUsers.filter((user: User) => user.role === "user");
        }

        setUsers(filteredUsers);
      }
    } catch (err) {
      setErrorMessage("Failed to fetch users");
      console.error(err);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await authFetch(`http://localhost:8000/api/environments?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Fetch modules for each environment
        const envsWithModules = await Promise.all(
          data.map(async (env: any) => {
            const modulesRes = await authFetch(
              `http://localhost:8000/api/modules?projectId=${projectId}&environmentId=${env._id}`
            );
            const modules = modulesRes.ok ? await modulesRes.json() : [];
            
            // Fetch configs for each module
            const modulesWithConfigs = await Promise.all(
              modules.map(async (mod: any) => {
                const configsRes = await authFetch(
                  `http://localhost:8000/api/config?projectId=${projectId}&environmentId=${env._id}&moduleId=${mod._id}`
                );
                const configs = configsRes.ok ? await configsRes.json() : [];
                return {
                  ...mod,
                  configEntries: configs[0]?.entries || []
                };
              })
            );
            
            return {
              ...env,
              modules: modulesWithConfigs
            };
          })
        );
        
        setEnvironments(envsWithModules);
        return envsWithModules;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch environments:", err);
      return [];
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSelected = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      
      // Initialize permissions for newly selected users
      if (!prev.includes(userId)) {
        initializeUserPermissions(userId);
      }
      
      return newSelected;
    });
  };

  const initializeUserPermissions = (userId: string) => {
    const initialPermissions: SelectedPermissions = {
      environments: {}
    };
    
    environments.forEach(env => {
      initialPermissions.environments[env._id] = {
        selected: false,
        permissions: {
          READ_ENVIRONMENT: true,
          UPDATE_ENVIRONMENT: false,
          DELETE_ENVIRONMENT: false,
          CREATE_MODULE: false
        },
        modules: {}
      };
      
      env.modules.forEach(module => {
        initialPermissions.environments[env._id].modules[module._id] = {
          selected: false,
          accessAll: false,
          permissions: {
            READ_MODULE: true,
            UPDATE_MODULE: false,
            DELETE_MODULE: false,
            CREATE_CONFIG: false
          },
          configs: {}
        };
        
        module.configEntries?.forEach(config => {
          initialPermissions.environments[env._id].modules[module._id].configs[config._id] = {
            selected: false,
            permissions: {
              READ_CONFIG: true,
              UPDATE_CONFIG: false,
              DELETE_CONFIG: false
            }
          };
        });
      });
    });
    
    setUserPermissions(prev => ({
      ...prev,
      [userId]: initialPermissions
    }));
  };

  const fetchExistingAssignments = async (fetchedEnvs: Environment[]) => {
    try {
      const res = await authFetch(
        `http://localhost:8000/api/projectPermission/projects/${projectId}/assigned-users`
      );
      
      if (res.ok) {
        const data = await res.json();
        
        // If there are assigned users, pre-select them and load their permissions
        if (data.assignedUsers && data.assignedUsers.length > 0) {
          const assignedUserIds = data.assignedUsers.map((u: any) => u._id);
          setSelectedUsers(assignedUserIds);
          
          // Convert the permissions data to your SelectedPermissions format
          const existingPermissions: Record<string, SelectedPermissions> = {};
          
          data.assignedUsers.forEach((user: any) => {
            const userPerms: SelectedPermissions = { environments: {} };
            
            // First, initialize all fetched environments with false/empty
            fetchedEnvs.forEach(env => {
              userPerms.environments[env._id] = {
                selected: false,
                permissions: {
                  READ_ENVIRONMENT: false,
                  UPDATE_ENVIRONMENT: false,
                  DELETE_ENVIRONMENT: false,
                  CREATE_MODULE: false
                },
                modules: {}
              };
              
              env.modules.forEach(module => {
                userPerms.environments[env._id].modules[module._id] = {
                  selected: false,
                  accessAll: false,
                  permissions: {
                    READ_MODULE: false,
                    UPDATE_MODULE: false,
                    DELETE_MODULE: false,
                    CREATE_CONFIG: false
                  },
                  configs: {}
                };
                
                module.configEntries?.forEach(config => {
                  userPerms.environments[env._id].modules[module._id].configs[config._id] = {
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
            
            // Overwrite with actual assigned permissions
            user.environments.forEach((env: any) => {
              if (userPerms.environments[env.environmentId]) {
                userPerms.environments[env.environmentId].selected = true;
                userPerms.environments[env.environmentId].permissions = {
                  READ_ENVIRONMENT: env.permissions.includes("READ_ENVIRONMENT"),
                  UPDATE_ENVIRONMENT: env.permissions.includes("UPDATE_ENVIRONMENT"),
                  DELETE_ENVIRONMENT: env.permissions.includes("DELETE_ENVIRONMENT"),
                  CREATE_MODULE: env.permissions.includes("CREATE_MODULE")
                };
                
                env.modules?.forEach((mod: any) => {
                  if (userPerms.environments[env.environmentId].modules[mod.moduleId]) {
                    userPerms.environments[env.environmentId].modules[mod.moduleId].selected = true;
                    userPerms.environments[env.environmentId].modules[mod.moduleId].accessAll = mod.accessAll || false;
                    userPerms.environments[env.environmentId].modules[mod.moduleId].permissions = {
                      READ_MODULE: mod.permissions.includes("READ_MODULE"),
                      UPDATE_MODULE: mod.permissions.includes("UPDATE_MODULE"),
                      DELETE_MODULE: mod.permissions.includes("DELETE_MODULE"),
                      CREATE_CONFIG: mod.permissions.includes("CREATE_CONFIG")
                    };
                    
                    mod.configEntries?.forEach((config: any) => {
                      if (userPerms.environments[env.environmentId].modules[mod.moduleId].configs[config.configId]) {
                        userPerms.environments[env.environmentId].modules[mod.moduleId].configs[config.configId].selected = true;
                        userPerms.environments[env.environmentId].modules[mod.moduleId].configs[config.configId].permissions = {
                          READ_CONFIG: config.permissions.includes("READ_CONFIG"),
                          UPDATE_CONFIG: config.permissions.includes("UPDATE_CONFIG"),
                          DELETE_CONFIG: config.permissions.includes("DELETE_CONFIG")
                        };
                      }
                    });
                  }
                });
              }
            });
            
            existingPermissions[user._id] = userPerms;
          });
          
          setUserPermissions(existingPermissions);
        }
      }
    } catch (err) {
      console.error("Error fetching existing assignments:", err);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchUsers();
    fetchEnvironments().then((envs) => {
      if (envs) {
        fetchExistingAssignments(envs);
      }
    });
  }, [projectId]);

  const updateUserPermissions = (userId: string, newPermissions: SelectedPermissions) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: newPermissions
    }));
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleAssignPermissions = async () => {
    if (selectedUsers.length === 0) {
      setErrorMessage("Please select at least one user");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Prepare permission data for each selected user
      const assignments = selectedUsers.map(userId => ({
        userId,
        environments: Object.entries(userPermissions[userId]?.environments || {})
          .filter(([_, envData]) => envData.selected)
          .map(([envId, envData]) => ({
            environmentId: envId,
            permissions: Object.entries(envData.permissions)
              .filter(([_, value]) => value)
              .map(([perm]) => perm),
            modules: Object.entries(envData.modules)
              .filter(([_, moduleData]) => moduleData.selected)
              .map(([moduleId, moduleData]) => ({
                moduleId,
                accessAll: moduleData.accessAll || false,
                permissions: Object.entries(moduleData.permissions)
                  .filter(([_, value]) => value)
                  .map(([perm]) => perm),
                configEntries: Object.entries(moduleData.configs)
                  .filter(([_, configData]) => configData.selected)
                  .map(([configId, configData]) => ({
                    configId,
                    permissions: Object.entries(configData.permissions)
                      .filter(([_, value]) => value)
                      .map(([perm]) => perm)
                  }))
              }))
          }))
      }));

      const res = await authFetch(`http://localhost:8000/api/projectPermission/projects/${projectId}/bulk-assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignments }),
      });

      if (res.ok) {
        setSuccessMessage("Permissions assigned successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await res.json();
        setErrorMessage(error.message || "Failed to assign permissions");
      }
    } catch (err) {
      setErrorMessage("Server error occurred");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!["admin", "superadmin"].includes(currentUser.role)) {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto mt-6">
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold">
            Access Denied: Only Admins and Superadmins can assign projects
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin", "superadmin"]}>
      <div className="flex justify-between items-center bg-white p-8 rounded-2xl mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition text-4xl"
        >
          <ArrowLeftIcon />
        </button>
        <h1 className="text-2xl font-bold">Assign Project Permissions</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Panel - User Selection */}
        <div className="lg:col-span-7">
          <UserSelectionPanel
            users={users}
            environments={environments}
            selectedUsers={selectedUsers}
            expandedUsers={expandedUsers}
            userPermissions={userPermissions}
            onToggleUserSelection={toggleUserSelection}
            onToggleUserExpand={toggleUserExpand}
            onUpdateUserPermissions={updateUserPermissions}
          />
        </div>

        {/* Right Panel - Summary */}
        <div className="lg:col-span-3">
          <ProjectSummaryPanel
            project={project}
            users={users}
            environments={environments}
            selectedUsers={selectedUsers}
            userPermissions={userPermissions}
            expandedUsers={expandedUsers}
            onToggleUserExpand={toggleUserExpand}
            successMessage={successMessage}
            errorMessage={errorMessage}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={loading || selectedUsers.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50"
        >
          {loading ? "Assigning..." : "Assign Permissions"}
        </Button>
      </div>

      {showConfirm && (
        <AlertDialog
          title="Confirm Assignment"
          message={`Are you sure you want to assign these permissions to ${selectedUsers.length} user(s)?`}
          onConfirm={handleAssignPermissions}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </RoleGuard>
  );
}