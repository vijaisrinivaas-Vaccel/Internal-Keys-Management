import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  getUserProjectPermissions,
  updateUserProjectPermissions,
  getAllProjectsWithUserPermissions,
} from "../controllers/projectPermission.controller";

const router = Router();

router.use(authMiddleware);

// Get all projects with user's permissions
router.get(
  "/users/:userId/projects",
  authorizeRoles("admin", "superadmin"),
  getAllProjectsWithUserPermissions
);

// Get user's permissions for all projects
router.get(
  "/users/:userId/project-permissions",
  authorizeRoles("admin", "superadmin"),
  getUserProjectPermissions
);

// Update user's permissions for a specific project
router.put(
  "/projects/:projectId/user-permissions/:userId",
  authorizeRoles("admin", "superadmin"),
  updateUserProjectPermissions
);

export default router;