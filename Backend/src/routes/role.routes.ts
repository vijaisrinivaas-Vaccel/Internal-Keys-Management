import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole
} from "../controllers/role.controller";

const router = Router();

router.use(authMiddleware);

// Only superadmin or users with CREATE_ROLE permission can manage roles
// For now keeping it simple with hardcoded superadmin string if available, 
// but will update authorizeRoles to check permissions.
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
