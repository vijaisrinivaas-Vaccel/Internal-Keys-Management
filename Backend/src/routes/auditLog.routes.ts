import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogStats,
  exportAuditLogs,
  deleteAuditLog,
} from "../controllers/auditLog.controller";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", getAuditLogs);
router.get("/stats", getAuditLogStats);
router.get("/export", exportAuditLogs);
router.delete("/:id", authorizeRoles("superadmin"), deleteAuditLog);

export default router;
