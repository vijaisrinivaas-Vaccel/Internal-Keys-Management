import { Outlet, Navigate, useLocation } from "react-router-dom";

export default function ProjectLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();

  const defaultRoute: Record<string, string> = {
    superadmin: "new-project",
    admin: "new-project",
    user: "assigned",
  };

  // Automatically redirect from base /projects to the user's default view
  if (location.pathname === "/projects" || location.pathname === "/projects/") {
    return <Navigate to={defaultRoute[user.role] || "assigned"} replace />;
  }

  return <Outlet />;
}

