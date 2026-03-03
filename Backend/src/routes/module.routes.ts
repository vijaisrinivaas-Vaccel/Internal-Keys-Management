import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import { createModule, getModules, deleteModule, updateModule } from "../controllers/module.controller";

const router = Router();

router.get("/", authMiddleware, getModules);
router.delete("/:id", authMiddleware, authorizeRoles("superadmin") , deleteModule);
router.put("/:id", authMiddleware, updateModule);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("superadmin"), // only superadmin can create
  createModule
);

export default router;