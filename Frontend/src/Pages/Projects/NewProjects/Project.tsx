import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../../lib/auth";
import { EditButton, Delbutton } from "../../../Components/ui/Button";
import AddProjectDialog from "./AddProjectDialog";
import PermissionGuard from "../../../Components/admin/PermissionGuard";

import { PERMISSIONS } from "../../../userModel/User";

interface Project {
  _id: string;
  title: string;
  createdAt: string;
  createdByName: string;
  UploadedFile?: string;
}

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  /* ================= FETCH PROJECTS ================= */

  const fetchProjects = async () => {
    setLoading(true);

    try {
      const res = await authFetch("http://localhost:8000/api/projects");

      if (!res.ok) return;

      const data = await res.json();

      setProjects(data);
      setFilteredProjects(data);
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
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

  /* ================= EDIT ================= */

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: string) => {
    const res = await authFetch(`http://localhost:8000/api/projects/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    fetchProjects();
  };

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}

      <div className="flex justify-between items-center bg-white p-8 rounded-2xl">
        <h1 className="text-2xl font-bold">Company Projects</h1>

        <div className="flex gap-3">

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          />

          {/* ADD PROJECT */}

          <PermissionGuard requiredPermission={PERMISSIONS.CREATE_PROJECT}>
            <button
              onClick={() => {
                setSelectedProject(null);
                setOpen(true);
              }}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Project
            </button>
          </PermissionGuard>

        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">

        {/* TABLE HEADER */}

        <div className="grid grid-cols-7 gap-4 px-6 py-4 text-sm font-semibold text-gray-500  bg-gray-100">
          <div>S.No</div>
          <div>Title</div>
          <div>Created At</div>
          <div>Created By</div>
          <div>Upload</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="px-6 py-10 text-center text-gray-500">
            Loading projects...
          </div>
        )}

        {/* EMPTY */}

        {!loading && filteredProjects.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-500">
            No projects found
          </div>
        )}

        {/* ROWS */}

        {filteredProjects.map((project, index) => (
          <div
            key={project._id}
            className="grid grid-cols-7 gap-4 px-6 py-4 border-t border-blue-200 text-sm text-gray-700 hover:bg-blue-100 hover:text-black"
            onClick={() => navigate(`/project/${project._id}`)}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </a>
              ) : (
                "-"
              )}
            </div>

            {/* ACTIONS */}

            <div className="col-span-2 flex justify-center gap-3">

              {/* EDIT */}

              <PermissionGuard requiredPermission={PERMISSIONS.UPDATE_PROJECT}>
                <EditButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                />
              </PermissionGuard>

              {/* DELETE */}

              <PermissionGuard requiredPermission={PERMISSIONS.DELETE_PROJECT}>
                <Delbutton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project._id);
                  }}
                />
              </PermissionGuard>

            </div>
          </div>
        ))}
      </div>

      {/* ================= ADD / EDIT DIALOG ================= */}

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