import { useEffect, useState } from "react";
import { X, KeyRound, UserCircle2 } from "lucide-react";
import { authFetch } from "../../lib/auth";

interface ProfileData {
  id?: string;
  firstname?: string;
  lastname?: string;
  username: string;
  employeeId?: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  jobRole?: string;
  jobLevel?: string;
}

interface ProfilePageProps {
  open: boolean;
  onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function ProfilePage({ open, onClose }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchProfile = async () => {
      const res = await authFetch(`${API_BASE_URL}/auth/me`);
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data);
    };

    fetchProfile();
  }, [open]);

  const resetPassword = async () => {
    setResetMessage("");

    if (!newPassword || !confirmPassword) {
      setResetMessage("Please fill both password fields.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResetMessage(data.message || "Password reset failed.");
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setResetMessage("Password reset successfully.");
    } catch {
      setResetMessage("Password reset failed.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-40 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 right-0 h-screen w-full md:w-[30vw] min-w-[320px] max-w-130 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle2 size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">My Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition"
              aria-label="Close profile panel"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label="First Name" value={profile?.firstname} />
              <Field label="Last Name" value={profile?.lastname} />
              <Field label="Username" value={profile?.username} />
              <Field label="Employee ID" value={profile?.employeeId} />
              <Field label="Email" value={profile?.email} />
              <Field label="Role" value={profile?.role} />
              <Field label="Job Role" value={profile?.jobRole} />
              <Field label="Job Level" value={profile?.jobLevel} />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <KeyRound size={16} />
                Reset Password
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={resetPassword}
                disabled={isResetting}
                className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
              >
                {isResetting ? "Resetting..." : "Reset Password"}
              </button>
              {resetMessage && (
                <p className="text-xs text-gray-600">{resetMessage}</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border border-gray-200 rounded-md p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-1">{value || "-"}</p>
    </div>
  );
}
