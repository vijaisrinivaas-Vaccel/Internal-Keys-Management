import { useState, useRef, useEffect } from "react";
import { 
  MoreVertical, 
  Check, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  FolderTree,
  Loader2
} from "lucide-react";
import { authFetch } from "../../../lib/auth";
import { usePermissions } from "../../../Components/hooks/usePermissions";
import { PERMISSIONS } from "../../../userModel/User";
import { hasEnvironmentAccessByName } from "../../../lib/permissions";

interface Environment {
  _id: string;
  name: string;
}

interface Props {
  environments: Environment[];
  selectedEnvironment: string;
  setSelectedEnvironment: (id: string) => void;
  refresh: () => void;
  projectId: string;
}

export default function EnvironmentSelect({
  environments,
  selectedEnvironment,
  setSelectedEnvironment,
  refresh,
  projectId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [value, setValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { hasPermission, userRole, loading } = usePermissions(projectId);
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMenuOpenId(null);
        setRenamingId(null);
        setCreating(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter environments based on READ permission
  const accessibleEnvironments = environments.filter(env =>
    userRole === "superadmin" ||
    (
      hasPermission(PERMISSIONS.READ_ENVIRONMENT, env._id) &&
      hasEnvironmentAccessByName(currentUser, env.name)
    )
  );

  useEffect(() => {
    if (loading) return;

    if (!selectedEnvironment && accessibleEnvironments.length > 0) {
      setSelectedEnvironment(accessibleEnvironments[0]._id);
      return;
    }

    const selectedStillAccessible = accessibleEnvironments.some(
      (env) => env._id === selectedEnvironment
    );

    if (selectedEnvironment && !selectedStillAccessible) {
      setSelectedEnvironment(accessibleEnvironments[0]?._id || "");
    }
  }, [loading, accessibleEnvironments, selectedEnvironment, setSelectedEnvironment]);

  if (loading) {
    return (
      <div className="relative w-full">
        <button disabled className="w-full flex justify-between items-center bg-gray-100 rounded-xl px-4 py-3 text-gray-400 cursor-wait">
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading environments...
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  if (accessibleEnvironments.length === 0 && userRole !== "superadmin") {
    return (
      <div className="relative w-full">
        <button disabled className="w-full flex justify-between items-center bg-gray-100 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed">
          <span>No access to environments</span>
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  const canCreateAny = hasPermission(PERMISSIONS.CREATE_ENVIRONMENT);
  const canUpdate = (envId: string) => {
    const envName = environments.find((env) => env._id === envId)?.name;
    return (
      hasPermission(PERMISSIONS.UPDATE_ENVIRONMENT, envId) &&
      hasEnvironmentAccessByName(currentUser, envName)
    );
  };
  const canDelete = (envId: string) => {
    const envName = environments.find((env) => env._id === envId)?.name;
    return (
      hasPermission(PERMISSIONS.DELETE_ENVIRONMENT, envId) &&
      hasEnvironmentAccessByName(currentUser, envName)
    );
  };

  const selectedEnvName = accessibleEnvironments.find(e => e._id === selectedEnvironment)?.name || "Select Environment";

  const handleCreate = async () => {
    if (!value.trim()) return;

    const res = await authFetch("http://localhost:8000/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value, projectId }),
    });

    if (res.ok) {
      const newEnv = await res.json();
      setSelectedEnvironment(newEnv._id);
      setValue("");
      setCreating(false);
      refresh();
    }
  };

  const handleRename = async (id: string) => {
    if (!value.trim()) return;

    await authFetch(`http://localhost:8000/api/environments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value }),
    });

    setRenamingId(null);
    setValue("");
    refresh();
  };

  const handleDelete = async (id: string) => {
    await authFetch(`http://localhost:8000/api/environments/${id}`, {
      method: "DELETE",
    });

    setMenuOpenId(null);
    refresh();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
      >
        <span className={`font-medium ${selectedEnvName === "Select Environment" ? "text-gray-500" : "text-gray-800"}`}>
          {selectedEnvName}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute mt-2 w-full min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl z-[60] overflow-visible animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Environment List */}
          <div className="overflow-visible">
            {accessibleEnvironments.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FolderTree size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No environments available</p>
              </div>
            ) : (
              accessibleEnvironments.map((env) => {
                const canUpdateThis = canUpdate(env._id);
                const canDeleteThis = canDelete(env._id);
                const showMenu = canUpdateThis || canDeleteThis;

                return (
                  <div
                    key={env._id}
                    className={`group flex items-center justify-between px-4 py-2.5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all cursor-pointer ${
                      selectedEnvironment === env._id ? "bg-blue-50/30 border-l-4 border-blue-500" : ""
                    }`}
                    onClick={() => {
                      setSelectedEnvironment(env._id);
                      setOpen(false);
                    }}
                  >
                    {renamingId === env._id ? (
                      <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(env._id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <Check
                            size={14}
                            className={`text-blue-600 transition-opacity ${
                              selectedEnvironment === env._id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <span className={`text-sm ${selectedEnvironment === env._id ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                            {env.name}
                          </span>
                        </div>

                        {showMenu && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === env._id ? null : env._id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                            >
                              <MoreVertical size={16} className="text-gray-400" />
                            </button>

                            {menuOpenId === env._id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {canUpdateThis && (
                                  <button
                                    onClick={() => {
                                      setRenamingId(env._id);
                                      setValue(env.name);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                                  >
                                    <Edit2 size={14} className="text-blue-600" />
                                    Rename
                                  </button>
                                )}
                                {canUpdateThis && canDeleteThis && (
                                  <div className="border-t border-gray-100" />
                                )}
                                {canDeleteThis && (
                                  <button
                                    onClick={() => handleDelete(env._id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Create New Section */}
          {canCreateAny && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              {creating ? (
                <div className="flex gap-2 px-4 py-3">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Environment name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setValue("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition flex items-center gap-2 font-medium"
                  onClick={() => {
                    setCreating(true);
                    setValue("");
                  }}
                >
                  <Plus size={16} />
                  Create New Environment
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
