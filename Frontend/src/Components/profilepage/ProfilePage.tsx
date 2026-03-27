// profilePage/ProfilePage.tsx
import { useEffect, useState } from "react";
import { X, UserCircle2, Save, Edit2, Shield } from "lucide-react";
import { authFetch } from "../../lib/auth";
import { type Permission } from "../../userModel/User";
import ProfileDetailsTab from "./ProfileDetailsTab";
import ProfilePermissionsTab from "./ProfilePermissionsTab";

export interface ProfileData {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  employeeId: string;
  email: string;
  role: string;
  roleId: {
    _id: string;
    name: string;
  };
  jobRole?: string;
  jobLevel?: string;
  isActive: boolean;
  permissions?: Permission[];
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
}

interface ProfilePageProps {
  open: boolean;
  onClose: () => void;
  user?: ProfileData;
  onUserUpdated?: (updatedUser: ProfileData) => void | undefined;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function ProfilePage({
  open,
  onClose,
  user,
  onUserUpdated,
}: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [permissionEditMode, setPermissionEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "permissions">("profile");

  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [detailedPermissions, setDetailedPermissions] = useState<any[]>([]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    if (!open) return;

    if (user) {
      setProfile(user);
      setForm(user);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/auth/me`);
        if (!res.ok) return;

        const data = await res.json();
        setProfile(data);
        setForm(data);

        if (data._id === currentUser._id) {
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [open, user]);

  /* ================= FETCH DETAILED PERMISSIONS ================= */
  useEffect(() => {
    if (!open || !profile?._id || activeTab !== "permissions") return;

    const fetchDetailedPermissions = async () => {
      try {
        const detailedPermRes = await authFetch(`${API_BASE_URL}/projectPermission/users/${profile._id}/detailed-permissions`);
        if (detailedPermRes.ok) {
          const detailedData = await detailedPermRes.json();
          setDetailedPermissions(detailedData);
        }
      } catch (err) {
        console.error("Error fetching detailed permissions:", err);
      }
    };

    fetchDetailedPermissions();
  }, [open, profile?._id, activeTab]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  /* ================= CHECK EDIT PERMISSION ================= */
  const canEdit = () => {
    if (currentUser.role === "superadmin" || currentUser.role === "admin") return true;
    if (user) return user._id === currentUser._id;
    return currentUser._id === profile?._id;
  };

  const canEditPermissions = () => {
    return currentUser.role === "superadmin" || currentUser.role === "admin";
  };

  /* ================= SAVE PROFILE ================= */
  const saveProfile = async () => {
    if (!form?._id) return;

    setSaveError("");
    setSuccessMessage("");
    setIsSaving(true);

    if (!canEdit()) {
      setSaveError("You don't have permission to edit this profile");
      setIsSaving(false);
      return;
    }

    let reason = "";
    if (editMode) {
      const enteredReason = window.prompt("Please enter a reason for this update:");
      if (enteredReason === null) {
        setIsSaving(false);
        return;
      }
      if (!enteredReason.trim()) {
        setSaveError("Reason is required for profile updates.");
        setIsSaving(false);
        return;
      }
      reason = enteredReason.trim();
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/users/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.message || "Failed to save profile");
        return;
      }

      setProfile(data);
      setForm(data);
      setEditMode(false);
      setPermissionEditMode(false);
      setSuccessMessage("Profile updated successfully!");

      if (data._id === currentUser._id) {
        localStorage.setItem("user", JSON.stringify(data));
      }

      if (onUserUpdated) {
        onUserUpdated(data);
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile || !form) return null;

  const isSuperAdmin = currentUser.role === "superadmin";
  const isAdmin = currentUser.role === "admin";

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-40 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />

      {/* PANEL */}
      <aside
        className={`fixed top-0 right-0 h-screen w-full md:w-[35vw] min-w-[380px] max-w-140 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="h-full flex flex-col">

          {/* HEADER */}
          <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <UserCircle2 size={20} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800">
                {user ? `${user.firstname} ${user.lastname}'s Profile` : "My Profile"}
              </h2>
            </div>

            <div className="flex gap-2">
              {/* EDIT BUTTON */}
              {!editMode && !permissionEditMode && canEdit() && activeTab === "profile" && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  title="Edit profile"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              )}

              {/* PERMISSION EDIT BUTTON */}
              {!permissionEditMode && !editMode && canEditPermissions() && activeTab === "permissions" && (
                <button
                  onClick={() => setPermissionEditMode(true)}
                  className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
                  title="Edit permissions"
                >
                  <Shield size={14} />
                  Edit Permissions
                </button>
              )}

              {/* SAVE/CANCEL BUTTONS */}
              {(editMode || permissionEditMode) && (
                <>
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
                  >
                    <Save size={14} />
                    {isSaving ? "Saving..." : "Save"}
                  </button>

                  <button
                    onClick={() => {
                      if (editMode) {
                        setEditMode(false);
                        setForm(profile);
                      }
                      if (permissionEditMode) {
                        setPermissionEditMode(false);
                      }
                      setSaveError("");
                      setSuccessMessage("");
                    }}
                    className="text-sm bg-gray-400 text-white px-3 py-1.5 rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* CLOSE BUTTON */}
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "profile"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <UserCircle2 size={16} />
                Profile Details
              </div>
            </button>
            {(isSuperAdmin || isAdmin) && (
              <button
                onClick={() => setActiveTab("permissions")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "permissions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  Permissions
                </div>
              </button>
            )}
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* MESSAGES */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {saveError}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <ProfileDetailsTab
                profile={profile}
                form={form}
                editMode={editMode}
                isSuperAdmin={isSuperAdmin}
                onFieldChange={handleChange}
              />
            )}

            {/* PERMISSIONS TAB */}
            {activeTab === "permissions" && (
              <ProfilePermissionsTab
                profile={profile}
                detailedPermissions={detailedPermissions}
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
