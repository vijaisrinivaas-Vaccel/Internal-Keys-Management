import { useEffect, useState } from "react";
import {
  FileBarChart,
  LogIn,
  UserPlus,
  ShieldCheck,
  Activity,
  Settings,
  ChevronRight,
} from "lucide-react";
import AuthLogsTab from "../../Components/reports/AuthLogsTab";
import UserLogsTab from "../../Components/reports/UserLogsTab";
import PermissionLogsTab from "../../Components/reports/PermissionLogsTab";
import ActivityLogsTab from "../../Components/reports/ActivityLogsTab";
import AdminLogsTab from "../../Components/reports/AdminLogsTab";
import { hasPermission, PERMISSIONS } from "../../lib/permissions";

type TabId = "auth" | "user" | "permission" | "activity" | "admin";

const tabs: {
  id: TabId;
  label: string;
  icon: typeof LogIn;
  description: string;
  gradient: string;
  permission: string;
}[] = [
  {
    id: "auth",
    label: "Auth Logs",
    icon: LogIn,
    description: "Login & logout records",
    gradient: "from-blue-500 to-cyan-500",
    permission: PERMISSIONS.VIEW_AUTH_LOGS,
  },
  {
    id: "user",
    label: "User Logs",
    icon: UserPlus,
    description: "User CRUD operations",
    gradient: "from-emerald-500 to-teal-500",
    permission: PERMISSIONS.VIEW_USER_LOGS,
  },
  {
    id: "permission",
    label: "Permission Logs",
    icon: ShieldCheck,
    description: "Assignment & access changes",
    gradient: "from-violet-500 to-purple-500",
    permission: PERMISSIONS.VIEW_PERMISSION_LOGS,
  },
  {
    id: "activity",
    label: "Activity Logs",
    icon: Activity,
    description: "Data operations & actions",
    gradient: "from-orange-500 to-amber-500",
    permission: PERMISSIONS.VIEW_ACTIVITY_LOGS,
  },
  {
    id: "admin",
    label: "Admin Logs",
    icon: Settings,
    description: "Admin panel changes",
    gradient: "from-rose-500 to-pink-500",
    permission: PERMISSIONS.VIEW_ADMIN_LOGS,
  },
];

export default function ReportPage() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeTab, setActiveTab] = useState<TabId>("auth");
  const visibleTabs = tabs.filter((tab) => hasPermission(currentUser, tab.permission));

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    const tabIsVisible = visibleTabs.some((tab) => tab.id === activeTab);
    if (!tabIsVisible) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  if (visibleTabs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} className="text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">No report tabs are enabled for your role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="space-y-6 p-6">

        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="relative px-8 py-8">
            {/* Background Decorations */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <FileBarChart size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Reports & Logs</h1>
                  <p className="text-blue-100 mt-1">
                    Monitor system activity, user actions, and security events
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            <div className="flex overflow-x-auto hide-scrollbar">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group relative flex items-center gap-3 px-6 py-4 transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                      }
                    `}
                  >
                    <div className={`
                      p-1.5 rounded-lg transition-all duration-200
                      ${isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-600"
                      }
                    `}>
                      <Icon size={18} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{tab.label}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                        {tab.description}
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-white dark:bg-slate-900">
            <div className="transition-all duration-200">
              {activeTab === "auth" && <AuthLogsTab />}
              {activeTab === "user" && <UserLogsTab />}
              {activeTab === "permission" && <PermissionLogsTab />}
              {activeTab === "activity" && <ActivityLogsTab />}
              {activeTab === "admin" && <AdminLogsTab />}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
          <div className="inline-flex items-center gap-2 bg-gray-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-full">
            <FileBarChart size={12} className="text-gray-500 dark:text-gray-400" />
            <span>System audit logs and activity reports</span>
            <ChevronRight size={12} className="text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
