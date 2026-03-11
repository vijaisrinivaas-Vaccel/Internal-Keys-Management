// routes/template.routes.ts
import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from "../controllers/template.controller";

const router = Router();

router.use(authMiddleware);

// Get all templates (authenticated users)
router.get("/", getAllTemplates);

// Get single template
router.get("/:id", getTemplateById);

// Create template (admin/superadmin only)
router.post("/", authorizeRoles("admin", "superadmin"), createTemplate);

// Update template (admin/superadmin only)
router.put("/:id", authorizeRoles("admin", "superadmin"), updateTemplate);

// Delete template (superadmin only)
router.delete("/:id", authorizeRoles("superadmin"), deleteTemplate);

export default router;