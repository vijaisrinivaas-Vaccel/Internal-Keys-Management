import { useState, useRef, useEffect } from "react";
import { MoreVertical, Check, ChevronDown } from "lucide-react";
import { authFetch } from "../../../lib/auth";
import { usePermissions } from "../../../Components/hooks/usePermissions";
import { PERMISSIONS } from "../../../userModel/User";

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

  if (loading) {
    return (
      <div className="relative w-full">
        <button disabled className="w-full flex justify-between items-center border rounded-xl px-4 py-2 bg-gray-100 text-gray-400 cursor-wait">
          <span>Loading...</span>
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  // Filter environments based on READ permission
  const accessibleEnvironments = environments.filter(env =>
    userRole === "superadmin" || hasPermission(PERMISSIONS.READ_ENVIRONMENT, env._id)
  );

  if (accessibleEnvironments.length === 0 && userRole !== "superadmin") {
    return (
      <div className="relative w-full">
        <button disabled className="w-full flex justify-between items-center border rounded-xl px-4 py-2 bg-gray-100 text-gray-400 cursor-not-allowed">
          <span>No access to environments</span>
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  // ✅ FIXED: Separate permission checks
  const canCreateAny = hasPermission(PERMISSIONS.CREATE_ENVIRONMENT); // No envId needed
  const canUpdate = (envId: string) => hasPermission(PERMISSIONS.UPDATE_ENVIRONMENT, envId);
  const canDelete = (envId: string) => hasPermission(PERMISSIONS.DELETE_ENVIRONMENT, envId);

  const selectedEnvName = accessibleEnvironments.find(e => e._id === selectedEnvironment)?.name || "Select";

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
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center border rounded-xl px-4 py-2 bg-white shadow-sm hover:border-blue-400 transition"
      >
        <span>{selectedEnvName}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 overflow-visible">
          {accessibleEnvironments.map((env) => {
            const canUpdateThis = canUpdate(env._id);
            const canDeleteThis = canDelete(env._id);
            const showMenu = canUpdateThis || canDeleteThis;

            return (
              <div
                key={env._id}
                className="flex justify-between items-center px-3 py-2 hover:bg-gray-100 transition overflow-visible"
              >
                {renamingId === env._id ? (
                  <div className="flex gap-2 w-full">
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="border px-2 py-1 rounded w-full text-sm"
                    />
                    <button
                      onClick={() => handleRename(env._id)}
                      className="text-blue-600 text-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedEnvironment(env._id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        size={14}
                        className={`text-blue-600 ${
                          selectedEnvironment === env._id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span>{env.name}</span>
                    </div>

                    {showMenu && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === env._id ? null : env._id);
                          }}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpenId === env._id && (
                          <div className="absolute right-0 top-full mt-1 w-28 bg-white border rounded-lg shadow-md z-[999] overflow-visible">
                            {canUpdateThis && (
                              <button
                                onClick={() => {
                                  setRenamingId(env._id);
                                  setValue(env.name);
                                  setMenuOpenId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Rename
                              </button>
                            )}

                            {canDeleteThis && (
                              <>
                                {canUpdateThis && <div className="border-t border-slate-200" />}
                                <button
                                  onClick={() => handleDelete(env._id)}
                                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* ✅ FIXED: Create section uses canCreateAny */}
          {canCreateAny && (
            <div className="border-t border-slate-300 mt-1">
              {creating && (
                <div className="flex gap-2 px-3 py-2">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Environment name"
                    className="border px-2 py-1 rounded w-full text-sm"
                  />
                  <button onClick={handleCreate} className="text-blue-600 text-sm">
                    Save
                  </button>
                </div>
              )}

              {!creating && (
                <button
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setCreating(true);
                    setValue("");
                  }}
                >
                  + Create New
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}