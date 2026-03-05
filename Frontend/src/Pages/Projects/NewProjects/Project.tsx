import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth";
import { EditButton, Delbutton, ReadButton } from "../../../Components/ui/Button";
import AddProjectDialog from "./AddProjectDialog";
import { useNavigate } from "react-router-dom";
import RoleGuard from "../../../Components/RoleGuard";
import { permissions, type Role } from "../../../lib/permissions";


interface Project {
  _id: string;
  title: string;
  createdAt: string;
  createdByName: string;
  UploadedFile?: string;
}

export default function Projects() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate= useNavigate();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  

  /* ================= FETCH PROJECTS ================= */
  const fetchProjects = async () => {
    setLoading(true);

    const res = await authFetch("http://localhost:8000/api/projects");
    if (!res.ok) return;

    const data = await res.json();
    setProjects(data);
    setFilteredProjects(data);
    setLoading(false);
  };

  useEffect(() => {
  
    fetchProjects();
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [search, projects]);

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setOpen(true);
  };


  /* ================= DELETE ================= */
  const handleDelete = async (_id: string) => {
    const res = await authFetch(
      `http://localhost:8000/api/projects/${_id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) fetchProjects();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-2xl">
        <h1 className="text-2xl font-bold">Company Projects</h1>

        <div className="flex gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          />

          {/* Add Project */}
          {(user.role === "admin" || user.role === "superadmin") && (
            <button
            onClick={() => {
              setSelectedProject(null);
              setOpen(true);
            }}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Project
          </button>
          )}
          
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 px-6 py-4 text-sm font-semibold text-gray-500 border-b border-slate-200">
          <div>S.No</div>
          <div>Title</div>
          <div>Created At</div>
          <div>Created By</div>
          <div>Upload</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-6 py-10 text-center text-gray-500">
            Loading projects...
          </div>
        )}

        {/* Empty */}
        {!loading && filteredProjects.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-500">
            No projects found
          </div>
        )}

        {/* Rows */}
        {filteredProjects.map((project, index) => (
          <div
            key={project._id}
            className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-slate-200 text-sm"
          >
            <div>{index + 1}</div>

            <div className="font-medium">{project.title}</div>

            <div>
              {new Date(project.createdAt).toLocaleDateString()}
            </div>

            <div>{project.createdByName}</div>

            <div>
              {project.UploadedFile ? (
                <a
                  href={project.UploadedFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View
                </a>
              ) : (
                "-"
              )}
            </div>

            <div className="col-span-2 flex justify-center gap-3">
              <RoleGuard allowedRoles={permissions.forAdmins as Role[]}>
                <EditButton onClick={() => handleEdit(project)}/>
              </RoleGuard>

              <ReadButton onClick={() => navigate(`/project/${project._id}`)}/>
               
              <RoleGuard allowedRoles={permissions.forSuperadmin as Role[]}>
                <Delbutton onClick={() => handleDelete(project._id)}/>
              </RoleGuard>
            </div>
          </div>
        ))}
      </div>
      <AddProjectDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setSelectedProject(null);
        }}
        editData={selectedProject}
        onSuccess={fetchProjects}
      />
    </div>
  );
}