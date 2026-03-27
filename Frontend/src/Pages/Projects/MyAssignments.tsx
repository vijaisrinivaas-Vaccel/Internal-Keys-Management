import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/auth";
import { hasPermission, PERMISSIONS } from "../../lib/permissions";
import { 
  FolderOpen, 
  Calendar, 
  User, 
  Briefcase,
  Clock,
  AlertCircle,
  ArrowRight,
  Users
} from "lucide-react";

interface Project {
  _id: string;
  title: string;
  description?: string;
  createdByName: string;
  createdAt: string;
}

export default function MyAssignments() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canViewMyAssignments =
    hasPermission(currentUser, PERMISSIONS.VIEW_MYASSIGNMENT) &&
    hasPermission(currentUser, PERMISSIONS.READ_PROJECT);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch projects assigned to current user
  const fetchMyAssignments = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await authFetch("http://localhost:8000/api/projects");
      if (res.ok) {
        const allProjects = await res.json();
        // Filter projects assigned to current user
        const assignedProjects = allProjects.filter(
          (project: any) =>
            project.assignedTo?.includes(currentUser.id) ||
            project.assignedTo?.some((id: string) => id === currentUser.id)
        );
        setProjects(assignedProjects);
      } else {
        setErrorMessage("Failed to fetch assignments");
      }
    } catch (err) {
      setErrorMessage("Server error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAssignments();
  }, []);

  // Calculate stats
  const stats = {
    total: projects.length,
    recent: projects.filter(p => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
  };

  if (!canViewMyAssignments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">You do not have permission to view assignments.</p>
        </div>
      </div>
    );
  }

  return (
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
                  <Briefcase size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">My Assigned Projects</h1>
                  <p className="text-blue-100 mt-1">
                    Projects that have been assigned to you for access and collaboration
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Assigned</p>
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
            <p className="text-gray-500 mt-4">Loading your assignments...</p>
          </div>
        )}

        {/* No Assignments */}
        {!loading && projects.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">No projects assigned to you yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Wait for an admin to assign projects to you
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02]"
              >
                {/* Card Header - Gradient Banner */}
                <div className="relative h-32 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all"></div>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative h-full flex items-center px-6">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <FolderOpen size={24} className="text-white" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg font-bold text-white truncate">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">
                          Assigned
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Description */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Description
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {project.description || "No description provided"}
                    </p>
                  </div>

                  {/* Created By */}
                  <div className="mb-4 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={12} className="text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created By
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {project.createdByName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {project.createdByName}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-700 transition-colors">
                      <span className="text-xs font-medium">Open Project</span>
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Card Footer - Hover Effect Bar */}
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
