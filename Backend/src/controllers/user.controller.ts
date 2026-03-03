import { Request, Response } from "express";
import User from "../models/User.model";

/* ================= GET USERS ================= */
export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await User.find().select("-password");
  res.json(users);
};

/* ================= UPDATE ROLE ================= */
export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const updated = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select("-password");

  res.json(updated);
};

/* ================= TOGGLE STATUS ================= */
export const toggleUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isActive = !user.isActive;
  await user.save();

  res.json(user);
};

/* ================= DELETE ================= */
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
};