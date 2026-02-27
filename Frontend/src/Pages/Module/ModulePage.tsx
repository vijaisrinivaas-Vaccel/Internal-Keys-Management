import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth";
import { Delbutton } from "../../Components/ui/Button";
import { fetchModules } from "../../Service/module.service";
import { ArrowLeft } from "lucide-react";


interface Project {
  _id: string;
  title: string;
  totalKeys?: number;
}

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [moduleName, setModuleName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  /* ================= LOAD PROJECTS ================= */
  const fetchProjects = async () => {
    const res = await authFetch(`http://localhost:8000/api/projects/by-module?moduleId=${moduleId}`);

    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
  };

  /* ================= DELETE MODULE ================= */
  const handleDelete = async () => {
    if (!moduleId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this module?"
    );

    if (!confirmDelete) return;

    const res = await authFetch(
      `http://localhost:8000/api/modules/${moduleId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      alert("Module deleted successfully!");
      navigate("/projects");
    } else {
      alert("Failed to delete module.");
    }
  };

  useEffect(() => {
    fetchModules().then((modules) => {
      const mod = modules.find((m: { _id: string | undefined; }) => m._id === moduleId);
      if (mod) setModuleName(mod.moduleName);
    });
    fetchProjects();
  }, [moduleId]);


  return (
    <div >
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        
        <h1 className="text-3xl font-bold">{moduleName} Module</h1>
      </div>

        <Delbutton onClick={handleDelete}>
          Delete Module
        </Delbutton>
      </div>

      {/* PROJECT TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden mb-6">

        {/* Header */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 text-sm font-semibold text-gray-500 border-b">
          <div>S.No</div>
          <div>Title</div>
          <div>Total Keys</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-500">
            No projects found
          </div>
        )}

        {/* Rows */}
        {projects.map((project, index) => (
          <div
            key={project._id}
            className="grid grid-cols-4 gap-4 px-6 py-4 border-b text-sm items-center"
          >
            <div>{index + 1}</div>
        
            <div className="font-medium">{project.title}</div>
        
            <div>
              {project.totalKeys ?? 0}
            </div>
        
            <div className="flex justify-center">
              <button
                onClick={() =>
                  navigate(`/module/${moduleId}/project/${project._id}`)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Go To Keys
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
