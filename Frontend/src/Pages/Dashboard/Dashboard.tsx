import { useEffect, useState } from "react";

export default function Dashboard() {
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setRole(user.role);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Common Section (Visible to all) */}
      <div className="mb-6 p-4 bg-white shadow rounded">
        <p>Welcome to the Project Management System 🚀</p>
      </div>

      {/* Superadmin Only Section */}
      {role === "superadmin" && (
        <div className="mb-4 p-4 bg-purple-100 rounded">
          <h2 className="font-semibold">Superadmin Controls</h2>
          <p>Full system control.</p>
        </div>
      )}

      {/* Admin + Superadmin Section */}
      {(role === "admin" || role === "superadmin") && (
        <div className="mb-6 p-4 bg-blue-100 rounded">
          <h2 className="font-semibold">Admin Controls</h2>
          <p>Manage users and projects.</p>
        </div>
      )}

      
    </div>
  );
}