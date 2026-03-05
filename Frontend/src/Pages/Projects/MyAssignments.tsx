import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/auth";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">My Assigned Projects</h1>
        <p className="text-gray-600 mt-2">
          Projects that have been assigned to you for access and collaboration
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500">Loading your assignments...</p>
        </div>
      )}

      {/* No Assignments */}
      {!loading && projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">
            No projects assigned to you yet
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Wait for an admin to assign projects to you
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => navigate(`/project/${project._id}`)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-linear-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white truncate">
                  {project.title}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-semibold mb-1">
                    Description
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {project.description || "No description provided"}
                  </p>
                </div>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 font-semibold mb-1">
                    Created By
                  </p>
                  <p className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {project.createdByName}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Assigned
                  </span>
                </div>
              </div>

              {/* Card Footer - Action */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/project/${project._id}`);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                >
                  Open Project
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
