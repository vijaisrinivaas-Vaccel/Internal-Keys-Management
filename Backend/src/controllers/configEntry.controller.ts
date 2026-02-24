import { Request, Response } from "express";
import { ConfigEntry } from "../models/ConfigEntry.model";

/* ================= CREATE CONFIG ENTRY ================= */

export const createConfigEntry = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId, entries } = req.body;
    const user = (req as any).user;

    if (!projectId || !moduleId || !entries || !Array.isArray(entries)) {
      return res.status(400).json({
        message: "projectId, moduleId and entries array are required",
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({ message: "Entries cannot be empty" });
    }

    const config = await ConfigEntry.create({
      projectId,
      moduleId,
      entries,
      createdBy: user.id,
      createdByName: user.username,
    });

    return res.status(201).json(config);
  } catch (err) {
    console.error("CREATE CONFIG ENTRY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET CONFIG ENTRIES ================= */
export const getConfigEntries = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId } = req.query;

    if (!projectId || !moduleId) {
      return res.status(400).json({
        message: "projectId and moduleId are required",
      });
    }

    const configs = await ConfigEntry.find({
      projectId,
      moduleId,
    }).sort({ createdAt: -1 });

    return res.json(configs);
  } catch (err) {
    console.error("GET CONFIG ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE CONFIG ENTRY ================= */
export const updateConfigEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { entries } = req.body;
    const user = (req as any).user;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ message: "Entries array required" });
    }

    const updated = await ConfigEntry.findByIdAndUpdate(
      id,
      {
        entries,
        lastEditedByName: user.username,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Config not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE CONFIG ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE CONFIG ENTRY ================= */
export const deleteConfigEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await ConfigEntry.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Config not found" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE CONFIG ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};