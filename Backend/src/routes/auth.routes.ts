import { Router } from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  resetPassword,
} from "../controllers/auth.controller";

import {
  authMiddleware,
  attachUserIfPresent,
  authorizeRoles,
} from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", attachUserIfPresent, logout);

router.get("/me", authMiddleware, getMe);
router.post("/reset-password", authMiddleware, resetPassword);

router.get(
  "/dashboard",
  authMiddleware,
  (req, res) => {
    res.json({ message: "Dashboard data" });
  }
);

export default router;
