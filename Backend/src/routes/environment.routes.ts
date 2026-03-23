import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createEnvironment,
  getEnvironments,
  updateEnvironment,
  deleteEnvironment,
} from "../controllers/environment.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createEnvironment);
router.get("/", getEnvironments);
router.put("/:id", updateEnvironment);
router.delete("/:id", deleteEnvironment);

export default router;