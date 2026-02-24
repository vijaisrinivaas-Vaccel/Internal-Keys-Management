import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getMe, logoutRequest } from "../../lib/auth";

interface User {
  username: string;
  role: "user" | "admin" | "superadmin";
}

export default function Topbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getMe();
      if (!res.ok) return;

      const data = await res.json();
      setUser(data);
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

  if (!user) return null;

  return (
    <header className="h-16 bg-white shadow flex items-center justify-end px-8 relative">
      <div
        className="flex items-center gap-2 cursor-pointer font-semibold"
        onClick={() => setOpen(!open)}
      >
        <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center">
          {user.username[0]}
        </div>
        {user.username}
      </div>

      {open && (
        <div className="absolute top-16 right-8 bg-white shadow-lg rounded-md w-40">
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</div>
          <div
            className="px-4 py-2 hover:bg-gray-100 text-red-500 cursor-pointer"
            onClick={logout}
          >
            Logout
          </div>
        </div>
      )}
    </header>
  );
}
