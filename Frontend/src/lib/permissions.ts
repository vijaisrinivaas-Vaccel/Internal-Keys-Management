export type Role = "admin" | "superadmin" | "user";

export const permissions = {
  forSuperadmin: ["superadmin"],
  forAdmins: ["admin", "superadmin"],
  forUsers: ["user", "admin", "superadmin"],
};
