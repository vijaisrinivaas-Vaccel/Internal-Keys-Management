import RoleGuard from "../../Components/RoleGuard";
import { permissions,type Role } from "../../lib/permissions";

import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";


const tabClass = ({ isActive }: { isActive: boolean }) =>
  `pb-2 transition-colors ${
    isActive
      ? "text-blue-600 border-b-2 border-blue-600"
      : "text-gray-600 border-b-2 border-transparent hover:text-blue-600"
  }`;

export default function ProjectLayout() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();

  const defaultRoute: Record<string, string> = {
    superadmin: "new-project",
    admin: "your-projects",
    user: "your-projects",
  };

  // If user is exactly at /projects → redirect
  if (location.pathname === "/projects") {
    return <Navigate to={defaultRoute[user.role]} replace />;
  }
    
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Company Projects</h1>

      {/* Tabs */}
      <div className="flex gap-8 border-b mb-6">

        <RoleGuard allowedRoles={permissions.forSuperadmin as Role[]}>
          <NavLink to="new-project" className={tabClass}>
            New Projects
          </NavLink>
        </RoleGuard>

        <NavLink to="your-projects" className={tabClass}>
          Your Projects
        </NavLink>
        
        <RoleGuard allowedRoles={permissions.forAdmins as Role[]}>
            <NavLink to="project-assigning" className={tabClass}>
              Project Assigning
            </NavLink>

            <NavLink to="project-lead" className={tabClass}>
              Project Lead
            </NavLink>
        </RoleGuard>

      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
}