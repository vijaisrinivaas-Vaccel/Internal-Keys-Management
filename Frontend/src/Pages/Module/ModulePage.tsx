import { useEffect, useState, useRef, useCallback } from "react";
import { authFetch } from "../../lib/auth";
import { MoreVertical, Plus, Edit2, Trash2, Star, FolderTree, Loader2, X } from "lucide-react";
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
      
      const accessibleModules = data.filter((module: Module) => {
        const hasRead = hasPermission(PERMISSIONS.READ_MODULE, environmentId, module._id);
        return hasRead;
      });
      
      setModules(accessibleModules);

      if (accessibleModules.length > 0) {
        if (activeModule && accessibleModules.some((m: { _id: string; }) => m._id === activeModule)) {
          // Keep current selection
        } else {
          setActiveModule(accessibleModules[0]._id);
          onSelectModule(accessibleModules[0]._id, accessibleModules[0].moduleName, accessibleModules[0].isParent || false);
        }
      } else {
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
    if (activeModule !== moduleId) {
      setActiveModule(moduleId);
      onSelectModule(moduleId, moduleName, isParent);
    }
  }, [activeModule, onSelectModule]);

  const handleCreateSuccess = useCallback(() => {
    fetchModules();
  }, [fetchModules]);

  if (permissionsLoading || isFetching) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-gray-500">Loading modules...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <X size={20} className="text-red-600" />
        </div>
        <p className="text-red-600 mb-3">Error: {fetchError}</p>
        <button 
          onClick={fetchModules}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
        <div className="flex justify-end items-center px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          {canCreate && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
            >
              <Plus size={14} />
              Add Module
            </button>
          )}
        </div>
        <div className="px-6 py-12 text-center">
          <FolderTree size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No modules found</p>
          {canCreate && (
            <button
              onClick={() => setOpen(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Create your first module
            </button>
          )}
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {modules.length} modules
        </div>
        {canCreate && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
          >
            <Plus size={14} />
            Add Module
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {modules.map((module) => {
          const canUpdateThis = canUpdate(module._id);
          const canDeleteThis = canDelete(module._id);
          const isActive = activeModule === module._id;

          return (
            <div
              key={module._id}
              className={`group flex items-center justify-between px-5 py-3 transition-all cursor-pointer ${
                isActive 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleModuleClick(module._id, module.moduleName, module.isParent || false)}
            >
              {renamingId === module._id ? (
                <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(module._id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-blue-500" : "bg-gray-300"}`} />
                    <span className={`font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                      {module.moduleName}
                    </span>
                    {module.isParent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                        <Star size={10} />
                        Parent
                      </span>
                    )}
                  </div>

                  {(canUpdateThis || canDeleteThis) && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === module._id ? null : module._id);
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          openMenu === module._id 
                            ? "bg-gray-100 text-gray-700" 
                            : "opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === module._id && (
                        <div 
                          className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
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
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                            >
                              <Edit2 size={14} className="text-blue-600" />
                              Rename
                            </button>
                          )}
                          {canUpdateThis && !module.isParent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetParent(module._id);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                            >
                              <Star size={14} className="text-amber-600" />
                              Set as Parent
                            </button>
                          )}
                          {canUpdateThis && canDeleteThis && (
                            <div className="border-t border-gray-100" />
                          )}
                          {canDeleteThis && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(module._id);
                                setConfirmOpen(true);
                                setOpenMenu(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
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
        })}
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
