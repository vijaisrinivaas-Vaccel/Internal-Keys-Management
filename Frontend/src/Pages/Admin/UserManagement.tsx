import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth";
import ProfilePage from "../../Components/profilepage/ProfilePage";
import { Search, Users, UserCheck, UserX, MoreVertical, Shield, ShieldAlert, ShieldUser, ShieldOff } from "lucide-react";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  employeeId: string;
  role: "user" | "admin" | "superadmin";
  jobRole?: string;
  jobLevel?: string;
  isActive: boolean;
}

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

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch("http://localhost:8000/api/users");

      if (!res.ok) {
        setErrorMessage("Failed to fetch users");
        return;
      }

      const data = await res.json();

      // Filter based on user role
      let filtered = data;

      // If not superadmin, hide other superadmins
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
  }, []);

  /* ================= TOGGLE ACTIVE ================= */
  const toggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const res = await authFetch(`http://localhost:8000/api/users/${id}/status`, {
        method: "PUT",
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to toggle status:", error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= UPDATE ROLE ================= */
  const updateRole = async (userId: string, newRole: string) => {
    if (currentUser.role !== "superadmin") {
      alert("Only superadmins can change roles");
      return;
    }

    setUpdatingRole(true);
    try {
      const res = await authFetch(`http://localhost:8000/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to update role");
        return;
      }

      const updatedUser = await res.json();

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: updatedUser.role } : u))
      );

      setRoleChangeModal(null);
    } catch (err) {
      console.error(err);
      alert("Error updating role");
    } finally {
      setUpdatingRole(false);
    }
  };

  /* ================= OPEN PROFILE ================= */
  const openProfile = (user: User) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  /* ================= HANDLE USER UPDATE ================= */
  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );

    // Update in selected user if open
    if (selectedUser?._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
  };

  /* ================= FILTER AND SORT USERS ================= */
  const filteredUsers = users
    .filter((user) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        user.username.toLowerCase().includes(searchLower) ||
        user.firstname?.toLowerCase().includes(searchLower) ||
        user.lastname?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.employeeId.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Role filter
      if (filterRole && user.jobRole !== filterRole) return false;

      // Status filter
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
    switch (role) {
      case "admin":
        return <ShieldUser size={16} className="text-blue-600" />;
      default:
        return <Shield size={16} className="text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
    <div className="space-y-6 min-h-screen">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="text-blue-600" size={28} />
          User Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage developers in the system and monitor their access status.
        </p>
      </div>

      {/* USER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactive Users</p>
              <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX size={20} className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.roles.admin + stats.roles.superadmin}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldAlert size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          {/* SEARCH */}
          <div className="flex-1 min-w-50">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* FILTER ROLE */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Job Roles</option>
            <option value="frontend_developer">Frontend Developer</option>
            <option value="backend_developer">Backend Developer</option>
            <option value="full_stack_developer">Full Stack Developer</option>
            <option value="devops_engineer">DevOps Engineer</option>
            <option value="software_developer">Software Developer</option>

            {/* <option value="qa_engineer">QA Engineer</option>
            <option value="product_manager">Product Manager</option>
            <option value="project_manager">Project Manager</option> */}

          </select>

          {/* SORT LEVEL */}
          <select
            value={sortLevel}
            onChange={(e) => setSortLevel(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sort by Level</option>
            <option value="intern">Intern</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            {/* <option value="manager">Manager</option> */}
          </select>

          {/* REFRESH BUTTON */}
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading users...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
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
      ) : (
        /* USER TABLE */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role & Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  onClick={() => openProfile(user)}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  {/* USER INFO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === "superadmin" ? "bg-purple-600" :
                          user.role === "admin" ? "bg-blue-600" : "bg-gray-600"
                        }`}>
                        {user.firstname?.charAt(0).toUpperCase()}
                        {user.lastname?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
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
                      <span className="text-xs text-gray-500">
                        {formatJobLevel(user.jobLevel)}
                      </span>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>

                  {/* EMPLOYEE ID */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {user.employeeId}
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
                        onChange={(e) => toggleStatus(user._id, e as any)}
                        className="sr-only peer"
                        disabled={currentUser.role !== "admin" && currentUser.role !== "superadmin"}
                      />
                      <div className={`w-11 h-6 rounded-full peer 
                        ${user.isActive ? 'bg-green-500' : 'bg-gray-200'}
                        after:content-[''] after:absolute after:top-0.5 after:left-0.5
                        after:bg-white after:border after:rounded-full after:h-5 after:w-5
                        after:transition-all
                        ${user.isActive ? 'after:translate-x-full' : ''}
                        ${(currentUser.role !== "admin" && currentUser.role !== "superadmin") ? 'opacity-50 cursor-not-allowed' : ''}
                      `} />
                    </label>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {currentUser.role === "superadmin" && user.role !== "superadmin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleChangeModal({ user, open: true });
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          title="Change role"
                        >
                          {
                            user.isActive ? (
                              user.role === "admin" ? (
                                <ShieldUser size={22} className="text-green-500" />
                              ) : (
                                <Shield size={20} className="text-blue-500" />
                              )
                            ) : (
                              <ShieldOff size={20} className="text-red-500" />
                            )
                          }

                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfile(user);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="View profile"
                      >
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TABLE FOOTER WITH COUNT */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      )}

      {/* ROLE CHANGE MODAL */}
      {roleChangeModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Change User Role</h3>
            <p className="text-sm text-gray-600 mb-4">
              Change role for {roleChangeModal.user.firstname} {roleChangeModal.user.lastname}
            </p>

            <div className="space-y-2 mb-6">
              {["user", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => updateRole(roleChangeModal.user._id, role)}
                  disabled={updatingRole || role === roleChangeModal.user.role}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${role === roleChangeModal.user.role
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'hover:bg-gray-50 border-gray-200'
                    } ${(updatingRole || role === roleChangeModal.user.role) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    <span className="capitalize">{role}</span>
                    {role === roleChangeModal.user.role && (
                      <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRoleChangeModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
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
    </div>
  );
}