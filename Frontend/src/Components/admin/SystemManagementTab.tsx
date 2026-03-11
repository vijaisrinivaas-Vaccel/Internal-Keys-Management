import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";

export default function SystemSettingsTab() {
  const [settings, setSettings] = useState({
    allowRegistration: true,
    defaultUserRole: "user",
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    maintenanceMode: false,
    emailNotifications: true
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage("Settings saved successfully!");
    } catch (err) {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">System Settings</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">General</h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Allow User Registration</span>
                <input
                  type="checkbox"
                  checked={settings.allowRegistration}
                  onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
                  className="toggle"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm">Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="toggle"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="toggle"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Security</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Default User Role</label>
                <select
                  value={settings.defaultUserRole}
                  onChange={(e) => setSettings({...settings, defaultUserRole: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                  min="5"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                  min="3"
                  max="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end items-center gap-4">
        {message && (
          <span className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}