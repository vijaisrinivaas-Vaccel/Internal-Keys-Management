import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminManagement() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const res = await authFetch("http://localhost:8000/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const changeRole = async (id: string, role: string) => {
    await authFetch(`http://localhost:8000/api/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-bold mb-6">Admin Management</h1>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex justify-between items-center border p-4 rounded-lg"
          >
            <div>
              <div className="font-semibold">{user.username}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>

            <div className="flex gap-3">
              {user.role === "admin" ? (
                <button
                  onClick={() => changeRole(user._id, "user")}
                  className="px-3 py-1 text-sm bg-gray-200 rounded"
                >
                  Demote
                </button>
              ) : (
                <button
                  onClick={() => changeRole(user._id, "admin")}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Promote
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}