import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware";
import { 
  createProject, getProjects, updateProject, deleteProject
 } from "../controllers/project.controller";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

const router = Router();

router.get("/", authMiddleware, getProjects);

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