import { useState } from "react";
import { type User } from "../userModel/User";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { registerRequest } from "../lib/auth";


interface RegisterProps {
  goToLogin: () => void;
}


export default function Register({ goToLogin }: RegisterProps) {
  
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState<User>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    employeeId: "",
    role: "user",
  });

  const passwordRules = {
    minLength: form.password.length >= 6,
    hasLetter: /[A-Z]/.test(form.password),
    hasNumber: /\d/.test(form.password),
    hasSpecial: /[!@#$%^&*()+=<>?{}[\]~]/.test(form.password),
    noSpaces: !/\s/.test(form.password),
  };

  const passwordsMatch =
    form.password && confirmPassword && form.password === confirmPassword;


  const handleRegister = async () => {
    if (!form.firstname || !form.lastname || !form.email || !form.password || !form.role) {
      alert("All fields are required ❌");
      return;
    }

    if ( !passwordRules.minLength || !passwordRules.hasLetter || !passwordRules.hasNumber || !passwordRules.hasSpecial || !passwordRules.noSpaces ) {
    alert("Password does not meet requirements ❌");
    return;
  }

  if (!passwordsMatch) {
    alert("Passwords do not match ❌");
    return;
  }

  
    const res = await registerRequest(form);
  
    const data = await res.json();
  
    if (!res.ok) {
      alert(data.message);
      return;
    }
  
    alert("Registered successfully ✅");
    goToLogin();
  };


  return (
    <>
      <h2 className="text-2xl font-bold text-center ">Register</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
  {/* Firstname */}
  <div>
    <label className="text-sm text-gray-900">Firstname</label>
    <input
      type="text"
      value={form.firstname}
      onChange={(e) =>
        setForm({ ...form, firstname: e.target.value })
      }
      className="w-full border-b border-gray-300 outline-none py-2 focus:border-blue-500"
    />
  </div>

  {/* Lastname */}
  <div>
    <label className="text-sm text-gray-900">Lastname</label>
    <input
      type="text"
      value={form.lastname}
      onChange={(e) =>
        setForm({ ...form, lastname: e.target.value })
      }
      className="w-full border-b border-gray-300 outline-none py-2 focus:border-blue-500"
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-4 mb-4">
  {/* Role */}
  <div>
    <label className="text-sm text-gray-900">Role</label>
    <select
      value={form.role}
      onChange={(e) =>
        setForm({
          ...form,
          role: e.target.value as "user" | "admin" | "superadmin",
        })
      }
      className="w-full border-b border-gray-300 outline-none py-2 focus:border-blue-500"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
      <option value="superadmin">Superadmin</option>
    </select>
  </div>

  {/* Employee ID */}
  <div>
    <label className="text-sm text-gray-900">Employee ID</label>
    <input
      type="text"
      value={form.employeeId}
      onChange={(e) =>
        setForm({ ...form, employeeId: e.target.value })
      }
      className="w-full border-b border-gray-300 outline-none py-2 focus:border-blue-500"
    />
  </div>
</div>

{/* Email Full Width */}
<div className="mb-4">
  <label className="text-sm text-gray-900">Email</label>
  <input
    type="email"
    value={form.email}
    onChange={(e) =>
      setForm({ ...form, email: e.target.value })
    }
    className="w-full border-b border-gray-300 outline-none py-2 focus:border-blue-500"
  />
</div>

{/* Password + Confirm Side by Side */}
<div className="grid grid-cols-2 gap-4 mb-4">
  {/* Password */}
  <div className="relative">
    <label className="text-sm text-gray-900">Password</label>
    <input
      type={showPassword ? "text" : "password"}
      value={form.password}
      onChange={(e) =>
        setForm({ ...form, password: e.target.value })
      }
      className="w-full border-b border-gray-300 outline-none py-2 pr-10 focus:border-blue-500"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-2 top-9 text-gray-500"
    >
      {showPassword ? <FiEyeOff /> : <FiEye />}
    </button>
    <div className="mt-3 text-sm space-y-1">
        
          <p className={passwordRules.minLength ? "text-green-600" : "text-red-500"}>
            • Minimum 6 characters
          </p>
        
          <p className={passwordRules.hasLetter ? "text-green-600" : "text-red-500"}>
            • At least one Capital letter
          </p>
        
          <p className={passwordRules.hasNumber ? "text-green-600" : "text-red-500"}>
            • At least one number
          </p>
        
          <p className={passwordRules.hasSpecial ? "text-green-600" : "text-red-500"}>
            • At least one special character
          </p>
        
        </div>
  </div>

  {/* Confirm Password */}
  <div className="relative">
    <label className="text-sm text-gray-900">
      Confirm Password
    </label>
    <input
      type={showConfirmPassword ? "text" : "password"}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      className="w-full border-b border-gray-300 outline-none py-2 pr-10 focus:border-blue-500"
    />
    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword(!showConfirmPassword)
      }
      className="absolute right-2 top-9 text-gray-500"
    >
      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
    </button>

    {confirmPassword && (
          <p
            className={
              passwordsMatch
                ? "text-green-600 text-sm mt-1"
                : "text-red-500 text-sm mt-1"
            }
          >
            {passwordsMatch ? "Passwords match ✔" : "Passwords do not match"}
          </p>
        )}

  </div>
</div>




      <button onClick={handleRegister} className="w-full py-3 rounded-full text-white font-semibold bg-linear-to-r from-blue-100 via-blue-300 to-blue-500 hover:opacity-90 transition">
        REGISTER
      </button>

      <p className="text-center text-sm mt-6">
        Already have an account?{" "}
        <span
          className="text-purple-500 font-semibold cursor-pointer"
          onClick={goToLogin}
        >
          Login
        </span>
      </p>
    </>
  );
}
