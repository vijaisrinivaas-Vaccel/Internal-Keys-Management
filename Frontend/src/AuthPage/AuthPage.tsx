import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [page, setPage] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-300 ">
      <div className="bg-white w-150 rounded-xl shadow-xl p-5">
        {page === "login" && (
          <Login
            onSuccess={onLoginSuccess}
            goToRegister={() => setPage("register")}
          />
        )}

        
      <div>
        {page === "register" && (
          <Register goToLogin={() => setPage("login")} />
        )}
      </div>
      </div>
    </div>
  );
}
