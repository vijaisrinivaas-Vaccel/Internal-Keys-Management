import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../../lib/auth";
import RoleGuard from "../../../Components/RoleGuard";
import Button from "../../../Components/ui/Button";

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
        
        // If admin, filter to show only projects assigned to them
        if (currentUser.role === "admin") {
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

  // Only admins and superadmins can access
  if (!["admin", "superadmin"].includes(currentUser.role)) {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-6">
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold">
            Access Denied: Only Admins and Superadmins can manage assignments
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin", "superadmin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentUser.role === "superadmin"
              ? "Manage Project Assignments"
              : "My Assigned Projects"}
          </h1>
          <p className="text-gray-600 mt-2">
            {currentUser.role === "superadmin"
              ? "Assign projects to users and admins for controlled access"
              : "Manage projects assigned to you by superadmins"}
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
            <p className="text-gray-500">Loading projects...</p>
          </div>
        )}

        {/* Projects Table */}
        {!loading && projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500">
              {currentUser.role === "superadmin"
                ? "No projects found"
                : "No projects assigned to you yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Project Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Created By
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {project.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {project.description || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {project.createdByName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {project.assignedToNames && project.assignedToNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {project.assignedToNames.slice(0, 3).map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              {name}
                            </span>
                          ))}
                          {project.assignedToNames.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                              +{project.assignedToNames.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        onClick={() => navigate(`/project/${project._id}/assign`)}
                        variant="primary"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                      >
                        Assign
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
