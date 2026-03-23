import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import {
  getAllConfigTemplates,
  getConfigTemplateById,
  createConfigTemplate,
  updateConfigTemplate,
  deleteConfigTemplate,
  applyTemplateToModule
} from "../controllers/configTemplate.controller";

const router = Router();

router.use(authMiddleware);

// Get all templates (authenticated users)
router.get("/", getAllConfigTemplates);

// Get single template
router.get("/:id", getConfigTemplateById);

// Create template (admin/superadmin only)
router.post("/", authorizeRoles("admin", "superadmin"), createConfigTemplate);

// Update template (admin/superadmin only)
router.put("/:id", authorizeRoles("admin", "superadmin"), updateConfigTemplate);

// Delete template (superadmin only)
router.delete("/:id", authorizeRoles("superadmin"), deleteConfigTemplate);

// Apply template to module
router.post("/apply", applyTemplateToModule);

export default router;