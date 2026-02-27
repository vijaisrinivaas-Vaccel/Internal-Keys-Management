import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createConfigEntry,
  getConfigEntries,
  updateConfigEntry,
  deleteConfigEntryItem,
} from "../controllers/configEntry.controller";

const router = Router();

router.get("/", authMiddleware, getConfigEntries);
router.post("/", authMiddleware, createConfigEntry);
router.put("/:id", authMiddleware, updateConfigEntry);
router.delete("/:id", authMiddleware, deleteConfigEntryItem);

export default router;