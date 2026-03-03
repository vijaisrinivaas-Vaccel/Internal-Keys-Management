import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware";
import { 
  createProject, getProjectsForModule, updateProject, deleteProject, getAllProjects, getProjectById
 } from "../controllers/project.controller";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

const router = Router();

router.get("/", authMiddleware, getAllProjects);
router.get("/by-module", authMiddleware, getProjectsForModule);
router.get("/:id", authMiddleware, getProjectById);

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  createProject
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("file"),
  updateProject
);

router.delete("/:id", authMiddleware, deleteProject);

export default router;