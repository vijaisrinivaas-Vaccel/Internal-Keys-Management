import { useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { loginRequest, setAccessToken } from "../lib/auth";

interface LoginProps {
  onSuccess: () => void;
  onInactiveAccount: (email: string) => void;
}

export default function Login({ onSuccess, onInactiveAccount }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await loginRequest(email, password);
      const data = await res.json();

      if (!res.ok) {
        // Check if it's an inactive account error
        if (data.message === "ACCOUNT_INACTIVE") {
          onInactiveAccount(email);
          return;
        }
        setError(data.message || "Invalid credentials");
        return;
      }

      if (data.accessToken) {
        setAccessToken(data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        onSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          placeholder="Type your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              passwordInputRef.current?.focus();
            }
          }}
          className="w-full border-b border-gray-300 outline-none py-2 focus:border-purple-500 transition-colors"
        />
      </div>

      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          ref={passwordInputRef}
          type={showPassword ? "text" : "password"}
          placeholder="Type your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLogin();
            }
          }}
          className="w-full border-b border-gray-300 outline-none py-2 focus:border-purple-500 transition-colors pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-3 rounded-full text-white font-semibold bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Logging in..." : "LOGIN"}
      </button>
    </>
  );
}
