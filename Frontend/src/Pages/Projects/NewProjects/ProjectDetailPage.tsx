import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../../../lib/auth";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../Components/ui/Select";

import ModulePage from "../../Module/ModulePage";
import ConfigPage from "../../Module/ConfigPage/ConfigPage";
import EnvSelectDialog from "./EnvSelectDialog";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-2xl font-bold flex-1 text-center">
          {projectName}
        </h1>

      </div>

      {/* ================= MAIN LAYOUT ================= */}
      <div className="grid grid-cols-4 gap-6">

        {/* LEFT SIDE — ENV + MODULES */}
        <div className="col-span-1 space-y-6">

          {/* ENVIRONMENT SELECT */}
          <div className="border-amber-50 mt-5">
            <Select
              value={selectedEnvironment}
              onValueChange={(value) => {
                if (value === "create_new") {
                  setEnvDialogOpen(true);
                  return;
                }
                setSelectedEnvironment(value);
                setSelectedModule(null); // reset module
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Environment" />
              </SelectTrigger>
            
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env._id} value={env._id}>
                    {env.name}
                  </SelectItem>
                ))}

                <SelectItem value="create_new">
                  + Create New
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
              
          {/* MODULE LIST */}
          {selectedEnvironment ? (
            <ModulePage
              projectId={projectId!}
              environmentId={selectedEnvironment}
              onSelectModule={(moduleId: string) =>
                setSelectedModule(moduleId)
              }
            />
          ) : (
            <div className="bg-white rounded-xl shadow border p-6 text-center text-gray-500 text-sm">
              Select an environment first
            </div>
          )}

        </div>
        
        {/* RIGHT SIDE — CONFIG */}
        <div className="col-span-3">
          {selectedModule ? (
            <ConfigPage
              projectId={projectId!}
              environmentId={selectedEnvironment}
              moduleId={selectedModule}
            />
          ) : (
            <div className="bg-white rounded-xl shadow border p-10 text-center text-gray-500">
              Select a module to view configurations
            </div>
          )}
        </div>
        
      </div>

      {/* ================= ENV DIALOG ================= */}
      <EnvSelectDialog
        open={envDialogOpen}
        onOpenChange={setEnvDialogOpen}
        projectId={projectId!}
        onSuccess={(newEnv) => {
          setEnvironments((prev) => [...prev, newEnv]);
          setSelectedEnvironment(newEnv._id);
        }}
      />
    </div>
  );
}