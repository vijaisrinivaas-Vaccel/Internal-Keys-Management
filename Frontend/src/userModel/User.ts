export interface User {
  firstname: string;
  lastname: string;
  employeeId?: string;
  email: string;
  password: string;
  role: "user" | "admin" | "superadmin";
}
