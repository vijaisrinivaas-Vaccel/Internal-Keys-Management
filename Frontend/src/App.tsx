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
import SettingsPage from "./Pages/Admin/SettingsPage";
import ReportPage from "./Pages/Reports/ReportPage";
import MaintenanceScreen from "./Pages/MaintenanceScreen";
import { getGlobalSettings } from "./lib/globalSettings";
import { isSuperAdmin } from "./lib/permissions";

import SkeletonPageLoader from "./Components/Loader/SkeletonPageLoader";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [underMaintenance, setUnderMaintenance] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [authRes, settingsData] = await Promise.all([
          getMe(),
          getGlobalSettings()
        ]);

        if (settingsData?.underMaintenance) {
          setUnderMaintenance(true);
        }

        if (authRes.ok) {
          const userData = await authRes.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          clearAuth();
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        clearAuth();
      }

      setAuthChecked(true);
    };

    checkAuth();

    // Listen for real-time maintenance triggers from API calls
    const handleMaintenanceEvent = () => {
      setUnderMaintenance(true);
    };

    window.addEventListener("app-maintenance-active", handleMaintenanceEvent);
    return () => {
      window.removeEventListener("app-maintenance-active", handleMaintenanceEvent);
    };
  }, []);

  if (!authChecked) return <SkeletonPageLoader />;

  return (
    <Routes>
      {/* 🔐 If NOT authenticated → show AuthPage (even during maintenance so admin can login) */}
      {!isAuthenticated && (
        <Route
          path="/*"
          element={
            <AuthPage
              onLoginSuccess={async () => {
                // Refresh settings and user data after login
                const [settings, authRes] = await Promise.all([
                  getGlobalSettings(),
                  getMe()
                ]);
                
                if (settings) {
                  setUnderMaintenance(settings.underMaintenance);
                }
                
                if (authRes.ok) {
                  const userData = await authRes.json();
                  setUser(userData);
                  setIsAuthenticated(true);
                }
              }}
            />
          }
        />
      )}

      {/* 🔓 If authenticated → show MaintenanceScreen or Dashboard */}
      {isAuthenticated && (
        underMaintenance && !isSuperAdmin(user) ? (
          <Route path="/*" element={<MaintenanceScreen />} />
        ) : (
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
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        )
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
