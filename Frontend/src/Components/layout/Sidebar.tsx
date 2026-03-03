import { NavLink } from "react-router-dom";
import RoleGuard from "../../Components/RoleGuard";
import {permissions, type Role} from "../../lib/permissions";

export default function Sidebar() {
  
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