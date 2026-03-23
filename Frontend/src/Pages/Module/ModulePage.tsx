import { useEffect, useState, useRef, useCallback } from "react";
import { authFetch } from "../../lib/auth";
import { MoreVertical, Plus } from "lucide-react";
import AddModuleDialog from "./AddModuleDialog";
import ConfirmationDialog from "../../Components/common/ConfirmationDialog";
import { usePermissions } from "../../Components/hooks/usePermissions";
import { PERMISSIONS } from "../../userModel/User";

interface Props {
  projectId: string;
  environmentId: string;
  onSelectModule: (id: string, name: string, isParent: boolean) => void;
}

interface Module {
  _id: string;
  moduleName: string;
  description?: string;
  isParent?: boolean;
}

export default function ModulePage({
  projectId,
  environmentId,
  onSelectModule,
}: Props) {
  const [modules, setModules] = useState<Module[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const { hasPermission, loading: permissionsLoading } = usePermissions(projectId, environmentId);

  const fetchModules = useCallback(async () => {
    if (!projectId || !environmentId) {
      console.log("Missing projectId or environmentId");
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    
    try {
      const res = await authFetch(
        `http://localhost:8000/api/modules?projectId=${projectId}&environmentId=${environmentId}`
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to fetch modules" }));
        throw new Error(error.message || "Failed to fetch modules");
      }

      const data = await res.json();
      
      // Filter modules based on READ permission
      const accessibleModules = data.filter((module: Module) => {
        const hasRead = hasPermission(PERMISSIONS.READ_MODULE, environmentId, module._id);
        return hasRead;
      });
      
      setModules(accessibleModules);

      // Auto-select logic
      if (accessibleModules.length > 0) {
        // If current active module is still accessible, keep it
        if (activeModule && accessibleModules.some((m: { _id: string; }) => m._id === activeModule)) {
          // Keep current selection
        } else {
          // Select the first module
          setActiveModule(accessibleModules[0]._id);
          onSelectModule(accessibleModules[0]._id, accessibleModules[0].moduleName, accessibleModules[0].isParent || false);
        }
      } else {
        // No modules available
        setActiveModule(null);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch modules");
    } finally {
      setIsFetching(false);
    }
  }, [projectId, environmentId, hasPermission, onSelectModule, activeModule]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      const res = await authFetch(
        `http://localhost:8000/api/modules/${deleteId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete module");
        return;
      }

      // Clear active module if it was deleted
      if (activeModule === deleteId) {
        setActiveModule(null);
      }
      
      await fetchModules();
      setOpenMenu(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete module");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, fetchModules, activeModule]);

  const handleRename = useCallback(async (id: string) => {
    if (!renameValue.trim()) return;

    try {
      const res = await authFetch(
        `http://localhost:8000/api/modules/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleName: renameValue }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to rename module" }));
        alert(error.message);
        return;
      }

      await fetchModules();
      setRenamingId(null);
      setRenameValue("");
    } catch (err) {
      console.error("Rename error:", err);
      alert("Failed to rename module");
    }
  }, [renameValue, fetchModules]);

  const handleSetParent = useCallback(async (id: string) => {
    try {
      const res = await authFetch(
        `http://localhost:8000/api/modules/${id}/set-parent`,
        { method: "PUT" }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to set module as parent" }));
        alert(error.message);
        return;
      }

      await fetchModules();
      setOpenMenu(null);
    } catch (err) {
      console.error("Set parent error:", err);
      alert("Failed to set module as parent");
    }
  }, [fetchModules]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!permissionsLoading && projectId && environmentId) {
      fetchModules();
    }
  }, [projectId, environmentId, permissionsLoading, fetchModules]);

  const canCreate = hasPermission(PERMISSIONS.CREATE_MODULE, environmentId);
  const canUpdate = useCallback((moduleId: string) => 
    hasPermission(PERMISSIONS.UPDATE_MODULE, environmentId, moduleId), 
    [hasPermission, environmentId]
  );
  const canDelete = useCallback((moduleId: string) => 
    hasPermission(PERMISSIONS.DELETE_MODULE, environmentId, moduleId), 
    [hasPermission, environmentId]
  );

  const handleModuleClick = useCallback((moduleId: string, moduleName: string, isParent: boolean) => {
    
    // Only update if it's a different module
    if (activeModule !== moduleId) {
      setActiveModule(moduleId);
      onSelectModule(moduleId, moduleName, isParent);
    }
  }, [activeModule, onSelectModule]);

  const handleCreateSuccess = useCallback(() => {
    fetchModules();
  }, [fetchModules]);

  // Loading state
  if (permissionsLoading || isFetching) {
    return (
      <div className="bg-white rounded-2xl shadow-lg w-full p-6 text-center text-gray-500">
        Loading modules...
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="bg-white rounded-2xl shadow-lg w-full p-6 text-center text-red-600">
        Error: {fetchError}
        <button 
          onClick={fetchModules}
          className="block mx-auto mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (modules.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <span className="font-semibold text-lg">Modules</span>
          {canCreate && (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
            >
              <Plus size={16} /> Create
            </button>
          )}
        </div>
        <div className="px-6 py-8 text-center text-gray-500">
          No modules found
        </div>
        {canCreate && (
          <AddModuleDialog
            open={open}
            onOpenChange={setOpen}
            onSuccess={handleCreateSuccess}
            projectId={projectId}
            environmentId={environmentId}
          />
        )}
      </div>
    );
  }

  // Render modules
  return (
    <div className="bg-white rounded-2xl shadow-lg w-full">
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <span className="font-semibold text-lg">Modules</span>
        {canCreate && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={16} /> Create
          </button>
        )}
      </div>

      {modules.map((module) => {
        const canUpdateThis = canUpdate(module._id);
        const canDeleteThis = canDelete(module._id);
        const isActive = activeModule === module._id;

        return (
          <div
            key={module._id}
            className={`flex justify-between items-center px-6 py-4 border-t border-slate-200 transition cursor-pointer ${
              isActive ? "bg-blue-100 text-gray-800" : "hover:bg-gray-100"
            }`}
            onClick={() => handleModuleClick(module._id, module.moduleName, module.isParent || false)}
          >
            {renamingId === module._id ? (
              <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="border px-2 py-1 rounded w-full text-sm"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(module._id);
                  }}
                  className="text-blue-600 text-sm whitespace-nowrap"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">
                  {module.moduleName}
                </span>
                {module.isParent && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                    PARENT
                  </span>
                )}
              </div>
            )}

            {(canUpdateThis || canDeleteThis) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === module._id ? null : module._id);
                  }}
                  className={`p-2 rounded-lg transition ${
                    openMenu === module._id ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                >
                  <MoreVertical size={18} className="text-gray-600" />
                </button>

                {openMenu === module._id && (
                  <div 
                    className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                    ref={menuRef}
                  >
                    {canUpdateThis && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(module._id);
                          setRenameValue(module.moduleName);
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        ✏️ Rename
                      </button>
                    )}
                    {canUpdateThis && !module.isParent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetParent(module._id);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
                      >
                        🌟 Set as Parent
                      </button>
                    )}
                    {canUpdateThis && canDeleteThis && <div className="border-t border-slate-200" />}
                    {canDeleteThis && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(module._id);
                          setConfirmOpen(true);
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {canCreate && (
        <AddModuleDialog
          open={open}
          onOpenChange={setOpen}
          onSuccess={handleCreateSuccess}
          projectId={projectId}
          environmentId={environmentId}
        />
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Delete Module"
        message="Are you sure you want to delete this module? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}