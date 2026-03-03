import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

// Get all users (admin + superadmin)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "superadmin"),
  getAllUsers
);

// Update role (superadmin only)
router.put(
  "/:id/role",
  authMiddleware,
  authorizeRoles("superadmin"),
  updateUserRole
);

// Activate / Deactivate
router.put(
  "/:id/status",
  authMiddleware,
  authorizeRoles("admin", "superadmin"),
  toggleUserStatus
);

// Delete user (superadmin only)
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("superadmin"),
  deleteUser
);

export default router;