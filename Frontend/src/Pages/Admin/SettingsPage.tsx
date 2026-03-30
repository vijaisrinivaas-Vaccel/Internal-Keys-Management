import { useState, useEffect } from "react";
import { Settings, ShieldAlert, BadgeCheck, AlertCircle, Loader2 } from "lucide-react";
import { IOSSwitch } from "../../Components/ui/ToggleSwitch";
import { getGlobalSettings, updateMaintenanceMode, type GlobalSettings } from "../../lib/globalSettings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getGlobalSettings();
      if (data) {
        setSettings(data);
      } else {
        setError("Failed to load settings. Please try again.");
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleToggleMaintenance = async () => {
    if (!settings) return;

    setUpdating(true);
    setError(null);
    const newStatus = !settings.underMaintenance;
    
    const updated = await updateMaintenanceMode(newStatus, "Superadmin manual toggle");
    
    if (updated) {
      setSettings(updated);
    } else {
      setError("Failed to update maintenance mode. Access denied or server error.");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 dark:bg-slate-800 rounded-xl">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">System Settings</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              Maintenance Mode
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Put the entire application into maintenance mode. Only superadmins will have access.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {updating && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            <IOSSwitch 
              checked={settings?.underMaintenance || false} 
              onChange={handleToggleMaintenance}
              disabled={updating}
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {settings?.underMaintenance ? (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <BadgeCheck className="w-6 h-6 text-green-600" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Current Status</span>
                <p className={`text-lg font-black ${settings?.underMaintenance ? "text-red-600" : "text-green-600"}`}>
                  {settings?.underMaintenance ? "IN MAINTENANCE" : "OPERATIONAL"}
                </p>
              </div>
              
              {settings?.underMaintenance && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed font-medium">
                    The system is currently blocking all non-superadmin traffic. Regular users will see the "Under Maintenance" screen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-in fade-in shake-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-400 font-semibold">{error}</p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-6 rounded-2xl">
        <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">About Maintenance Mode</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-disc list-inside">
          <li>Enables a global interceptor that shows a maintenance screen to users.</li>
          <li>Superadmins retain full access to all features and APIs.</li>
          <li>All other roles will receive a 503 status for API calls.</li>
          <li>Logging out and logging in as superadmin is still allowed.</li>
        </ul>
      </div>
    </div>
  );
}
