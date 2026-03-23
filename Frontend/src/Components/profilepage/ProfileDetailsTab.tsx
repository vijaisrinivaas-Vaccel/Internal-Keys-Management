// profilePage/ProfileDetailsTab.tsx
import type { ProfileData } from "./ProfilePage";

interface ProfileDetailsTabProps {
  profile: ProfileData;
  form: ProfileData;
  editMode: boolean;
  isSuperAdmin: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export default function ProfileDetailsTab({
  profile,
  form,
  editMode,
  isSuperAdmin,
  onFieldChange,
}: ProfileDetailsTabProps) {
  return (
    <>
      {/* PROFILE AVATAR */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {profile.firstname?.charAt(0).toUpperCase()}
          {profile.lastname?.charAt(0).toUpperCase()}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{profile.firstname} {profile.lastname}</h3>
          <p className="text-sm text-gray-500">@{profile.username}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${profile.role === "superadmin" ? "bg-purple-100 text-purple-700" :
              profile.role === "admin" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-700"
            }`}>
            {profile.role}
          </span>
          {profile.isActive !== undefined && (
            <span className={`text-xs px-3 py-1 rounded-full ${profile.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
              {profile.isActive ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      {/* PROFILE FIELDS */}
      <div className="grid grid-cols-1 gap-3">
        <EditableField
          label="First Name"
          value={form.firstname}
          editMode={editMode}
          onChange={(v: string) => onFieldChange("firstname", v)}
        />

        <EditableField
          label="Last Name"
          value={form.lastname}
          editMode={editMode}
          onChange={(v: string) => onFieldChange("lastname", v)}
        />

        <EditableField
          label="Email"
          value={form.email}
          editMode={editMode}
          type="email"
          onChange={(v: string) => onFieldChange("email", v)}
        />

        <EditableField
          label="Employee ID"
          value={form.employeeId}
          editMode={editMode}
          onChange={(v: string) => onFieldChange("employeeId", v)}
        />

        <SelectField
          label="Job Role"
          value={form.jobRole}
          editMode={editMode}
          options={[
            "software_developer",
            "frontend_developer",
            "backend_developer",
            "full_stack_developer",
            "devops_engineer",
          ]}
          onChange={(v: string) => onFieldChange("jobRole", v)}
        />

        <SelectField
          label="Job Level"
          value={form.jobLevel}
          editMode={editMode}
          options={["intern", "junior", "mid", "senior", "lead"]}
          onChange={(v: string) => onFieldChange("jobLevel", v)}
        />

        {isSuperAdmin && (
          <EditableField
            label="Username"
            value={form.username}
            editMode={editMode}
            onChange={(v: string) => onFieldChange("username", v)}
          />
        )}
      </div>
    </>
  );
}

/* ================= FIELD ================= */
interface FieldProps {
  label: string;
  value: string;
  editMode: boolean;
  onChange: (value: string) => void;
  type?: string;
}

function EditableField({
  label,
  value,
  editMode,
  onChange,
  type = "text",
}: FieldProps) {
  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <p className="text-xs uppercase text-gray-500">{label}</p>

      {editMode ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <p className="text-sm font-medium mt-1">{value || "-"}</p>
      )}
    </div>
  );
}

/* ================= SELECT ================= */
interface SelectProps {
  label: string;
  value?: string;
  editMode: boolean;
  options: string[];
  onChange: (value: string) => void;
}

function SelectField({
  label,
  value,
  editMode,
  options,
  onChange,
}: SelectProps) {
  const formatLabel = (str: string) => {
    return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <p className="text-xs uppercase text-gray-500">{label}</p>

      {editMode ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select {label}</option>
          {options.map((o: string) => (
            <option key={o} value={o}>
              {formatLabel(o)}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm font-medium mt-1">
          {value ? formatLabel(value) : "-"}
        </p>
      )}
    </div>
  );
}