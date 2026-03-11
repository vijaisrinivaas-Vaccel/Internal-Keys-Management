/* ================= JOB ROLES ================= */

export const JOB_ROLES = {
  SOFTWARE_DEVELOPER: "software_developer",
  FULL_STACK_DEVELOPER: "full_stack_developer",
  FRONTEND_DEVELOPER: "frontend_developer",
  BACKEND_DEVELOPER: "backend_developer",
  DEVOPS_ENGINEER: "devops_engineer",
} as const;

export type JobRole =
  typeof JOB_ROLES[keyof typeof JOB_ROLES];

/* ================= JOB LEVELS ================= */

export const JOB_LEVELS = {
  INTERN:"intern",
  JUNIOR: "junior",
  MID: "mid",
  SENIOR: "senior",
  LEAD: "lead",
} as const;

export type JobLevel =
  typeof JOB_LEVELS[keyof typeof JOB_LEVELS];

/* ================= PERMISSIONS ================= */

export const PERMISSIONS = {
  // ===== PROJECT =====
  CREATE_PROJECT: "CREATE_PROJECT",
  READ_PROJECT: "READ_PROJECT",
  UPDATE_PROJECT: "UPDATE_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",

  // ===== ENVIRONMENT =====
  CREATE_ENVIRONMENT: "CREATE_ENVIRONMENT",
  READ_ENVIRONMENT: "READ_ENVIRONMENT",
  UPDATE_ENVIRONMENT: "UPDATE_ENVIRONMENT",
  DELETE_ENVIRONMENT: "DELETE_ENVIRONMENT",

  // ===== MODULE =====
  CREATE_MODULE: "CREATE_MODULE",
  READ_MODULE: "READ_MODULE",
  UPDATE_MODULE: "UPDATE_MODULE",
  DELETE_MODULE: "DELETE_MODULE",

  // ===== CONFIG =====
  CREATE_CONFIG: "CREATE_CONFIG",
  READ_CONFIG: "READ_CONFIG",
  UPDATE_CONFIG: "UPDATE_CONFIG",
  DELETE_CONFIG: "DELETE_CONFIG",

  // ===== USER / ASSIGNMENT =====
  ASSIGN_USER: "ASSIGN_USER",
  MANAGE_USERS: "MANAGE_USERS",

  // ===== REPORTS =====
  VIEW_REPORTS: "VIEW_REPORTS",
} as const;

export type Permission =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];