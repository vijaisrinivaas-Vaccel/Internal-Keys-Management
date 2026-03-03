import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const res = await authFetch("http://localhost:8000/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const toggleStatus = async (id: string) => {
    await authFetch(`http://localhost:8000/api/users/${id}/status`, {
      method: "PUT",
    });
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-bold mb-6">User Management</h1>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex justify-between items-center border p-4 rounded-lg"
          >
            <div>
              <div className="font-semibold">
                {user.username}
                <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100">
                  {user.role}
                </span>
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>

            <button
              onClick={() => toggleStatus(user._id)}
              className={`px-3 py-1 text-sm rounded ${
                user.isActive
                  ? "bg-red-500 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}