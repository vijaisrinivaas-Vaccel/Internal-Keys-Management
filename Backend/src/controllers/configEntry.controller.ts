import { Request, Response } from "express";
import { ConfigEntry, decryptValue, encrypt } from "../models/ConfigEntry.model";
import mongoose from "mongoose";


/* ================= CREATE CONFIG ENTRY ================= */

export const createConfigEntry = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId, entries } = req.body;
    const user = (req as any).user;

    const encryptedEntries = entries.map((e: any) => ({
      ...e,
      value: "enc::" + encrypt(e.value),
    }));

    const updated = await ConfigEntry.findOneAndUpdate(
      { projectId, moduleId },
      {
        $push: { entries: { $each: encryptedEntries } },
        $set: { lastEditedByName: user.username },
      },
      { new: true, upsert: true }
    );

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET CONFIG ENTRIES ================= */

export const getConfigEntries = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId } = req.query;

    if (!projectId || !moduleId) {
      return res.status(400).json({
        message: "Missing projectId or moduleId",
      });
    }

    const config = await ConfigEntry.findOne({
      projectId,
      moduleId,
    }).lean(); // 🔥 lean makes it faster

    if (!config) return res.json([]);

    const processedEntries = config.entries.map((entry: any) => ({
      ...entry,
      value: decryptValue(entry.value),
      status: calculateStatus(entry),
    }));

    return res.json([
      {
        ...config,
        entries: processedEntries,
      },
    ]);
  } catch (error) {
    console.error("GET CONFIG ERROR:", error);
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

export const updateConfigEntryItem = async (
  req: Request,
  res: Response
) => {
  try {
    const { entryId } = req.params;
    const { key, value, expireAt, description } = req.body;
    const user = (req as any).user;

    const config = await ConfigEntry.findOne({
      "entries._id": entryId,
    });

    if (!config) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const entry: any = config.entries.find(
      (e: any) => e._id.toString() === entryId
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    entry.key = key;
    entry.value = "enc::" + encrypt(value); // 🔥 encrypt here
    entry.expireAt = expireAt;
    entry.description = description;
    entry.version += 1;

    config.lastEditedByName = user.username;

    await config.save();

    return res.json(config);
  } catch (err) {
    console.error("UPDATE ENTRY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE CONFIG ENTRY ================= */
export const deleteConfigEntryItem = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const updated = await ConfigEntry.findOneAndUpdate(
      { "entries._id": entryId },
      {
        $pull: { entries: { _id: entryId } },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("DELETE ENTRY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CALCULATE STATUS ================= */

const calculateStatus = (entry: any) => {
  const today = new Date();

  // Revoked first
  if (entry.isRevoked) return "revoked";

  // Expired
  if (entry.expireAt && new Date(entry.expireAt) < today) {
    return "expired";
  }

  // Near expiry (within 7 days)
  if (entry.expireAt) {
    const expireDate = new Date(entry.expireAt);
    const diff = expireDate.getTime() - today.getTime();

    if (diff > 0 && diff < 7 * 24 * 60 * 60 * 1000) {
      return "near_expiry";
    }
  }

  // New (created within 3 days)
  if (entry.createdAt) {
    const createdDate = new Date(entry.createdAt);
    const diff = today.getTime() - createdDate.getTime();

    if (diff < 3 * 24 * 60 * 60 * 1000) {
      return "new";
    }
  }

  return "active";
};