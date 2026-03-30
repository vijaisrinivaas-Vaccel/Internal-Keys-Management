import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Shield, User, LogOut, UserPen, Sun, Moon } from "lucide-react";
import { clearAuth, getMe, logoutRequest } from "../../lib/auth";
import ProfilePage from "../profilepage/ProfilePage";
import { useTheme } from "../../context/ThemeContext";

interface UserData {
  fullName: string;
  role: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  employeeId?: string;
  jobRole?: string;
  jobLevel?: string;
}

export default function Topbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }

    const fetchUser = async () => {
      const res = await getMe();
      if (!res.ok) return;

      const data = await res.json();
      setUser(data);
      // Update localStorage to ensure consistency across components
      localStorage.setItem("user", JSON.stringify(data));
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // no-op
    } finally {
      clearAuth();
      navigate("/");
      window.location.reload();
    }
  };

  const getRoleConfig = (role: string) => {
    const r = role.toLowerCase();
    switch (r) {
      case "superadmin":
        return {
          icon: Crown,
          label: "Super Admin",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
          borderColor: "border-purple-300",
          badgeBg: "bg-gradient-to-r from-purple-500 to-purple-600",
        };
      case "admin":
        return {
          icon: Shield,
          label: "Admin",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-300",
          badgeBg: "bg-gradient-to-r from-blue-500 to-blue-600",
        };
      case "user":
        return {
          icon: User,
          label: "User",
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          borderColor: "border-orange-300",
          badgeBg: "bg-gradient-to-r from-orange-500 to-orange-600",
        };
      default:
        // Dynamic roles (e.g., Support, Developer)
        return {
          icon: Shield,
          label: role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " "),
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-300",
          badgeBg: "bg-gradient-to-r from-green-500 to-green-600",
        };
    }
  };

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 shadow-md flex items-center justify-between px-8 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center gap-4">
          
        </div>

        <div className="flex items-center gap-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${roleConfig.bgColor} ${roleConfig.borderColor} dark:bg-slate-800 dark:border-slate-700`}
          >
            <RoleIcon size={16} className={`${roleConfig.textColor} dark:text-gray-300`} />
            <span className={`text-xs font-semibold ${roleConfig.textColor} dark:text-gray-300`}>
              {roleConfig.label}
            </span>
          </div>

          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => setOpen(!open)}
          >
            <div
              className={`w-10 h-10 rounded-full ${roleConfig.badgeBg} text-white flex items-center justify-center font-bold shadow-md`}
            >
              {user.fullName?.[0]?.toUpperCase() || "?"}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {user.firstname && user.lastname
                  ? `${user.firstname} ${user.lastname}`
                  : user.fullName || "User"}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {user.email || "No email"}
              </span>
            </div>

            <svg
              className={`w-4 h-4 text-gray-600 dark:text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {open && (
          <div className="absolute top-16 right-8 bg-white dark:bg-slate-900 shadow-xl rounded-xl w-48 border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              <div
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 font-medium"
                onClick={() => {
                  setIsProfileOpen(true);
                  setOpen(false);
                }}
              >
                <UserPen size={16} className="text-blue-500" />
                Profile
              </div>
              <div
                className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold"
                onClick={logout}
              >
                <LogOut size={16} />
                Logout
              </div>
            </div>
          </div>
        )}
      </header>

      <ProfilePage
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
