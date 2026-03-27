import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import InactiveAccountDialog from "./InactiveAccountDialog";

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [page, setPage] = useState<"login" | "register">("login");
  const [inactiveDialogOpen, setInactiveDialogOpen] = useState(false);
  const [inactiveEmail, setInactiveEmail] = useState("");

  const handleInactiveAccount = (email: string) => {
    setInactiveEmail(email);
    setInactiveDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[500px] p-8 border dark:border-slate-800 transition-colors duration-300">
        {page === "login" && (
          <Login
            onSuccess={onLoginSuccess}
            onInactiveAccount={handleInactiveAccount}
          />
        )}

        {page === "register" && (
          <Register goToLogin={() => setPage("login")} />
        )}
      </div>

      {/* Inactive Account Dialog */}
      {inactiveDialogOpen && (
        <InactiveAccountDialog
          open={inactiveDialogOpen}
          onOpenChange={setInactiveDialogOpen}
          email={inactiveEmail}
        />
      )}
    </div>
  );
}
