import { NavLink, useLocation } from "react-router-dom";
import RoleGuard from "../../Components/RoleGuard";
import { PERMISSIONS } from "../../lib/permissions";
import { Shield, UserPen } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100 dark:hover:bg-slate-800 ${
      isActive
        ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold shadow-sm border dark:border-slate-700"
        : "text-gray-700 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60"
    }`;

  return (
    <aside className="w-64 bg-blue-200 dark:bg-slate-950 h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 shadow-md h-full flex flex-col p-6 dark:border-slate-800">

        {/* Logo / Title */}
        <h1 className="text-xl font-bold text-blue-600 mb-8 tracking-wide">
          KeyAccel
        </h1>

        {/* ================= TOP SECTION ================= */}
        <div className="flex-1 space-y-3 overflow-y-auto">

          {/* Dashboard */}
          <RoleGuard requiredPermission={PERMISSIONS.VIEW_DASHBOARD}>
            <NavLink to="/" className={linkClass}>
              Dashboard
            </NavLink>
          </RoleGuard>

          {/* All Projects */}
          <RoleGuard requiredPermission={PERMISSIONS.VIEW_ALLPROJECT}>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                linkClass({
                  isActive:
                    isActive &&
                    !location.pathname.includes("manage-assignments") &&
                    !location.pathname.includes("assigned"),
                })
              }
            >
              All Projects
            </NavLink>
          </RoleGuard>

          {/* Manage Assigning */}
          <RoleGuard
            requiredPermissions={[
              PERMISSIONS.VIEW_MANAGEASSIGNING,
              PERMISSIONS.MANAGE_USERS
            ]}
            requireAll
          >
            <NavLink to="/projects/manage-assignments" className={linkClass}>
              Manage Assigning
            </NavLink>
          </RoleGuard>

          {/* My Assignments */}
          <RoleGuard requiredPermission={PERMISSIONS.VIEW_MYASSIGNMENT}>
            <NavLink to="/projects/assigned" className={linkClass}>
              My Assignments
            </NavLink>
          </RoleGuard>

        </div>

        {/* ================= BOTTOM SECTION ================= */}
        <div className="border-t border-blue-300 dark:border-slate-800 pt-4 space-y-3">

          <RoleGuard
            requiredPermissions={[
              PERMISSIONS.VIEW_PROJECT_TEMPLATES,
              PERMISSIONS.VIEW_CONFIG_TEMPLATES,
              PERMISSIONS.VIEW_USER_ROLES,
              PERMISSIONS.VIEW_SYSTEM_SETTINGS
            ]}
          >
            <NavLink
              to="/admin-management"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Shield size={20} className="text-blue-500" />
              Admin Panel
            </NavLink>
          </RoleGuard>

          <RoleGuard requiredPermission={PERMISSIONS.VIEW_USERS}>
            <NavLink
              to="/user-management"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <UserPen size={20} className="text-purple-500" />
              User Management
            </NavLink>
          </RoleGuard>

          <RoleGuard requiredPermission={PERMISSIONS.VIEW_REPORTS}>
            <NavLink to="/reports" className={linkClass}>
              Reports
            </NavLink>
          </RoleGuard>

          <RoleGuard requiredPermission={PERMISSIONS.ACCESS_SETTINGS}>
            <NavLink to="/settings" className={linkClass}>
              Settings
            </NavLink>
          </RoleGuard>

        </div>
      </div>
    </aside>
  );
}
