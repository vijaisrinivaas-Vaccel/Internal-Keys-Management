import { Request, Response } from "express";
import { Module } from "../models/Module.model";

export const createModule = async (req: Request, res: Response) => {
  try {
    const { moduleName, description } = req.body;
    const user = (req as any).user;

    if (!moduleName) {
      return res.status(400).json({ message: "Module name required" });
    }

    const module = await Module.create({
      moduleName,
      description,
      createdBy: user.id,
      createdByName: user.username,
    });

    return res.status(201).json(module);
  } catch (err) {
    console.error("CREATE MODULE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getModules = async (_req: Request, res: Response) => {
  const modules = await Module.find().sort({ createdAt: -1 });
  return res.json(modules);
};