import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth";
import ProfilePage from "../../Components/profilepage/ProfilePage";
import CreateUserDialog from "../../Components/admin/CreateUserDialog";
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  MoreVertical, 
  Shield, 
  ShieldAlert, 
  ShieldUser, 
  ShieldOff, 
  UserPlus, 
  Trash2, 
  Crown,
  RefreshCw,
  Filter,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  employeeId: string;
  role: string;
  roleId: {
    _id: string;
    name: string;
  };
  jobRole?: string;
  jobLevel?: string;
  isActive: boolean;
}

interface Role {
  _id: string;
  name: string;
}

type PendingReasonAction =
  | { type: "status"; user: User }
  | { type: "delete"; user: User }
  | { type: "role"; user: User; newRoleId: string };

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [sortLevel, setSortLevel] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleChangeModal, setRoleChangeModal] = useState<{ user: User; open: boolean } | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [pendingReasonAction, setPendingReasonAction] = useState<PendingReasonAction | null>(null);
  const [reasonText, setReasonText] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch("http://localhost:8000/api/users");

      if (!res.ok) {
        setErrorMessage("Failed to fetch users");
        return;
      }

      const data = await res.json();
      let filtered = data;

      if (currentUser.role !== "superadmin") {
        filtered = data.filter((u: User) => u.role !== "superadmin");
      }

      setUsers(filtered);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage("Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await authFetch("http://localhost:8000/api/roles");
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const toggleStatus = async (user: User, reason: string) => {
    try {
      const res = await authFetch(`http://localhost:8000/api/users/${user._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to toggle status:", error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updateRole = async (userId: string, newRole: string, reason: string) => {
    if (currentUser.role !== "superadmin") {
      alert("Only superadmins can change roles");
      return;
    }

    setUpdatingRole(true);
    try {
      const res = await authFetch(`http://localhost:8000/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: newRole, reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to update role");
        return;
      }

      const updatedUser = await res.json();

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: updatedUser.role, roleId: updatedUser.roleId } : u))
      );

      setRoleChangeModal(null);
    } catch (err) {
      console.error(err);
      alert("Error updating role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string, reason: string) => {
    if (userId === currentUser.id) {
      alert("You cannot delete yourself.");
      return;
    }

    try {
      const res = await authFetch(`http://localhost:8000/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to delete user");
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
    }
  };

  const openReasonDialog = (action: PendingReasonAction) => {
    setPendingReasonAction(action);
    setReasonText("");
  };

  const closeReasonDialog = () => {
    setPendingReasonAction(null);
    setReasonText("");
  };

  const submitReasonAction = async () => {
    if (!pendingReasonAction) return;

    const reason = reasonText.trim();
    if (!reason) {
      alert("Reason is required.");
      return;
    }

    if (pendingReasonAction.type === "status") {
      await toggleStatus(pendingReasonAction.user, reason);
    } else if (pendingReasonAction.type === "delete") {
      await handleDeleteUser(
        pendingReasonAction.user._id,
        `${pendingReasonAction.user.firstname} ${pendingReasonAction.user.lastname}`,
        reason
      );
    } else if (pendingReasonAction.type === "role") {
      await updateRole(
        pendingReasonAction.user._id,
        pendingReasonAction.newRoleId,
        reason
      );
    }

    closeReasonDialog();
  };

  const openProfile = (user: User) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );

    if (selectedUser?._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        user.username.toLowerCase().includes(searchLower) ||
        user.firstname?.toLowerCase().includes(searchLower) ||
        user.lastname?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.employeeId.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
      if (filterRole && user.jobRole !== filterRole) return false;
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;

      return true;
    })
    .sort((a, b) => {
      if (!sortLevel) return 0;

      const levelOrder = { intern: 0, junior: 1, mid: 2, senior: 3, lead: 4 };
      const aLevel = a.jobLevel ? levelOrder[a.jobLevel as keyof typeof levelOrder] || 0 : 0;
      const bLevel = b.jobLevel ? levelOrder[b.jobLevel as keyof typeof levelOrder] || 0 : 0;

      return bLevel - aLevel;
    });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    roles: {
      user: users.filter(u => u.role === "user").length,
      admin: users.filter(u => u.role === "admin").length,
      superadmin: users.filter(u => u.role === "superadmin").length,
    }
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    switch (r) {
      case "superadmin":
        return <Crown size={16} className="text-purple-600" />;
      case "admin":
        return <ShieldUser size={16} className="text-blue-600" />;
      case "user":
        return <Shield size={16} className="text-orange-600" />;
      default:
        return <Shield size={16} className="text-green-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const r = role.toLowerCase();
    switch (r) {
      case "superadmin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "user":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getRoleAvatarBg = (role: string) => {
    const r = role.toLowerCase();
    switch (r) {
      case "superadmin":
        return "bg-purple-600";
      case "admin":
        return "bg-blue-600";
      case "user":
        return "bg-orange-600";
      default:
        return "bg-green-600";
    }
  };

  const formatJobRole = (role?: string) => {
    if (!role) return "-";
    return role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatJobLevel = (level?: string) => {
    if (!level) return "-";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-6 p-6">
        
        {/* HEADER SECTION */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="relative px-8 py-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            </div>
            
            <div className="relative flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Users size={28} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">User Management</h1>
                </div>
                <p className="text-blue-100 mt-1">
                  Manage developers in the system and monitor their access status.
                </p>
              </div>
              
              {(currentUser.role === "admin" || currentUser.role === "superadmin") && (
                <button
                  onClick={() => setCreateUserOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-medium shadow-lg"
                >
                  <UserPlus size={18} />
                  Create User
                </button>
              )}
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users size={24} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-white">{stats.active}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <UserCheck size={24} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Inactive Users</p>
                    <p className="text-2xl font-bold text-white">{stats.inactive}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <UserX size={24} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Admins</p>
                    <p className="text-2xl font-bold text-white">{stats.roles.admin + stats.roles.superadmin}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <ShieldAlert size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Job Roles</option>
              <option value="frontend_developer">Frontend Developer</option>
              <option value="backend_developer">Backend Developer</option>
              <option value="full_stack_developer">Full Stack Developer</option>
              <option value="devops_engineer">DevOps Engineer</option>
              <option value="software_developer">Software Developer</option>
            </select>

            <select
              value={sortLevel}
              onChange={(e) => setSortLevel(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Sort by Level</option>
              <option value="intern">Intern</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>

            <button
              onClick={fetchUsers}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading users...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredUsers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No users found</p>
            {(search || filterRole || sortLevel || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterRole("");
                  setSortLevel("");
                  setStatusFilter("all");
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* USER TABLE */}
        {!loading && filteredUsers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role & Level</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      onClick={() => openProfile(user)}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                    >
                      {/* USER INFO */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${getRoleAvatarBg(user.role)} shadow-md group-hover:scale-105 transition-transform`}>
                            {user.firstname?.charAt(0).toUpperCase()}
                            {user.lastname?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                              {user.firstname} {user.lastname}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              @{user.username}
                              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs border ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* JOB ROLE & LEVEL */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {formatJobRole(user.jobRole)}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {formatJobLevel(user.jobLevel)}
                          </span>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">{user.email}</span>
                        </div>
                      </td>

                      {/* EMPLOYEE ID */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-700">{user.employeeId}</span>
                      </td>

                      {/* ACTIVE TOGGLE */}
                      <td className="px-6 py-4 text-center">
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={user.isActive}
                            onChange={(e) => {
                              e.stopPropagation();
                              openReasonDialog({ type: "status", user });
                            }}
                            className="sr-only peer"
                            disabled={currentUser.role !== "admin" && currentUser.role !== "superadmin"}
                          />
                          <div className={`w-11 h-6 rounded-full peer transition-all duration-200 
                            ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}
                            after:content-[''] after:absolute after:top-0.5 after:left-0.5
                            after:bg-white after:border after:rounded-full after:h-5 after:w-5
                            after:transition-all after:duration-200
                            ${user.isActive ? 'after:translate-x-full' : ''}
                            ${(currentUser.role !== "admin" && currentUser.role !== "superadmin") ? 'opacity-50 cursor-not-allowed' : ''}
                          `} />
                        </label>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {currentUser.role === "superadmin" && user.role !== "superadmin" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoleChangeModal({ user, open: true });
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Change role"
                            >
                              {user.isActive ? (
                                user.role === "admin" ? (
                                  <ShieldUser size={18} className="text-blue-500" />
                                ) : (
                                  <Shield size={18} className="text-gray-500" />
                                )
                              ) : (
                                <ShieldOff size={18} className="text-red-500" />
                              )}
                            </button>
                          )}
                          {currentUser.role === "superadmin" && user._id !== currentUser.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!confirm(`Are you sure you want to delete user "${user.firstname} ${user.lastname}"?`)) return;
                                openReasonDialog({ type: "delete", user });
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete user"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openProfile(user);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            title="View profile"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Click on any row to view details</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ROLE CHANGE MODAL */}
      {roleChangeModal?.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield size={20} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Change User Role</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Change role for <span className="font-semibold">{roleChangeModal.user.firstname} {roleChangeModal.user.lastname}</span>
            </p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {availableRoles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => {
                    setRoleChangeModal(null);
                    openReasonDialog({ type: "role", user: roleChangeModal.user, newRoleId: role._id });
                  }}
                  disabled={updatingRole || role._id === roleChangeModal.user.roleId?._id}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                    role._id === roleChangeModal.user.roleId?._id
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  } ${(updatingRole || role._id === roleChangeModal.user.roleId?._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(role.name)}
                    <span className="capitalize font-medium">{role.name}</span>
                    {role._id === roleChangeModal.user.roleId?._id && (
                      <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setRoleChangeModal(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASON DIALOG */}
      {pendingReasonAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Reason Required</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason. This will appear in User Logs.
            </p>

            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter reason..."
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeReasonDialog}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReasonAction}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE PANEL */}
      {selectedUser && (
        <ProfilePage
          open={profileOpen}
          onClose={() => {
            setProfileOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* CREATE USER DIALOG */}
      <CreateUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
}