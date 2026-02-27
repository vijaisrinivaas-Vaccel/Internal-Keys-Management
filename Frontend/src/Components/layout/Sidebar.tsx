import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import RoleGuard from "../../Components/RoleGuard";
import {permissions, type Role} from "../../lib/permissions";
import AddModuleDialog from "../../Pages/Module/AddModuleDialog";
import { fetchModules } from "../../Service/module.service";

interface Module {
  _id: string;
  moduleName: string;
}

export default function Sidebar() {

  const [modules, setModules] = useState<Module[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchModules().then((modules) => setModules(modules));
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-2 py-1 rounded ${
      isActive ? "text-blue-600 font-semibold" : "text-gray-600"
    }`;

  return (
    <aside className="w-62 bg-white shadow h-screen flex flex-col">
      <div className="p-6 flex flex-col h-full">

        <h1 className="text-xl font-mono font-bold mb-8">
          KeyAccel
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
           <button
              onClick={() => setOpen(true)}
              className="text-green-600 font-medium mt-4"
            >
              + Add Module
            </button>
          </RoleGuard>
          <AddModuleDialog
            open={open}
            onOpenChange={setOpen}
            onSuccess={fetchModules}
          />
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