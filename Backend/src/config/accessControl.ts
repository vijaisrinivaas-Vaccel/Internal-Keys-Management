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
  // ===== GLOBAL / SYSTEM =====
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_REPORTS: "VIEW_REPORTS",
  ACCESS_SETTINGS: "ACCESS_SETTINGS",

  // ===== USER MANAGEMENT =====
  VIEW_USERS: "VIEW_USERS",
  CREATE_USER: "CREATE_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",

  // ===== ROLE MANAGEMENT =====
  VIEW_ROLES: "VIEW_ROLES",
  CREATE_ROLE: "CREATE_ROLE",
  UPDATE_ROLE: "UPDATE_ROLE",
  DELETE_ROLE: "DELETE_ROLE",

  // ===== PROJECT =====
  VIEW_PROJECTS: "VIEW_PROJECTS", // User's name for READ_PROJECT
  READ_PROJECT: "READ_PROJECT",
  CREATE_PROJECT: "CREATE_PROJECT",
  UPDATE_PROJECT: "UPDATE_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",
  ASSIGN_USER: "ASSIGN_USER",
  MANAGE_USERS: "MANAGE_USERS",

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
} as const;

export type Permission =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];