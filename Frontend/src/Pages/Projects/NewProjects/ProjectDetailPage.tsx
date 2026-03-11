import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authFetch } from "../../../lib/auth";

import ModulePage from "../../Module/ModulePage";
import ConfigPage from "../../Module/ConfigPage/ConfigPage";
import EnvironmentSelect from "./EnvironmentSelect";

import PermissionGuard from "../../../Components/admin/PermissionGuard";
import { PERMISSIONS } from "../../../userModel/User";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedModuleName, setSelectedModuleName] = useState<string>("");

  /* ================= FETCH PROJECT ================= */
  const fetchProject = async () => {
    if (!projectId) return;

    const res = await authFetch(
      `http://localhost:8000/api/projects/${projectId}`
    );

    if (res.ok) {
      const data = await res.json();
      setProjectName(data.title);
    }
  };

  /* ================= FETCH ENVIRONMENTS ================= */
  const fetchEnvironments = async () => {
    if (!projectId) return;

    const res = await authFetch(
      `http://localhost:8000/api/environments?projectId=${projectId}`
    );

    if (res.ok) {
      const data = await res.json();
      setEnvironments(data);

      // Auto select first env if none selected
      if (data.length > 0 && !selectedEnvironment) {
        setSelectedEnvironment(data[0]._id);
      }
    }
  };

  useEffect(() => {
    fetchProject();
    fetchEnvironments();
  }, [projectId]);

  return (
    <div className="space-y-5">
      {/* ================= HEADER ================= */}
      <div className="bg-white p-8 rounded-2xl shadow flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          ←
        </button>

        <h1 className="text-2xl font-bold flex-1 text-center">
          {projectName}
        </h1>

        <PermissionGuard requiredPermission={PERMISSIONS.ASSIGN_USER}>
          <Link
            to={`/project/${projectId}/assign`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition inline-block"
          >
            Assign Project
          </Link>
        </PermissionGuard>
      </div>

      {/* ================= MAIN LAYOUT ================= */}
      <div className="grid grid-cols-4 gap-6">
        {/* LEFT SIDE */}
        <div className="col-span-1 space-y-6">
          {/* 🔥 NEW ENVIRONMENT SELECT (REPLACED OLD SELECT) */}
          <EnvironmentSelect
            environments={environments}
            selectedEnvironment={selectedEnvironment}
            setSelectedEnvironment={(id) => {
              setSelectedEnvironment(id);
              
            }}
            refresh={fetchEnvironments}
            projectId={projectId!}
            
          />

          {/* MODULE LIST */}
          {selectedEnvironment ? (
            <ModulePage
              projectId={projectId!}
              environmentId={selectedEnvironment}
              onSelectModule={(moduleId: string, moduleName: string) => {
                setSelectedModule(moduleId);
                setSelectedModuleName(moduleName);
              }}
            />
          ) : (
            <div className="bg-white rounded-xl shadow border p-6 text-center text-gray-500 text-sm">
              Select an environment first
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-3">
          {selectedModule ? (
            <ConfigPage
              projectId={projectId!}
              environmentId={selectedEnvironment}
              moduleId={selectedModule}
              moduleName={selectedModuleName}
            />
          ) : (
            <div className="bg-white rounded-xl shadow border p-10 text-center text-gray-500">
              Select a module to view configurations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}