import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth";
import ConfigEntryDialog from "./ConfigEntryDialog";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Delbutton, EditButton } from "../../../Components/ui/Button";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";


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

export default function ConfigPage( ) {
  const navigate = useNavigate();
  const { moduleId, projectId } = useParams();
  const [configs, setConfigs] = useState<ConfigResponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>({});

  /* ================= FETCH ================= */
  const fetchConfigs = async () => {
    const res = await authFetch(
      `http://localhost:8000/api/config?projectId=${projectId}&moduleId=${moduleId}`
    );

    if (res.ok) {
      const data = await res.json();
      setConfigs(data);
    }
  };

  useEffect(() => {
    if (moduleId && projectId) {
      fetchConfigs();
    }
  }, [projectId, moduleId]);

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
  const handleDelete = async (entryId: string) => {
    const confirmDelete = window.confirm("Delete this config?");
    if (!confirmDelete) return;

    await authFetch(`http://localhost:8000/api/config/entry/${entryId}`, {
      method: "DELETE",
    });

    fetchConfigs();
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
      {/* ================= BREADCRUMB ================= */}
      <div className="flex items-center gap-2 mb-2">

        {/* Left Side - Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition text-sm font-medium"
        >
          <span className="text-lg">←</span>
          Back
        </button>

        {/* Right Side - Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/projects" className="hover:text-blue-600 transition">
            Projects
          </Link>

          <span>/</span>

          <Link
            to={`/module/${moduleId}`}
            className="hover:text-blue-600 transition"
          >
            Module
          </Link>

          <span>/</span>

          <span className="text-gray-700 font-medium">
            Configurations
          </span>
        </div>
      </div>


      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
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
      <div className="bg-white rounded-xl shadow border overflow-hidden">
          
        {/* HEADER ROW */}
        <div className="grid grid-cols-[30px_160px_2fr_100px_100px_100px] gap-4 px-6 py-4 text-sm font-semibold text-gray-500 border-b">
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
              className="grid grid-cols-[30px_160px_2fr_100px_100px_100px] gap-4 px-6 py-4 border-b text-sm items-center hover:bg-gray-50 transition"
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
                <Delbutton onClick={() => handleDelete(entry._id)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* DIALOG */}
      <ConfigEntryDialog
        moduleId={moduleId!}
        projectId={projectId!}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchConfigs}
        editEntry={selectedEntry}
      />
    </div>
  );
}