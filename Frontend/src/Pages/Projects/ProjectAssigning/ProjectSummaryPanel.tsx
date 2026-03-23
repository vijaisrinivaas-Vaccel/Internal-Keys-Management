import type { SelectedPermissions } from "./AssignProject";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface Project {
  _id: string;
  title: string;
  description?: string;
}

interface Environment {
  _id: string;
  name: string;
}

interface ProjectSummaryPanelProps {
  project: Project | null;
  users: User[];
  environments: Environment[];
  selectedUsers: string[];
  userPermissions: Record<string, SelectedPermissions>;
  expandedUsers: Record<string, boolean>;
  onToggleUserExpand: (userId: string) => void;
  successMessage: string;
  errorMessage: string;
}

export default function ProjectSummaryPanel({
  project,
  users,
  environments,
  selectedUsers,
  userPermissions,
  expandedUsers,
  onToggleUserExpand,
  successMessage,
  errorMessage
}: ProjectSummaryPanelProps) {
  
  const selectedUserDetails = users.filter((u) => selectedUsers.includes(u._id));

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Project Details</h2>
        {project && (
          <div>
            <h3 className="font-medium text-gray-800">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Selected Users Summary */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Selected Users ({selectedUserDetails.length})
        </h3>
        {selectedUserDetails.length > 0 ? (
          <div className="space-y-4">
            {selectedUserDetails.map((user) => (
              <div key={user._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">
                      {user.firstname} {user.lastname}
                      <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {user.role}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onToggleUserExpand(user._id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {expandedUsers[user._id] ? "Show less" : "Configure"}
                  </button>
                </div>

                {/* Quick Summary of Assigned Permissions */}
                {userPermissions[user._id] && (
                  <div className="text-sm">
                    <p className="text-xs font-medium text-gray-500 mb-1">Assigned Access:</p>
                    
                    {/* Environment Summary */}
                    <div className="space-y-2">
                      {Object.entries(userPermissions[user._id].environments)
                        .filter(([_, envData]) => envData.selected)
                        .map(([envId, envData]) => {
                          const environment = environments.find(e => e._id === envId);
                          return (
                            <div key={envId} className="border-l-2 border-green-500 pl-3">
                              <p className="text-sm font-medium text-gray-700">
                                {environment?.name || envId}
                              </p>
                              
                              {/* Module Summary */}
                              <div className="ml-2 mt-1 space-y-1">
                                {Object.entries(envData.modules)
                                  .filter(([_, modData]) => modData.selected)
                                  .map(([moduleId, modData]) => (
                                    <div key={moduleId} className="text-xs text-gray-600 flex items-center gap-1">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                      <span>Module: {moduleId.substring(0, 8)}...</span>
                                      <span className="text-gray-400">
                                        ({Object.values(modData.permissions).filter(Boolean).length} perms)
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* If no environments selected */}
                    {Object.values(userPermissions[user._id].environments).filter(e => e.selected).length === 0 && (
                      <p className="text-xs text-gray-400 italic">No environments assigned</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No users selected yet.</p>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}