import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../../lib/auth";
import RoleGuard from "../../Components/RoleGuard";
import Button from "../../Components/ui/Button";
import AlertDialog from "../../Components/ui/AlertDialog";

interface User {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "superadmin" | "admin" | "user";
  isActive: boolean;
}

interface Project {
  _id: string;
  title: string;
  description?: string;
  assignedTo?: string[];
  assignedToNames?: string[];
}

export default function AssignProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedUserDetails = users.filter((u) => selectedUsers.includes(u._id));

  const fetchProject = async () => {
    try {
      const res = await authFetch(`http://localhost:8000/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setSelectedUsers(data.assignedTo || []);
      }
    } catch (err) {
      setErrorMessage("Failed to fetch project");
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch("http://localhost:8000/api/users");
      if (res.ok) {
        const data = await res.json();
        let filteredUsers = data.filter((user: User) => user.isActive);

        if (currentUser.role === "superadmin") {
          filteredUsers = filteredUsers.filter((user: User) => user.role !== "superadmin");
        } else if (currentUser.role === "admin") {
          filteredUsers = filteredUsers.filter((user: User) => user.role === "user");
        }

        setUsers(filteredUsers);
      }
    } catch (err) {
      setErrorMessage("Failed to fetch users");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [projectId]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAssignProject = async () => {
    if (selectedUsers.length === 0) {
      setErrorMessage("Please select at least one user");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authFetch(`http://localhost:8000/api/projects/${projectId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setSuccessMessage("Project assigned successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await res.json();
        setErrorMessage(error.message || "Failed to assign project");
      }
    } catch (err) {
      setErrorMessage("Server error occurred");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!["admin", "superadmin"].includes(currentUser.role)) {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto mt-6">
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold">
            Access Denied: Only Admins and Superadmins can assign projects
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin", "superadmin"]}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Assign Project</h1>
            {project && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700">{project.title}</h2>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
            )}
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Role-Based Assignment:</span> You can assign this
              project to:
            </p>
            <ul className="mt-2 ml-4 space-y-1 text-blue-700 text-sm">
              {currentUser.role === "superadmin" && (
                <>
                  <li>
                    - <span className="font-semibold">Admins</span> - Full access to project
                    management
                  </li>
                  <li>
                    - <span className="font-semibold">Users</span> - Limited access for viewing and
                    collaboration
                  </li>
                </>
              )}
              {currentUser.role === "admin" && (
                <li>
                  - <span className="font-semibold">Users</span> - Limited access for viewing and
                  collaboration
                </li>
              )}
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Select Users/Admins to Assign
            </label>

            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users available</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-100"
                    onClick={() => toggleUserSelection(user._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-800">
                        {user.firstname} {user.lastname}
                        <span className="ml-2 text-xs px-2 py-1 rounded font-medium bg-gray-200">
                          {user.role}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={loading || selectedUsers.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Project"}
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
            >
              Cancel
            </Button>
          </div>

          {showConfirm && (
            <AlertDialog
              title="Confirm Assignment"
              message={`Are you sure you want to assign this project to ${selectedUsers.length} user(s)?`}
              onConfirm={handleAssignProject}
              onCancel={() => setShowConfirm(false)}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Selected Users ({selectedUserDetails.length})
            </h3>
            {selectedUserDetails.length > 0 ? (
              <div className="space-y-2">
                {selectedUserDetails.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between border border-blue-100 bg-blue-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        {user.firstname} {user.lastname}
                      </p>
                      <p className="text-xs text-blue-700">{user.email}</p>
                    </div>
                    <button
                      onClick={() => toggleUserSelection(user._id)}
                      className="text-blue-700 hover:text-blue-900 font-bold px-2"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No users selected yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Currently Assigned To</h3>
            {project?.assignedToNames && project.assignedToNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.assignedToNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No users currently assigned.</p>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
