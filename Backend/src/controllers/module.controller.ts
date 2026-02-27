import { Request, Response } from "express";
import { Module } from "../models/Module.model";

/* ================= CREATE MODULE ================= */
export const createModule = async (req: Request, res: Response) => {
  try {
    const { moduleName, description } = req.body;
    const user = (req as any).user;

    if (!moduleName || moduleName.trim().length < 3) {
      return res.status(400).json({ message: "Valid module name required" });
    }

    const exists = await Module.findOne({ moduleName });
    if (exists) {
      return res.status(400).json({ message: "Module already exists" });
    }

    const module = await Module.create({
      moduleName,
      description,
      createdBy: user.id,
      createdByName: user.username,
    });

    res.status(201).json(module);
  } catch (err) {
    console.error("CREATE MODULE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET MODULES ================= */
export const getModules = async (_req: Request, res: Response) => {
  const modules = await Module.find().sort({ createdAt: 1 });
  res.json(modules);
};

/* ================= DELETE MODULE ================= */
export const deleteModule = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const module = await Module.findById(id); 
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    await Module.findByIdAndDelete(id);
    res.json({ message: "Module deleted" });
  } catch (err) {
    console.error("DELETE MODULE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  } 
};