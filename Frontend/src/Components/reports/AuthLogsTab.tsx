import AuditLogTable from "./AuditLogTable";

const AUTH_ACTIONS = [
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
];

export default function AuthLogsTab() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Authentication Logs</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track all login and logout activities across the system
        </p>
      </div>
      <AuditLogTable category="auth" actionOptions={AUTH_ACTIONS} />
    </div>
  );
}
