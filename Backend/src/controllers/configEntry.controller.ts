import { Request, Response } from "express";
import { ConfigEntry, decryptValue, encrypt } from "../models/ConfigEntry.model";
import dotenv from "dotenv";


/* ================= CREATE CONFIG ENTRY ================= */
export const createConfigEntry = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId, environmentId, entries } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const encryptedEntries = entries.map((e: any) => ({
      ...e,
      value: "enc::" + encrypt(e.value),
    }));

    // Prepare the update document
    const updateDoc: any = {
      $push: { entries: { $each: encryptedEntries } },
      $set: { 
        lastEditedByName: user.username || "system",
        updatedAt: new Date()
      },
    };

    // Add $setOnInsert for new document creation
    updateDoc.$setOnInsert = {
      createdBy: user.id,
      createdByName: user.username || "system",
      createdAt: new Date()
    };

    const updated = await ConfigEntry.findOneAndUpdate(
      { projectId, moduleId, environmentId },
      updateDoc,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true  // This ensures schema defaults are applied
      }
    );

    return res.json(updated);
  } catch (err) {
    console.error("CREATE CONFIG ERROR:", err);
    return res.status(500).json({ message: "Server error: " + (err as Error).message });
  }
};

/* ================= GET CONFIG ENTRIES ================= */

export const getConfigEntries = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId, environmentId } = req.query;

    if (!projectId || !moduleId) {
      return res.status(400).json({
        message: "Missing projectId or moduleId",
      });
    }

    const config = await ConfigEntry.findOne({
      projectId,
      moduleId,
      environmentId,
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
        lastEditedByName: user?.username || "system",
      },
      { 
        returnDocument: 'after',
        new: true 
      }
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
    entry.value = "enc::" + encrypt(value);
    entry.expireAt = expireAt;
    entry.description = description;
    entry.version += 1;

    config.lastEditedByName = user?.username || "system";

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
    const { id } = req.params;

    const updated = await ConfigEntry.findOneAndUpdate(
      { "entries._id": id },
      {
        $pull: { entries: { _id: id } },
      },
      { 
        returnDocument: 'after',
        new: true 
      }
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

export const importEnvFile = async (req: Request, res: Response) => {
  try {
    const { projectId, environmentId, moduleId, entries } = req.body;
    const user = (req as any).user;


    if (!user || !user.id) {
      return res.status(401).json({ 
        message: "User not authenticated or user ID missing" 
      });
    }
    

    if (!projectId || !environmentId || !moduleId) {
      return res.status(400).json({ 
        message: "Missing required fields: projectId, environmentId, moduleId" 
      });
    }

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ 
        message: "Entries array is required" 
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({ 
        message: "No entries to import" 
      });
    }

    // Encrypt values and prepare entries
    const encryptedEntries = entries.map((e: any) => ({
      key: e.key,
      value: "enc::" + encrypt(e.value),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Find existing config
    const existingConfig = await ConfigEntry.findOne({
      projectId,
      environmentId,
      moduleId
    });

    if (existingConfig) {
      // Check for duplicate keys
      const existingKeys = new Set(existingConfig.entries.map((e: any) => e.key));
      const newEntries = encryptedEntries.filter(e => !existingKeys.has(e.key));
      const duplicates = encryptedEntries.filter(e => existingKeys.has(e.key));

      if (newEntries.length === 0) {
        return res.status(400).json({ 
          message: "All keys already exist in this configuration",
          duplicates: duplicates.map(d => d.key)
        });
      }

      // Add only new entries
      const updated = await ConfigEntry.findOneAndUpdate(
        { projectId, environmentId, moduleId },
        {
          $push: { entries: { $each: newEntries } },
          $set: { 
            lastEditedByName: user?.username || "system",
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      return res.json({
        message: `Imported ${newEntries.length} new entries. ${duplicates.length} duplicate keys skipped.`,
        config: updated,
        duplicates: duplicates.map(d => d.key)
      });
    } else {
      // Create new config
      const newConfig = await ConfigEntry.create({
        projectId,
        environmentId,
        moduleId,
        entries: encryptedEntries,
        createdBy: user?.id,
        createdByName: user?.username || "system",
        lastEditedByName: user?.username || "system"
      });

      return res.status(201).json({
        message: `Successfully imported ${encryptedEntries.length} entries`,
        config: newConfig
      });
    }
  } catch (err) {
    console.error("IMPORT ENV ERROR:", err);
    res.status(500).json({ 
      message: err instanceof Error ? err.message : "Import failed" 
    });
  }
};

export const exportEnvFile = async (req: Request, res: Response) => {

  try {

    const { projectId, environmentId, moduleId } = req.query;

    const config = await ConfigEntry.findOne({
      projectId,
      environmentId,
      moduleId
    }).lean();

    if (!config) {
      return res.status(404).json({ message: "No config found" });
    }

    const envContent = config.entries
      .map((entry: any) => {

        const value = decryptValue(entry.value);

        return `${entry.key}=${value}`;

      })
      .join("\n");

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=config.env"
    );

    res.setHeader("Content-Type", "text/plain");

    res.send(envContent);

  } catch (err) {
    console.error("EXPORT ENV ERROR", err);
    res.status(500).json({ message: "Export failed" });
  }

};