import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import RoleGuard from "../../Components/RoleGuard";
import {permissions, type Role} from "../../lib/permissions";

interface Module {
  _id: string;
  moduleName: string;
}

export default function Sidebar() {

  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/api/modules", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    };

    fetchModules();
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-2 py-1 rounded ${
      isActive ? "text-blue-600 font-semibold" : "text-gray-600"
    }`;

  return (
    <aside className="w-72 bg-white shadow h-screen flex flex-col">
      <div className="p-6 flex flex-col h-full">

        <h1 className="text-xl font-bold mb-8">
          Key Management System
        </h1>

        {/* TOP SECTION */}
        <div className="flex-1 space-y-4 overflow-y-auto">

          <NavLink to="/" className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/projects" className={linkClass}>
            Projects
          </NavLink>

          {/* 🔥 Dynamic Modules */}
          {modules.map((module) => (
            <NavLink
              key={module._id}
              to={`/module/${module._id}`}
              className={linkClass}
            >
              {module.moduleName}
            </NavLink>
          ))}

          {/* ➕ Add Module (Superadmin only) */}
          <RoleGuard allowedRoles={permissions.forSuperadmin as Role[]}>
           <NavLink
              to="/add-module"
              className="block text-green-600 font-medium"
            >
              + Add Module
            </NavLink>
          </RoleGuard>
        </div>

        {/* BOTTOM SECTION (Admin Controls) */}
        <div className="border-t pt-4 space-y-3">

          <RoleGuard allowedRoles={permissions.forSuperadmin as Role[]}>
            <NavLink to="/admin-management" className="block text-green-600">
              Admin Panel
            </NavLink>
          </RoleGuard>

          <RoleGuard allowedRoles={permissions.forAdmins as Role[]}>
            <NavLink to="/user-management" className="block text-red-600">
              User Management
            </NavLink>
          </RoleGuard>

          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>

          <NavLink to="/settings" className={linkClass}>
            Settings
          </NavLink>
        </div>
      </div>
    </aside>
  );
}