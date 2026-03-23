import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createModule, getModules, deleteModule, updateModule, setParentModule } from "../controllers/module.controller";

const router = Router();

router.use(authMiddleware);

router.post("/",createModule);
router.get("/", getModules);
router.delete("/:id" , deleteModule);
router.put("/:id/set-parent", setParentModule);
router.put("/:id", updateModule);


export default router;