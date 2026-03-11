import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  updateUserProfile,
  resetPassword,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

// All routes are protected with authMiddleware
router.use(authMiddleware);

/* ================= PUBLIC PROFILE ROUTES (authenticated users) ================= */

// Get current user profile
router.get("/me", getUserById);

// Reset own password
router.post("/reset-password", resetPassword);

/* ================= ADMIN/SUPERADMIN ROUTES ================= */

// Get all users (admin + superadmin)
router.get("/", authorizeRoles("admin", "superadmin"), getAllUsers);

// Get single user by ID (admin + superadmin)
router.get("/:id", authorizeRoles("admin", "superadmin"), getUserById);

// Update user profile (users can update own profile, admins can update any)
router.put("/:id",authorizeRoles("admin", "superadmin"),updateUserProfile); // Permission check is in controller

// Activate/Deactivate user (admin + superadmin)
router.put("/:id/status", authorizeRoles("admin", "superadmin"), toggleUserStatus);

/* ================= SUPERADMIN ONLY ROUTES ================= */

// Update user role (superadmin only)
router.put("/:id/role", authorizeRoles("superadmin"), updateUserRole);

// Delete user (superadmin only)
router.delete("/:id", authorizeRoles("superadmin"), deleteUser);

export default router;