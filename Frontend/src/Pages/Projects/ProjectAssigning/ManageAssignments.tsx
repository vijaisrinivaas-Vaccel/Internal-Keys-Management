import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  User, 
  Briefcase, 
  ChevronRight,
  Plus,
  Eye,
  Clock,
  Building2,
  UserCheck,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { authFetch } from "../../../lib/auth";
import RoleGuard from "../../../Components/RoleGuard";
import { hasPermission, PERMISSIONS } from "../../../lib/permissions";

interface Project {
  _id: string;
  title: string;
  description?: string;
  createdByName: string;
  assignedTo?: string[];
  assignedToNames?: string[];
  createdAt: string;
}

export default function ManageAssignments() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canManageAssigning =
    hasPermission(currentUser, PERMISSIONS.VIEW_MANAGEASSIGNING) &&
    hasPermission(currentUser, PERMISSIONS.MANAGE_USERS);
  const canViewAllProjects = hasPermission(currentUser, PERMISSIONS.VIEW_ALLPROJECT);
  const canReadAssignedProjects = hasPermission(currentUser, PERMISSIONS.READ_PROJECT);
  const canAssignUsers = hasPermission(currentUser, PERMISSIONS.ASSIGN_USER);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch all projects
  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await authFetch("http://localhost:8000/api/projects");
      if (res.ok) {
        let data = await res.json();

        if (!canViewAllProjects && canReadAssignedProjects) {
          data = data.filter((project: Project) =>
            project.assignedTo?.includes(currentUser.id)
          );
        }
        
        setProjects(data);
      } else {
        setErrorMessage("Failed to fetch projects");
      }
    } catch (err) {
      setErrorMessage("Server error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Stats calculation
  const stats = {
    total: projects.length,
    assigned: projects.filter(p => p.assignedToNames && p.assignedToNames.length > 0).length,
    unassigned: projects.filter(p => !p.assignedToNames || p.assignedToNames.length === 0).length,
  };

  // Only admins and superadmins can access
  if (!canManageAssigning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">
            Access Denied
          </p>
          <p className="text-gray-500 mt-2">
            You do not have permission to manage assignments
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requiredPermissions={[PERMISSIONS.VIEW_MANAGEASSIGNING, PERMISSIONS.MANAGE_USERS]}
      requireAll
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="space-y-6 p-6">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
            <div className="relative px-8 py-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Users size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {currentUser.role === "superadmin"
                        ? "Manage Project Assignments"
                        : "My Assigned Projects"}
                    </h1>
                    <p className="text-blue-100 mt-1">
                      {currentUser.role === "superadmin"
                        ? "Assign projects to users and admins for controlled access"
                        : "Manage projects assigned to you by superadmins"}
                    </p>
                  </div>
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
                      <Building2 size={24} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Assigned Projects</p>
                      <p className="text-2xl font-bold text-white">{stats.assigned}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <UserCheck size={24} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Unassigned Projects</p>
                      <p className="text-2xl font-bold text-white">{stats.unassigned}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <UserPlus size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading projects...</p>
            </div>
          )}

          {/* Projects Table */}
          {!loading && projects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">
                {currentUser.role === "superadmin"
                  ? "No projects found"
                  : "No projects assigned to you yet"}
              </p>
              {currentUser.role === "superadmin" && (
                <button
                  onClick={() => navigate("/projects/new-project")}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={16} />
                  Create New Project
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((project) => (
                      <tr
                        key={project._id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Briefcase size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                {project.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {new Date(project.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                            {project.description || "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User size={14} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {project.createdByName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {project.assignedToNames && project.assignedToNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {project.assignedToNames.slice(0, 3).map((name, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                >
                                  <UserCheck size={10} />
                                  {name}
                                </span>
                              ))}
                              {project.assignedToNames.length > 3 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  +{project.assignedToNames.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                              <AlertCircle size={10} />
                              Not assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {canAssignUsers && (
                            <button
                              onClick={() => navigate(`/project/${project._id}/assign`)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                            >
                              <Users size={16} />
                              Assign
                              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              {projects.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-semibold">{projects.length}</span> project{projects.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <Eye size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Click Assign to manage permissions</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
