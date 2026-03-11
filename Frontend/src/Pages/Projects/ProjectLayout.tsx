import { Outlet, Navigate, useLocation } from "react-router-dom";


export default function ProjectLayout() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();

  const defaultRoute: Record<string, string> = {
    superadmin: "new-project",
    admin: "new-project",
    user: "your-projects",
  };

  // If user is exactly at /projects → redirect
  if (location.pathname === "/projects") {
    return <Navigate to={defaultRoute[user.role]} replace />;
  }
    
  return (
    <>
      <Outlet />
    </>

  )};

