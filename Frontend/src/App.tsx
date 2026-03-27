import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { clearAuth, getMe } from "./lib/auth";
import AuthPage from "./AuthPage/AuthPage";

import DashboardLayout from "./Pages/Dashboard/DashboardLayout";
import Dashboard from "./Pages/Dashboard/Dashboard";

import ProjectLayout from "./Pages/Projects/ProjectLayout";
import NewProject from "./Pages/Projects/NewProjects/Project";
import ProjectDetailPage from "./Pages/Projects/NewProjects/ProjectDetailPage";
import AssignProject from "./Pages/Projects/ProjectAssigning/AssignProject";
import ManageAssignments from "./Pages/Projects/ProjectAssigning/ManageAssignments";
import MyAssignments from "./Pages/Projects/MyAssignments";

import AdminManagement from "./Pages/Admin/AdminMangement";
import UserManagement from "./Pages/Admin/UserManagement";
import ReportPage from "./Pages/Reports/ReportPage";

import SkeletonPageLoader from "./Components/Loader/SkeletonPageLoader";

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

  if (!authChecked) return <SkeletonPageLoader />;

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
          <Route path="projects" element={<ProjectLayout />}>
            <Route path="new-project" element={<NewProject />} />
            <Route path="manage-assignments" element={<ManageAssignments />} />
            <Route path="assigned" element={<MyAssignments />} />
          </Route>
          <Route path="project/:projectId" element={<ProjectDetailPage />} />
          <Route path="project/:projectId/assign" element={<AssignProject />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="reports" element={<ReportPage />} />
        </Route>
      )}
      

      <Route path="*" element={<Navigate to="/" replace />} />
      
    </Routes>
  );
}
