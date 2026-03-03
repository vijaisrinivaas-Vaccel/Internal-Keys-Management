import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createEnvironment,
  getEnvironments,
} from "../controllers/environment.controller";

const router = Router();

router.post("/", authMiddleware, createEnvironment);
router.get("/", authMiddleware, getEnvironments);

export default router;