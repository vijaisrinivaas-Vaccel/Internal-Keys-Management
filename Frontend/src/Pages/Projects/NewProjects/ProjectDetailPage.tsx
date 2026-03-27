import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authFetch } from "../../../lib/auth";
import ModulePage from "../../Module/ModulePage";
import ConfigPage from "../../Module/ConfigPage/ConfigPage";
import EnvironmentSelect from "./EnvironmentSelect";
import { PERMISSIONS } from "../../../userModel/User";
import { usePermissions } from "../../../Components/hooks/usePermissions";
import { 
  ArrowLeftIcon, 
  FolderOpen, 
  Users, 
  Settings,
  ChevronRight,
  Building2,
  Shield,
  AlertCircle
} from "lucide-react";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedModuleName, setSelectedModuleName] = useState<string>("");
  const [selectedModuleIsParent, setSelectedModuleIsParent] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { hasPermission: hasProjectPermission, loading: permissionLoading } = usePermissions(projectId || "");

  /* ================= FETCH PROJECT ================= */
  const fetchProject = async () => {
    if (!projectId) return;

    try {
      const res = await authFetch(
        `http://localhost:8000/api/projects/${projectId}`
      );

      if (res.ok) {
        const data = await res.json();
        setProjectName(data.title);
      } else if (res.status === 401 || res.status === 403) {
        setError("You don't have access to this project");
      }
    } catch (err) {
      setError("Failed to fetch project");
    }
  };

  /* ================= FETCH ENVIRONMENTS ================= */
  const fetchEnvironments = async () => {
    if (!projectId) return;

    try {
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
    } catch (err) {
      console.error("Failed to fetch environments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchEnvironments();
  }, [projectId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-6 p-6">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="relative px-8 py-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            </div>
            
              <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition backdrop-blur-sm group"
                >
                  <ArrowLeftIcon size={20} className="text-white group-hover:scale-110 transition-transform" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {loading ? "Loading..." : projectName}
                  </h1>
                  <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                    <Building2 size={14} />
                    Project Overview
                  </p>
                </div>
              </div>
              
              {!permissionLoading && hasProjectPermission(PERMISSIONS.ASSIGN_USER) && (
                <Link
                  to={`/project/${projectId}/assign`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-medium shadow-lg"
                >
                  <Users size={18} />
                  Assign Project
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT SIDE - Environment & Modules */}
          <div className="lg:col-span-1 space-y-6">
            {/* Environment Select Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible relative z-20">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FolderOpen size={18} className="text-blue-600" />
                  <h2 className="font-semibold text-gray-800">Environment</h2>
                </div>
              </div>
              <div className="p-4">
                <EnvironmentSelect
                  environments={environments}
                  selectedEnvironment={selectedEnvironment}
                  setSelectedEnvironment={(id) => {
                    setSelectedEnvironment(id);
                  }}
                  refresh={fetchEnvironments}
                  projectId={projectId!}
                />
              </div>
            </div>

            {/* Modules Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible relative z-10">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-purple-600" />
                  <h2 className="font-semibold text-gray-800">Modules</h2>
                </div>
              </div>
              <div className="p-4">
                {selectedEnvironment ? (
                  <ModulePage
                    projectId={projectId!}
                    environmentId={selectedEnvironment}
                    onSelectModule={(moduleId: string, moduleName: string, isParent: boolean) => {
                      setSelectedModule(moduleId);
                      setSelectedModuleName(moduleName);
                      setSelectedModuleIsParent(isParent);
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FolderOpen size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {loading ? "Loading..." : "Select an environment first"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Configurations */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-green-600" />
                  <h2 className="font-semibold text-gray-800">Configurations</h2>
                </div>
              </div>
              <div className="p-5">
                {selectedModule ? (
                  <ConfigPage
                    projectId={projectId!}
                    environmentId={selectedEnvironment}
                    moduleId={selectedModule}
                    moduleName={selectedModuleName}
                    isParent={selectedModuleIsParent}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings size={28} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">
                      {loading ? "Loading..." : "Select a module to view configurations"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Choose an environment and module from the left panel
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
