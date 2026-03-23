import { useEffect, useState } from "react";

export default function Dashboard() {
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setRole(user.role);
  }, []);

  return (
    <div className="transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>

      {/* Common Section (Visible to all) */}
      <div className="mb-6 p-4 bg-white dark:bg-slate-900 shadow rounded transition-colors duration-300 dark:text-slate-300 dark:border dark:border-slate-800">
        <p>Welcome to the Projects Keys Management System </p>
      </div>

      {/* Superadmin Only Section */}
      {role === "superadmin" && (
        <div className="mb-4 p-4 bg-purple-100 dark:bg-purple-900/20 rounded dark:text-purple-300 transition-colors duration-300">
          <h2 className="font-semibold">Superadmin Controls</h2>
          <p>Full system control.</p>
        </div>
      )}

      {/* Admin + Superadmin Section */}
      {(role === "admin" || role === "superadmin") && (
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/20 rounded dark:text-blue-300 transition-colors duration-300">
          <h2 className="font-semibold">Admin Controls</h2>
          <p>Manage users and projects.</p>
        </div>
      )}

      
    </div>
  );
}