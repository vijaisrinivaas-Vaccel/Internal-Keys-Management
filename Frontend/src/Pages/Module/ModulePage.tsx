import { useEffect, useState, useRef } from "react";
import { authFetch } from "../../lib/auth";
import { MoreVertical, Plus } from "lucide-react";
import AddModuleDialog from "./AddModuleDialog";
import ConfirmationDialog from "../../Components/common/ConfirmationDialog";

import PermissionGuard from "../../Components/admin/PermissionGuard";
import { PERMISSIONS } from "../../userModel/User";


interface Props {
  projectId: string;
  environmentId: string;
  onSelectModule: (id: string, name: string) => void;
}

interface Module {
  _id: string;
  moduleName: string;
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

  /* ================= FETCH MODULES ================= */
  const fetchModules = async () => {
    if (!projectId || !environmentId) return;

    const res = await authFetch(
      `http://localhost:8000/api/modules?projectId=${projectId}&environmentId=${environmentId}`
    );

    if (res.ok) {
      const data = await res.json();
      setModules(data);

      // ✅ Auto select first module
      if (data.length > 0) {
        setActiveModule(data[0]._id);
        onSelectModule(data[0]._id, data[0].moduleName);
      }
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
  if (!deleteId) return;

  const res = await authFetch(
    `http://localhost:8000/api/modules/${deleteId}`,
    { method: "DELETE" }
  );

  const data = await res.json();

  if (res.ok) {
    fetchModules();
    setOpenMenu(null);
  } else {
    alert(data.message);
  }

  setConfirmOpen(false);
  setDeleteId(null);
};

  /* ================= RENAME ================= */
  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;

    const res = await authFetch(
      `http://localhost:8000/api/modules/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleName: renameValue }),
      }
    );

    if (res.ok) {
      fetchModules();
      setRenamingId(null);
      setRenameValue("");
    }
  };

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchModules();
  }, [projectId, environmentId]);

  return (
    <div className="bg-white rounded-2xl shadow-lg w-full">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <span className="font-semibold text-lg">Modules</span>

        <PermissionGuard requiredPermission={PERMISSIONS.CREATE_MODULE}>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={16} />
            Create
          </button>
        </PermissionGuard>
      </div>

      {/* Empty */}
      {modules.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No modules found
        </div>
      )}

      {/* List */}
      {modules.map((module) => (
        <div
          key={module._id}
          className={`flex justify-between items-center px-6 py-4 border-t border-slate-200 transition
          ${activeModule === module._id ? "bg-blue-100 text-gray-800" : "hover:bg-gray-100"}`}
          onClick={() => {
                setActiveModule(module._id);
                onSelectModule(module._id, module.moduleName);
              }}
        >
          {/* Module Name / Rename */}
          {renamingId === module._id ? (
            <div className="flex gap-2 w-full">
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="border px-2 py-1 rounded w-full text-sm"
              />
              <button
                onClick={() => handleRename(module._id)}
                className="text-blue-600 text-sm"
              >
                Save
              </button>
            </div>
          ) : (
            <span
              className="font-medium cursor-pointer text-gray-600 hover:text-blue-500"
            >
              {module.moduleName}
            </span>
          )}

          {/* 3 Dots */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() =>
                setOpenMenu(openMenu === module._id ? null : module._id)
              }
              className={`p-2 rounded-lg transition 
                ${openMenu === module._id 
                  ? "bg-gray-200" 
                  : "hover:bg-gray-100"}`}
            >
              <MoreVertical size={18} className="text-gray-600" />
            </button>
                
            {openMenu === module._id && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
                {/* Rename */}
                <PermissionGuard requiredPermission={PERMISSIONS.UPDATE_MODULE}>
                  <button
                    onClick={() => {
                      setRenamingId(module._id);
                      setRenameValue(module.moduleName);
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    ✏️ Rename
                  </button>
                </PermissionGuard>
                
                {/* Divider */}
                <div className="border-t border-slate-200" />
                
                {/* Delete */}
                <PermissionGuard requiredPermission={PERMISSIONS.DELETE_MODULE}>
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
                </PermissionGuard>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Create Dialog */}
      <AddModuleDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={fetchModules}
        projectId={projectId}
        environmentId={environmentId}
      />
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