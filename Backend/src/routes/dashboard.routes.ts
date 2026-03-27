import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getDashboardSummary } from "../controllers/dashboard.controller";

const router = Router();

router.use(authMiddleware);
router.get("/summary", getDashboardSummary);

export default router;
