import type { Role } from "../lib/permissions";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}