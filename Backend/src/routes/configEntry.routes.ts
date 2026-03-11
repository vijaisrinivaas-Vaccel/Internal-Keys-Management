import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createConfigEntry,
  getConfigEntries,
  updateConfigEntry,
  deleteConfigEntryItem,
  exportEnvFile,
  importEnvFile,
} from "../controllers/configEntry.controller";

import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage()
});

const router = Router();

router.get("/", authMiddleware, getConfigEntries);
router.post("/", authMiddleware, createConfigEntry);
router.post(
"/import-env",
authMiddleware,
upload.single("file"),
importEnvFile
);

router.get(
"/export-env",
authMiddleware,
exportEnvFile
);
router.put("/:id", authMiddleware, updateConfigEntry);
router.delete("/delEntry/:id", authMiddleware, deleteConfigEntryItem);

export default router;