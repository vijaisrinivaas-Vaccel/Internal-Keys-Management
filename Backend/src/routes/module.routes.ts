import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware";
import { createModule, getModules } from "../controllers/module.controller";

const router = Router();

router.get("/", authMiddleware, getModules);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("superadmin"), // only superadmin can create
  createModule
);

export default router;