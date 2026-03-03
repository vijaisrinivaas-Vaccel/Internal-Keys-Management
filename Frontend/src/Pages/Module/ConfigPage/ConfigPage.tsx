import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth";
import ConfigEntryDialog from "./ConfigEntryDialog";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Delbutton, EditButton } from "../../../Components/ui/Button";
import ConfirmationDialog from "../../../Components/common/ConfirmationDialog";


interface Entry {
  _id: string;
  key: string;
  value: string;
  createdAt: string;
  keyStatus?: string;
}

interface ConfigResponse {
  _id: string;
  entries: Entry[];
}
interface Props {
  projectId: string;
  environmentId: string;
  moduleId: string;
}

export default function ConfigPage({ projectId, environmentId, moduleId, }: Props) {
  const [configs, setConfigs] = useState<ConfigResponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ================= FETCH ================= */
  const fetchConfigs = async () => {
    const res = await authFetch(
      `http://localhost:8000/api/config?projectId=${projectId}&environmentId=${environmentId}&moduleId=${moduleId}`
    );

    if (res.ok) {
      const data = await res.json();
      setConfigs(data);
    }
  };

  useEffect(() => {
    if (moduleId && environmentId && projectId) {
      fetchConfigs();
    }
  }, [projectId,environmentId , moduleId]);

  /* ================= COPY ================= */
  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  /* ================= EDIT ================= */
  const handleEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);

      const res = await authFetch(
        `http://localhost:8000/api/config/delEntry/${deleteId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
      } else {
        fetchConfigs();
      }

    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= STATUS COLOR ================= */
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "expired":
        return "text-red-600";
      case "near_expiry":
        return "text-yellow-600";
      case "new":
        return "text-blue-600";
      case "revoked":
        return "text-gray-500";
      default:
        return "text-green-600";
    }
  };

  const entries = configs.length > 0 ? configs[0].entries : [];

  return (
    <div >

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl">
        <h2 className="text-lg font-semibold">Configurations</h2>

        <button
          onClick={() => {
            setSelectedEntry(null);
            setDialogOpen(true);
            
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Config
        </button>
      </div>

        {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
          
        {/* HEADER ROW */}
        <div className="grid grid-cols-[30px_160px_2fr_100px_100px_100px] gap-4 px-6 py-4 text-sm font-semibold text-gray-500 ">
          <div>S.No</div>
          <div>Key</div>
          <div className="truncate text-center mr-25">Value</div>
          <div>Created</div>
          <div className="text-center">Status</div>
          <div className="text-center">Actions</div>
        </div>
          
        {/* EMPTY STATE */}
        {entries.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-500">
            No configuration entries yet
          </div>
        )}
      
        {/* DATA ROWS */}
        {entries.map((entry, index) => {
          const isVisible = visibleMap[entry._id] || false;
      
          return (
            <div
              key={entry._id}
              className="grid grid-cols-[30px_160px_2fr_100px_100px_100px] gap-4 px-6 py-4 border-t border-slate-200 text-sm items-center hover:bg-gray-50 transition"
            >
              {/* S.No */}
              <div>{index + 1}</div>
          
              {/* Key */}
              <div className="font-medium truncate">
                {entry.key}
              </div>
          
              {/* Value (Fixed width, no jumping) */}
              <div className="flex items-center gap-3 w-full justify-around">
                <span className="font-mono truncate  w-55 ">
                  {isVisible
                    ? entry.value
                    : "••••••••••••••••••••••••••••"}
                </span>
                  
                <div className="flex gap-2  transition">
                    <button
                  onClick={() =>
                    setVisibleMap((prev) => ({
                      ...prev,
                      [entry._id]: !isVisible,
                    }))
                  }
                  className="shrink-0 hover:text-blue-600"
                >
                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              
                <button
                  onClick={() => handleCopy(entry.value)}
                  className="shrink-0 hover:text-green-600"
                >
                  <Copy size={16} />
                </button>
                </div>
              </div>
              
              {/* Created Date */}
              <div>
                {new Date(entry.createdAt).toLocaleDateString()}
              </div>
              
              {/* Status Badge */}
              <div className={`text-center ${getStatusColor(entry.keyStatus)}`}>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    entry.keyStatus === "expired"
                      ? "bg-red-100 text-red-600"
                      : entry.keyStatus === "near_expiry"
                      ? "bg-yellow-100 text-yellow-700"
                      : entry.keyStatus === "new"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {entry.keyStatus || "active"}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 justify-center">
                <EditButton onClick={() => handleEdit(entry)} />
                <Delbutton
                  onClick={() => {
                    setDeleteId(entry._id);
                    setConfirmOpen(true);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* DIALOG */}
      <ConfigEntryDialog
        moduleId={moduleId!}
        projectId={projectId!}
        environmentId={environmentId!}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchConfigs}
        editEntry={selectedEntry}
      />
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Delete Configuration"
        message="Are you sure you want to delete this configuration key? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        disabled={isDeleting}
      />
    </div>
  );
}