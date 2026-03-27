import { Outlet, Navigate, useLocation } from "react-router-dom";
import { hasPermission, PERMISSIONS } from "../../lib/permissions";

export default function ProjectLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();

  const defaultRoute = hasPermission(user, PERMISSIONS.VIEW_ALLPROJECT)
    ? "new-project"
    : (
      hasPermission(user, PERMISSIONS.VIEW_MANAGEASSIGNING) &&
      hasPermission(user, PERMISSIONS.MANAGE_USERS)
    )
      ? "manage-assignments"
      : "assigned";

  // Automatically redirect from base /projects to the user's default view
  if (location.pathname === "/projects" || location.pathname === "/projects/") {
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
}

