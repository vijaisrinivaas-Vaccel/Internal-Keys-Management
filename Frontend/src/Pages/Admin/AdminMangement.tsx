import { useState } from "react";
import { 
  FileText, 
  Settings, 
  Shield,
  Key 
} from "lucide-react";
import TemplateManagementTab from "../../Components/admin/TemplateManagementTab";
import SystemSettingsTab from "../../Components/admin/SystemManagementTab";
import ConfigTemplateTab from "../../Components/admin/ConfigTemplateTab";

export default function AdminManagement() {
  const [activeTab, setActiveTab] = useState<"templates" | "configs" | "settings">("templates");

  const tabs = [
    { id: "templates", label: "Project Templates", icon: FileText },
    { id: "configs", label: "Config Templates", icon: Key },
    { id: "settings", label: "System Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="text-blue-600" size={28} />
          Admin Management
        </h1>
        <p className="text-gray-600 mt-2">
          Project templates, configuration templates, and system configurations
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "templates" && <TemplateManagementTab />}
          {activeTab === "configs" && <ConfigTemplateTab />}
          {activeTab === "settings" && <SystemSettingsTab />}
        </div>
      </div>
    </div>
  );
}