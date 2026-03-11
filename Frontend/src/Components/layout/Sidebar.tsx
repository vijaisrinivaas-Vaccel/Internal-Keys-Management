import { NavLink } from "react-router-dom";
import RoleGuard from "../../Components/RoleGuard";
import { permissions, type Role } from "../../lib/permissions";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../Components/ui/Accordion";
import { Shield, UserPen } from "lucide-react";

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg text-sm transition hover:bg-gray-100 ${
      isActive
        ? "bg-white text-blue-700 font-semibold shadow-sm"
        : "text-gray-700 hover:bg-white/60"
    }`;

  return (
    <aside className="w-64 bg-blue-200 h-screen">
      <div className="bg-white shadow-md h-full flex flex-col p-6">

        {/* Logo / Title */}
        <h1 className="text-xl font-bold text-blue-700 mb-8 tracking-wide">
          KeyAccel
        </h1>

        {/* ================= TOP SECTION ================= */}
        <div className="flex-1 space-y-3 overflow-y-auto">

          {/* Dashboard */}
          <NavLink to="/" className={linkClass}>
            Dashboard
          </NavLink>

          {/* Projects Accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="projects" className="border-none">
              
              <AccordionTrigger className="px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-white/60 hover:no-underline">
                Projects
              </AccordionTrigger>

              <AccordionContent className="pl-4 mt-1 space-y-1">
                <RoleGuard allowedRoles={permissions.forAdmins as Role[]}>
                  <NavLink to="/projects" className={linkClass}>
                    All Projects
                  </NavLink>
                </RoleGuard>
                <RoleGuard allowedRoles={permissions.forAdmins as Role[]}>
                    <NavLink to="/projects/manage-assignments" className={linkClass} >
                      Manage Assigning 
                    </NavLink>
                </RoleGuard>
                
                <NavLink to="/projects/assigned" className={linkClass}>
                  My Assignments
                </NavLink>

              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>

        {/* ================= BOTTOM SECTION ================= */}
        <div className="border-t border-blue-300 pt-4 space-y-3">

          <RoleGuard allowedRoles={permissions.forSuperadmin as Role[]}>
            <NavLink
              to="/admin-management"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Shield size={20} />
              Admin Panel
            </NavLink>
          </RoleGuard>

          <RoleGuard allowedRoles={permissions.forAdmins as Role[]}>
            <NavLink
              to="/user-management"
              className="flex items-center gap-2 px-4 py-2  text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <UserPen size={20} />
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