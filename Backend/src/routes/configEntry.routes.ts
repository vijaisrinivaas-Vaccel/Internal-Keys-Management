import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createConfigEntry,
  getConfigEntries,
  updateConfigEntry,
  updateConfigEntryItem,
  deleteConfigEntryItem, 
  exportEnvFile,
  importEnvFile,
  transferConfigEntries,
  syncFromParent,
} from "../controllers/configEntry.controller";

import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage()
});

const router = Router();

router.get("/", authMiddleware, getConfigEntries);
router.post("/", authMiddleware, createConfigEntry);
router.post("/import-env", authMiddleware, upload.single("file"), importEnvFile);
router.get("/export-env", authMiddleware, exportEnvFile);
router.put("/:id", authMiddleware, updateConfigEntry);
router.put("/entry/:id", authMiddleware, updateConfigEntryItem);
router.delete("/delEntry/:id", authMiddleware, deleteConfigEntryItem);
router.post("/transfer", authMiddleware, transferConfigEntries);
router.post("/sync-parent/:moduleId", authMiddleware, syncFromParent);

export default router;