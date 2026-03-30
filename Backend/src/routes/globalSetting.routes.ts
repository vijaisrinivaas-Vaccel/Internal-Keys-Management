import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import { getGlobalSettings, updateMaintenanceMode } from "../controllers/globalSetting.controller";

const router = Router();

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Get global settings (available to all authenticated users so they know maintenance status)
router.get("/", getGlobalSettings);

// Update maintenance mode (superadmin only)
router.put("/maintenance", authorizeRoles("superadmin"), updateMaintenanceMode);

export default router;
