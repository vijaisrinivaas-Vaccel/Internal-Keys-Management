import { Request, Response } from "express";
import { Module } from "../models/Module.model";
import { ConfigEntry } from "../models/ConfigEntry.model";

/* ================= CREATE MODULE ================= */
export const createModule = async (req: Request, res: Response) => {
  try {
    const { moduleName, description, projectId, environmentId } = req.body;
    const user = (req as any).user;

    if (!moduleName || moduleName.trim().length < 3) {
      return res.status(400).json({ message: "Valid module name required" });
    }

    const exists = await Module.findOne({
      moduleName,
      projectId,
      environmentId,
    });
    if (exists) {
      return res.status(400).json({ message: "Module already exists" });
    }

    const module = await Module.create({
      moduleName,
      description,
      projectId,
      environmentId,
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
export const getModules = async (req: Request, res: Response) => {
  const { projectId, environmentId } = req.query;

  const modules = await Module.find({
    projectId,
    environmentId,
  });

  res.json(modules);
};

/* ================= DELETE MODULE ================= */
export const deleteModule = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1️⃣ Find module first
    const module = await Module.findById(id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    // 2️⃣ Check if any configs exist for this module
    const configExists = await ConfigEntry.exists({
      projectId: module.projectId,
      environmentId: module.environmentId,
      moduleId: module._id,
      "entries.0": { $exists: true },
    });

    // 3️⃣ If keys exist → block deletion
    if (configExists) {
      return res.status(400).json({
        message: "There are still keys left in this module",
      });
    }

    // 4️⃣ If no keys → delete module
    await Module.findByIdAndDelete(id);

    return res.json({ message: "Module deleted successfully" });

  } catch (err) {
    console.error("DELETE MODULE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { moduleName } = req.body;

    const updated = await Module.findByIdAndUpdate(
      id,
      { moduleName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};