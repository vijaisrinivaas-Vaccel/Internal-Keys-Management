import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createConfigEntry,
  getConfigEntries,
  updateConfigEntry,
  deleteConfigEntry,
} from "../controllers/configEntry.controller";

const router = Router();

router.get("/", authMiddleware, getConfigEntries);
router.post("/", authMiddleware, createConfigEntry);
router.put("/:id", authMiddleware, updateConfigEntry);
router.delete("/:id", authMiddleware, deleteConfigEntry);

export default router;