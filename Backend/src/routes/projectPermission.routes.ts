import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  assignProjectPermissions,
  updateUserProjectPermissions,
  getUserProjectPermissions,
  getAllProjectsWithUserPermissions,
  bulkAssignPermissions,
  removeUserProjectPermissions,
  getProjectAssignedUsers,
  getUserDetailedPermissions
} from "../controllers/projectPermission.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/projects/:projectId/assign-permissions",
  assignProjectPermissions
);

// Get all projects with user's permissions
router.get(
  "/users/:userId/projects",
  authorizeRoles("admin", "superadmin"),
  getAllProjectsWithUserPermissions
);

// Get specific user's permissions for a project
router.get(
  "/projects/:projectId/users/:userId",
  getUserProjectPermissions
);

router.get(
  "/projects/:projectId/assigned-users",
  authorizeRoles("admin", "superadmin"),
  getProjectAssignedUsers
);

// Update user's permissions for a specific project (hierarchical)
router.put(
  "/projects/:projectId/users/:userId",
  authorizeRoles("admin", "superadmin"),
  updateUserProjectPermissions
);

// Bulk assign permissions to multiple users for a project
router.post(
  "/projects/:projectId/bulk-assign",
  authorizeRoles("admin", "superadmin"),
  bulkAssignPermissions
);

// Remove user's permissions from a project
router.delete(
  "/projects/:projectId/users/:userId",
  authorizeRoles("admin", "superadmin"),
  removeUserProjectPermissions
);

// Get specific user's detailed permissions across all projects
router.get(
  "/users/:userId/detailed-permissions",
  getUserDetailedPermissions
);

export default router;