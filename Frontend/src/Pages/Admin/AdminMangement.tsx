import { useEffect, useState } from "react";
import { 
  Shield,
  LayoutTemplate,
  Database,
  Users,
  Cog,
  ChevronRight
} from "lucide-react";
import TemplateManagementTab from "../../Components/admin/TemplateManagementTab";
import SystemSettingsTab from "../../Components/admin/SystemManagementTab";
import ConfigTemplateTab from "../../Components/admin/ConfigTemplateTab";
import RoleManagementTab from "../../Components/admin/RoleManagementTab";
import { hasPermission, PERMISSIONS } from "../../lib/permissions";

export default function AdminManagement() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeTab, setActiveTab] = useState<"templates" | "configs" | "roles" | "settings">("templates");

  const tabs = [
    {
      id: "templates",
      label: "Project Templates",
      icon: LayoutTemplate,
      description: "Manage project structure templates",
      permission: PERMISSIONS.VIEW_PROJECT_TEMPLATES
    },
    {
      id: "configs",
      label: "Config Templates",
      icon: Database,
      description: "Predefined configuration sets",
      permission: PERMISSIONS.VIEW_CONFIG_TEMPLATES
    },
    {
      id: "roles",
      label: "User Roles",
      icon: Users,
      description: "Manage user roles and permissions",
      permission: PERMISSIONS.VIEW_USER_ROLES
    },
    {
      id: "settings",
      label: "System Settings",
      icon: Cog,
      description: "Configure system parameters",
      permission: PERMISSIONS.VIEW_SYSTEM_SETTINGS
    },
  ];

  const visibleTabs = tabs.filter((tab) => hasPermission(currentUser, tab.permission));

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    const tabIsVisible = visibleTabs.some((tab) => tab.id === activeTab);
    if (!tabIsVisible) {
      setActiveTab(visibleTabs[0].id as "templates" | "configs" | "roles" | "settings");
    }
  }, [activeTab, visibleTabs]);

  if (visibleTabs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">No admin panel tabs are enabled for your role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-6 p-6">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="relative px-8 py-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Shield size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Management</h1>
                  <p className="text-blue-100 mt-1">
                    Project templates, configuration templates, user roles, and system configurations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex overflow-x-auto hide-scrollbar">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      group relative flex items-center gap-3 px-6 py-4 transition-all duration-200
                      ${isActive 
                        ? "text-blue-600 bg-white" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                      }
                    `}
                  >
                    <div className={`
                      p-1.5 rounded-lg transition-all duration-200
                      ${isActive 
                        ? "bg-blue-50 text-blue-600" 
                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }
                    `}>
                      <Icon size={18} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{tab.label}</div>
                      <div className="text-xs text-gray-400 hidden sm:block">{tab.description}</div>
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
          <div className="p-6 bg-white">
            <div className="transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
              {activeTab === "templates" && <TemplateManagementTab />}
              {activeTab === "configs" && <ConfigTemplateTab />}
              {activeTab === "roles" && <RoleManagementTab />}
              {activeTab === "settings" && <SystemSettingsTab />}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="text-center text-xs text-gray-400 py-4">
          <div className="inline-flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-full">
            <Shield size={12} className="text-gray-500" />
            <span>Manage your platform configurations</span>
            <ChevronRight size={12} className="text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
