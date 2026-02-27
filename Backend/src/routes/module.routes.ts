import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import { createModule, getModules, deleteModule } from "../controllers/module.controller";

const router = Router();

router.get("/", authMiddleware, getModules);
router.delete("/:id", authMiddleware, authorizeRoles("superadmin") , deleteModule);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("superadmin"), // only superadmin can create
  createModule
);

export default router;