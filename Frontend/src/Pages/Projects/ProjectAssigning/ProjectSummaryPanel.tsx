import type { SelectedPermissions } from "./AssignProject";
import { Users, Building2, UserCheck, AlertCircle, CheckCircle, XCircle } from "lucide-react";

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
      {/* Project Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Project Details</h2>
          </div>
        </div>
        {project && (
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 text-lg">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{project.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Selected Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-green-600" />
              <h3 className="font-semibold text-gray-800">Selected Users</h3>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {selectedUserDetails.length} user{selectedUserDetails.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {selectedUserDetails.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {selectedUserDetails.map((user) => {
              const hasPermissions = userPermissions[user._id] && 
                Object.values(userPermissions[user._id].environments).some(e => e.selected);
              
              return (
                <div key={user._id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user.firstname?.charAt(0)}{user.lastname?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.firstname} {user.lastname}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleUserExpand(user._id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {expandedUsers[user._id] ? "Hide Details" : "View Details"}
                    </button>
                  </div>

                  {/* Quick Summary of Assigned Permissions */}
                  {userPermissions[user._id] && (
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-2">
                        {hasPermissions ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <AlertCircle size={12} className="text-gray-400" />
                        )}
                        <p className="text-xs font-medium text-gray-500">
                          {hasPermissions ? "Assigned Access:" : "No permissions assigned"}
                        </p>
                      </div>
                      
                      {hasPermissions && (
                        <div className="space-y-2">
                          {Object.entries(userPermissions[user._id].environments)
                            .filter(([_, envData]) => envData.selected)
                            .map(([envId, envData]) => {
                              const environment = environments.find(e => e._id === envId);
                              const envPermissions = Object.entries(envData.permissions)
                                .filter(([_, value]) => value)
                                .map(([perm]) => perm);
                              
                              return (
                                <div key={envId} className="border-l-2 border-green-500 pl-3">
                                  <p className="text-sm font-medium text-gray-700">
                                    {environment?.name || envId}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {envPermissions.map(perm => (
                                      <span key={perm} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        {perm.replace(/_/g, ' ').toLowerCase()}
                                      </span>
                                    ))}
                                  </div>
                                  
                                  {/* Module Summary */}
                                  <div className="mt-2 space-y-1">
                                    {Object.entries(envData.modules)
                                      .filter(([_, modData]) => modData.selected)
                                      .slice(0, 2)
                                      .map(([moduleId, modData]) => (
                                        <div key={moduleId} className="text-xs text-gray-600 flex items-center gap-1">
                                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                          <span>Module: {moduleId.substring(0, 8)}...</span>
                                          <span className="text-gray-400">
                                            ({Object.values(modData.permissions).filter(Boolean).length} perms)
                                          </span>
                                        </div>
                                      ))}
                                    {Object.entries(envData.modules).filter(([_, modData]) => modData.selected).length > 2 && (
                                      <p className="text-xs text-gray-400">
                                        +{Object.entries(envData.modules).filter(([_, modData]) => modData.selected).length - 2} more modules
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No users selected yet</p>
            <p className="text-xs text-gray-400 mt-1">Select users from the left panel to assign permissions</p>
          </div>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-500" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
          <XCircle size={18} className="text-red-500" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}