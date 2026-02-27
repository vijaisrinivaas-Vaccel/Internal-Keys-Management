import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { clearAuth, getMe } from "./lib/auth";
import AuthPage from "./AuthPage/AuthPage";

import DashboardLayout from "./Pages/Dashboard/DashboardLayout";
import Dashboard from "./Pages/Dashboard/Dashboard";

import ProjectLayout from "./Pages/Projects/ProjectLayout";
import NewProject from "./Pages/Projects/NewProjects/Project";
import YourProjects from "./Pages/Projects/YourProject/YourProject";
import ProjectAssigning from "./Pages/Projects/ProjectAssign/ProjectAssign";
import ProjectLead from "./Pages/Projects/ProjectLead/ProjectLead";
import ModulePage from "./Pages/Module/ModulePage";
import ConfigPage from "./Pages/Module/ConfigPage/ConfigPage";


export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getMe();

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          clearAuth();
          setIsAuthenticated(false);
        }
      } catch {
        clearAuth();
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  if (!authChecked) return <div>Loading...</div>;

  return (
    <Routes>
      {/* 🔐 If NOT authenticated → show AuthPage */}
      {!isAuthenticated && (
        <Route
          path="/*"
          element={
            <AuthPage
              onLoginSuccess={() => setIsAuthenticated(true)}
            />
          }
        />
      )}

      {/* 🔓 If authenticated → show Dashboard */}
      {isAuthenticated && (
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/projects" element={<ProjectLayout />}>
            
            <Route path="new-project" element={<NewProject />} />
            <Route path="your-projects" element={<YourProjects />} />
            <Route path="project-assigning" element={<ProjectAssigning />} />
            <Route path="project-lead" element={<ProjectLead />} />
          </Route> 
          {/* MODULE ROUTE */}
          <Route path="module/:moduleId" element={<ModulePage />} />

          {/* CONFIG PAGE (Separate Page) */}
          <Route
            path="module/:moduleId/project/:projectId"
            element={<ConfigPage />}
          />
        </Route>
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
      
    </Routes>
  );
}
