import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Calendar, 
  User, 
  FileText, 
  Edit,
  Trash2,
  Eye,
  Shield,
  ChevronRight,
  Building2,
  Clock,
  Grid3x3,
  List
} from "lucide-react";
import { authFetch } from "../../../lib/auth";
import AddProjectDialog from "./AddProjectDialog";
import PermissionGuard from "../../../Components/admin/PermissionGuard";
import { PERMISSIONS } from "../../../userModel/User";
import { hasPermission } from "../../../lib/permissions";

interface Project {
  _id: string;
  title: string;
  createdAt: string;
  createdByName: string;
  UploadedFile?: string;
}

export default function Projects() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canViewAllProjects = hasPermission(currentUser, PERMISSIONS.VIEW_ALLPROJECT);
  const canReadAssignedProjects = hasPermission(currentUser, PERMISSIONS.READ_PROJECT);

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  /* ================= FETCH PROJECTS ================= */
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await authFetch("http://localhost:8000/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      const visibleProjects = canViewAllProjects
        ? data
        : data.filter(
            (project: Project & { assignedTo?: string[] }) =>
              Array.isArray(project.assignedTo) &&
              project.assignedTo.some((id) => id?.toString() === currentUser.id?.toString())
          );

      setProjects(visibleProjects);
      setFilteredProjects(visibleProjects);
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

  const stats = {
    total: projects.length,
    recent: projects.filter(p => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    withFiles: projects.filter(p => p.UploadedFile).length,
  };

  if (!canViewAllProjects && !canReadAssignedProjects) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">You do not have permission to view projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-6 p-6">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="relative px-8 py-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            </div>
            
            <div className="relative flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Building2 size={32} className="text-white/90" />
                  Company Projects
                </h1>
                <p className="text-blue-100 mt-2">Manage and organize all your development projects</p>
              </div>
              
              <div className="flex gap-3">
                {/* View Toggle */}
                <div className="flex bg-white/20 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-md transition ${viewMode === "table" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
                    title="Table View"
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
                    title="Grid View"
                  >
                    <List size={18} />
                  </button>
                </div>
                
                {/* Add Project Button */}
                <PermissionGuard requiredPermission={PERMISSIONS.CREATE_PROJECT}>
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setOpen(true);
                    }}
                    className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
                  >
                    <Plus size={18} />
                    Add Project
                  </button>
                </PermissionGuard>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Projects</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <FolderOpen size={24} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Recent Projects</p>
                    <p className="text-2xl font-bold text-white">{stats.recent}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Clock size={24} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">With Files</p>
                    <p className="text-2xl font-bold text-white">{stats.withFiles}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <FileText size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SEARCH & FILTERS ================= */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            <button
              onClick={fetchProjects}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* ================= PROJECTS TABLE/GRID ================= */}
        
        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attachment</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-500">Loading projects...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <FolderOpen size={48} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No projects found</p>
                        {(search) && (
                          <button
                            onClick={() => setSearch("")}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Clear search
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project, index) => (
                      <tr
                        key={project._id}
                        onClick={() => navigate(`/project/${project._id}`)}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                      >
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <FolderOpen size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                {project.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">Click to view details</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {new Date(project.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{project.createdByName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {project.UploadedFile ? (
                            <a
                              href={project.UploadedFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Eye size={14} />
                              View File
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">No file</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <PermissionGuard requiredPermission={PERMISSIONS.UPDATE_PROJECT}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(project);
                                }}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Project"
                              >
                                <Edit size={18} />
                              </button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermission={PERMISSIONS.DELETE_PROJECT}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(project._id);
                                }}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete Project"
                              >
                                <Trash2 size={18} />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            {!loading && filteredProjects.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{filteredProjects.length}</span> of <span className="font-semibold">{projects.length}</span> projects
                  </p>
                  <div className="flex items-center gap-2">
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Click any row to view details</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
                <FolderOpen size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No projects found</p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => navigate(`/project/${project._id}`)}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="relative">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                        <PermissionGuard requiredPermission={PERMISSIONS.UPDATE_PROJECT}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(project);
                            }}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard requiredPermission={PERMISSIONS.DELETE_PROJECT}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project._id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                        <FolderOpen size={28} className="text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition mb-2">
                        {project.title}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar size={14} className="flex-shrink-0" />
                          <span>{new Date(project.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <User size={14} className="flex-shrink-0" />
                          <span className="truncate">{project.createdByName}</span>
                        </div>
                        {project.UploadedFile && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <FileText size={14} className="flex-shrink-0" />
                            <a
                              href={project.UploadedFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline text-sm"
                            >
                              View Attachment
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Click to view details</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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

// Helper component for refresh icon
function RefreshCw({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
