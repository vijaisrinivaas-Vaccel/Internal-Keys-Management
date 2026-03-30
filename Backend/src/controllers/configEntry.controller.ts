import { Request, Response } from "express";
import { ConfigEntry, decryptValue, encrypt } from "../models/ConfigEntry.model";
import ProjectUserPermission from "../models/ProjectUserPermission.model";
import User from "../models/User.model";
import { Module } from "../models/Module.model";
import {Permission , PERMISSIONS} from "../config/accessControl";
import { logAudit } from "../middlewares/auditLogger";

/* ================= CHECK CONFIG PERMISSION ================= */
const checkConfigPermission = async (
  userId: string,
  projectId: string,
  environmentId: string,
  moduleId: string,
  configId: string | null,
  requiredPermission: Permission
): Promise<boolean> => {
  // Superadmin can do everything
  const user = await User.findById(userId).populate("roleId");
  const roleName = (user?.roleId as any)?.name || "user";
  if (roleName === "superadmin") return true;

  // Check if user has permission
  const permission = await ProjectUserPermission.findOne({
    projectId,
    userId
  });

  if (!permission) return false;

  const environment = permission.environments.find(
    env => env.environmentId.toString() === environmentId
  );

  if (!environment) return false;

  const module = environment.modules?.find(
    mod => mod.moduleId.toString() === moduleId
  );

  if (!module) return false;

  // If accessAll is true and we're checking a specific config, grant access.
  // The module's accessAll overrides individual config permissions.
  if (module.accessAll && configId) {
    return true; 
  }

  // If checking specific config
  if (configId) {
    const config = module.configEntries?.find(
      c => c.configId.toString() === configId
    );
    if (!config) return false;
    return config.permissions.includes(requiredPermission);
  }

  // For module-level operations (CREATE_CONFIG)
  return module.permissions.includes(requiredPermission);
};

const summarizeItems = (items: string[], label = "items"): string => {
  const cleaned = Array.from(
    new Set(
      items
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );

  if (cleaned.length === 0) return `No ${label}`;
  const preview = cleaned.slice(0, 6).join(", ");
  const remaining = cleaned.length - 6;

  return remaining > 0 ? `${preview} (+${remaining} more)` : preview;
};

const formatDateForChange = (value: unknown): string => {
  if (!value) return "none";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString();
};

/* ================= CREATE CONFIG ENTRY ================= */
export const createConfigEntry = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId, environmentId, entries } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check permission
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkConfigPermission(
        user.id,
        projectId,
        environmentId,
        moduleId,
        null,
        PERMISSIONS.CREATE_CONFIG
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to create config entries" });
      }
    }

    const encryptedEntries = entries.map((e: any) => ({
      ...e,
      value: "enc::" + encrypt(e.value),
      expireAt: e.expireAt || null,
    }));

    const updateDoc: any = {
      $push: { entries: { $each: encryptedEntries } },
      $set: { 
        lastEditedBy: user.id || "system",
        updatedAt: new Date()
      },
    };

    updateDoc.$setOnInsert = {
      createdBy: user.id,
      createdAt: new Date()
    };

    const updated = await ConfigEntry.findOneAndUpdate(
      { projectId, moduleId, environmentId },
      updateDoc,
      { 
        upsert: true, 
        returnDocument: 'after',
        setDefaultsOnInsert: true
      }
    );

    // Audit log: CREATE_CONFIG
    const createdKeys = entries.map((entry: any) => entry?.key).filter(Boolean);
    logAudit({
      category: "activity",
      action: "CREATE_CONFIG",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(updated?._id),
      details: `Created ${entries.length} config entry(ies)`,
      metadata: {
        projectId,
        moduleId,
        environmentId,
        entryCount: entries.length,
        createdKeys,
        changeSummary: `Added config keys: ${summarizeItems(createdKeys, "keys")}`,
      },
      req,
    });

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
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!projectId || !moduleId || !environmentId) {
      return res.status(400).json({
        message: "Missing projectId, moduleId, or environmentId",
      });
    }

    // Get config
    const config = await ConfigEntry.findOne({
      projectId,
      moduleId,
      environmentId,
    }).lean();
    
    // Always return an array with a consistent structure
    if (!config) {
      return res.json([{
        _id: null,
        moduleId,
        environmentId,
        projectId,
        entries: []
      }]);
    }

    // Superadmin sees all entries
    if (user.roleName === "superadmin") {
      const processedEntries = config.entries.map((entry: any) => ({
        ...entry,
        value: decryptValue(entry.value),
        status: calculateStatus(entry),
      }));

      return res.json([{
        ...config,
        entries: processedEntries,
      }]);
    }

    // For other users, filter config entries based on permissions
    const permission = await ProjectUserPermission.findOne({
      projectId,
      userId: user.id
    });

    if (!permission) {
      return res.json([{
        _id: config._id,
        moduleId,
        environmentId,
        projectId,
        entries: []
      }]);
    }

    const environment = permission.environments.find(
      env => env.environmentId.toString() === environmentId.toString()
    );

    if (!environment) {
      return res.json([{
        _id: config._id,
        moduleId,
        environmentId,
        projectId,
        entries: []
      }]);
    }

    const module = environment.modules?.find(
      mod => mod.moduleId.toString() === moduleId.toString()
    );

    if (!module) {
      return res.json([{
        _id: config._id,
        moduleId,
        environmentId,
        projectId,
        entries: []
      }]);
    }
    
    // Get config IDs that user has READ_CONFIG permission for
    const accessibleConfigIds = module.configEntries
      ?.filter(c => {
        const hasRead = c.permissions.includes(PERMISSIONS.READ_CONFIG);
        return hasRead;
      })
      .map(c => c.configId.toString()) || [];

    // Filter and process entries
    const processedEntries = config.entries
      .filter((entry: any) => {
        if (module.accessAll) return true;
        const isAccessible = accessibleConfigIds.includes(entry._id.toString());
        return isAccessible;
      })
      .map((entry: any) => {
        let entryPermissions: string[] = [];
        
        if (module.accessAll) {
          // If accessAll is true, derive config permissions from module permissions
          if (module.permissions.includes(PERMISSIONS.READ_MODULE)) entryPermissions.push(PERMISSIONS.READ_CONFIG);
          if (module.permissions.includes(PERMISSIONS.UPDATE_MODULE)) entryPermissions.push(PERMISSIONS.UPDATE_CONFIG);
          if (module.permissions.includes(PERMISSIONS.DELETE_MODULE)) entryPermissions.push(PERMISSIONS.DELETE_CONFIG);
        } else {
          // Otherwise, use specific config permissions
          const configPerm = module.configEntries?.find(
            (c: any) => c.configId.toString() === entry._id.toString()
          );
          if (configPerm) {
            entryPermissions = configPerm.permissions;
          }
        }

        return {
          ...entry,
          value: decryptValue(entry.value),
          status: calculateStatus(entry),
          permissions: entryPermissions
        };
      });

    return res.json([{
      ...config,
      entries: processedEntries,
    }]);
  } catch (error) {
    console.error("❌ GET CONFIG ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE CONFIG ENTRY ================= */
export const updateConfigEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { entries } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ message: "Entries array required" });
    }

    // Get config to check permissions
    const config = await ConfigEntry.findById(id);
    if (!config) {
      return res.status(404).json({ message: "Config not found" });
    }

    // Check permission for first entry (assuming all entries same module)
    if (user.roleName !== "superadmin" && entries.length > 0) {
      const hasPermission = await checkConfigPermission(
        user.id,
        config.projectId.toString(),
        config.environmentId.toString(),
        config.moduleId.toString(),
        entries[0]._id,
        PERMISSIONS.UPDATE_CONFIG
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update config entries" });
      }
    }

    const previousEntries = (config.entries || []).map((entry: any) => ({
      id: entry._id?.toString(),
      key: entry.key,
      value: entry.value,
      expireAt: entry.expireAt ? new Date(entry.expireAt).toISOString() : null,
      description: entry.description || "",
    }));

    const updated = await ConfigEntry.findByIdAndUpdate(
      id,
      {
        entries,
        lastEditedBy: user?.fullName || "system",
      },
      { 
        returnDocument: 'after'
      }
    );

    const nextEntries = (entries || []).map((entry: any) => ({
      id: entry?._id ? String(entry._id) : undefined,
      key: entry?.key,
      value: entry?.value,
      expireAt: entry?.expireAt ? new Date(entry.expireAt).toISOString() : null,
      description: entry?.description || "",
    }));

    const previousById = new Map(previousEntries.map((entry) => [entry.id, entry]));
    const nextById = new Map(nextEntries.filter((entry) => entry.id).map((entry) => [entry.id, entry]));

    const addedKeys = nextEntries
      .filter((entry) => !entry.id || !previousById.has(entry.id))
      .map((entry) => entry.key)
      .filter(Boolean) as string[];

    const removedKeys = previousEntries
      .filter((entry) => !entry.id || !nextById.has(entry.id))
      .map((entry) => entry.key)
      .filter(Boolean) as string[];

    const updatedKeys = nextEntries
      .filter((entry) => entry.id && previousById.has(entry.id))
      .filter((entry) => {
        const oldEntry = previousById.get(entry.id!)!;
        return (
          oldEntry.key !== entry.key ||
          oldEntry.value !== entry.value ||
          oldEntry.expireAt !== entry.expireAt ||
          oldEntry.description !== entry.description
        );
      })
      .map((entry) => entry.key)
      .filter(Boolean) as string[];

    const changeParts: string[] = [];
    if (addedKeys.length > 0) {
      changeParts.push(`Added keys: ${summarizeItems(addedKeys, "keys")}`);
    }
    if (updatedKeys.length > 0) {
      changeParts.push(`Updated keys: ${summarizeItems(updatedKeys, "keys")}`);
    }
    if (removedKeys.length > 0) {
      changeParts.push(`Removed keys: ${summarizeItems(removedKeys, "keys")}`);
    }

    const changeSummary =
      changeParts.length > 0
        ? changeParts.join(". ")
        : "Updated configuration entries (no key-level differences detected)";

    logAudit({
      category: "activity",
      action: "UPDATE_CONFIG",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(updated?._id || id),
      details: `Updated ${entries.length} config entry(ies)`,
      metadata: {
        projectId: String(config.projectId),
        moduleId: String(config.moduleId),
        environmentId: String(config.environmentId),
        addedKeys,
        updatedKeys,
        removedKeys,
        changeSummary,
      },
      req,
    });

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE CONFIG ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE CONFIG ENTRY ITEM ================= */
export const updateConfigEntryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { key, value, expireAt, description } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const entryId = Array.isArray(id) ? id[0] : id; 

    const config = await ConfigEntry.findOne({
      "entries._id": entryId,
    });

    if (!config) {
      return res.status(404).json({ message: "Entry not found" });
    }

    // Check permission
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkConfigPermission(
        user.id,
        config.projectId.toString(),
        config.environmentId.toString(),
        config.moduleId.toString(),
        entryId,
        PERMISSIONS.UPDATE_CONFIG
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update this config entry" });
      }
    }

    const entry: any = config.entries.find(
      (e: any) => e._id.toString() === entryId
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const previousKey = String(entry.key || "");
    const previousValue = String(entry.value || "");
    const previousPlainValue = decryptValue(previousValue);
    const previousExpireAt = entry.expireAt ? new Date(entry.expireAt).toISOString() : null;
    const previousDescription = entry.description || "";

    entry.key = key;
    entry.value = "enc::" + encrypt(value);
    entry.expireAt = expireAt || null;
    entry.description = description;
    entry.version += 1;

    config.lastEditedBy = user.id;

    await config.save();

    const changedParts: string[] = [];
    if (previousKey !== key) {
      changedParts.push(`Renamed key from "${previousKey}" to "${key}"`);
    }
    if (previousPlainValue !== String(value)) {
      changedParts.push(`Updated value for key "${key}"`);
    }
    const nextExpireAt = entry.expireAt ? new Date(entry.expireAt).toISOString() : null;
    if (previousExpireAt !== nextExpireAt) {
      changedParts.push(
        `Changed expiry for "${key}" from ${formatDateForChange(previousExpireAt)} to ${formatDateForChange(nextExpireAt)}`
      );
    }
    if (previousDescription !== (description || "")) {
      changedParts.push(`Updated description for key "${key}"`);
    }

    logAudit({
      category: "activity",
      action: "UPDATE_CONFIG",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(config._id),
      details: `Updated config key "${key}"`,
      metadata: {
        projectId: String(config.projectId),
        moduleId: String(config.moduleId),
        environmentId: String(config.environmentId),
        entryId: entryId,
        key,
        previousKey,
        changeSummary:
          changedParts.length > 0
            ? changedParts.join(". ")
            : `Updated config key "${key}"`,
      },
      req,
    });

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
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const entryId = Array.isArray(id) ? id[0] : id; 

    const config = await ConfigEntry.findOne({
      "entries._id": entryId,
    });

    if (!config) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const entryToDelete: any = config.entries.find(
      (e: any) => e._id.toString() === entryId
    );
    const deletedKey = entryToDelete?.key || "unknown";

    // Check permission
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkConfigPermission(
        user.id,
        config.projectId.toString(),
        config.environmentId.toString(),
        config.moduleId.toString(),
        entryId,
        PERMISSIONS.DELETE_CONFIG
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to delete this config entry" });
      }
    }

    const updated = await ConfigEntry.findOneAndUpdate(
      { "entries._id": entryId },
      {
        $pull: { entries: { _id: entryId } },
      },
      { 
        returnDocument: 'after'
      }
    );

    logAudit({
      category: "activity",
      action: "DELETE_CONFIG",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(config._id),
      details: `Deleted config key "${deletedKey}"`,
      metadata: {
        projectId: String(config.projectId),
        moduleId: String(config.moduleId),
        environmentId: String(config.environmentId),
        entryId,
        deletedKey,
        changeSummary: `Removed config key: ${deletedKey}`,
      },
      req,
    });

    res.json(updated);
  } catch (err) {
    console.error("DELETE ENTRY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= IMPORT ENV FILE ================= */
export const importEnvFile = async (req: Request, res: Response) => {
  try {
    const { projectId, environmentId, moduleId, entries } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ 
        message: "User not authenticated or user ID missing" 
      });
    }

    // Check permission
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkConfigPermission(
        user.id,
        projectId,
        environmentId,
        moduleId,
        null,
        PERMISSIONS.CREATE_CONFIG
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to import config entries" });
      }
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
            lastEditedBy: user?.fullName || "system",
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      const importedKeys = newEntries.map((entry) => entry.key);
      const duplicateKeys = duplicates.map((entry) => entry.key);
      const summaryParts = [
        `Imported keys: ${summarizeItems(importedKeys, "keys")}`,
      ];

      if (duplicateKeys.length > 0) {
        summaryParts.push(`Skipped duplicate keys: ${summarizeItems(duplicateKeys, "keys")}`);
      }

      logAudit({
        category: "activity",
        action: "IMPORT_CONFIG",
        userId: String(user.id),
        fullName: user.fullName || "Unknown",
        targetId: String(updated?._id),
        details: `Imported ${newEntries.length} config entry(ies)`,
        metadata: {
          projectId,
          moduleId,
          environmentId,
          importedKeys,
          duplicateKeys,
          importedCount: newEntries.length,
          duplicateCount: duplicateKeys.length,
          changeSummary: summaryParts.join(". "),
        },
        req,
      });

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
        lastEditedBy: user?.fullName || "system"
      });

      const importedKeys = encryptedEntries.map((entry) => entry.key);
      logAudit({
        category: "activity",
        action: "IMPORT_CONFIG",
        userId: String(user.id),
        fullName: user.fullName || "Unknown",
        targetId: String(newConfig._id),
        details: `Imported ${encryptedEntries.length} config entry(ies)`,
        metadata: {
          projectId,
          moduleId,
          environmentId,
          importedKeys,
          importedCount: encryptedEntries.length,
          changeSummary: `Imported keys: ${summarizeItems(importedKeys, "keys")}`,
        },
        req,
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

/* ================= EXPORT ENV FILE ================= */
export const exportEnvFile = async (req: Request, res: Response) => {
  try {
    const { projectId, environmentId, moduleId } = req.query;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const config = await ConfigEntry.findOne({
      projectId,
      environmentId,
      moduleId
    }).lean();

    if (!config) {
      return res.status(404).json({ message: "No config found" });
    }

    // Superadmin can export all
    if (user.roleName === "superadmin") {
      const exportedKeys = config.entries.map((entry: any) => entry.key).filter(Boolean);
      const envContent = config.entries
        .map((entry: any) => {
          const value = decryptValue(entry.value);
          return `${entry.key}=${value}`;
        })
        .join("\n");

      logAudit({
        category: "activity",
        action: "EXPORT_CONFIG",
        userId: String(user.id),
        fullName: user.fullName || "Unknown",
        targetId: String(config._id),
        details: `Exported ${config.entries.length} config entry(ies)`,
        metadata: {
          projectId: String(projectId || ""),
          moduleId: String(moduleId || ""),
          environmentId: String(environmentId || ""),
          exportedKeys,
          exportedCount: exportedKeys.length,
          changeSummary: `Exported keys: ${summarizeItems(exportedKeys, "keys")}`,
        },
        req,
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=config.env"
      );
      res.setHeader("Content-Type", "text/plain");
      return res.send(envContent);
    }

    // For other users, check which configs they can see
    const permission = await ProjectUserPermission.findOne({
      projectId,
      userId: user.id
    });

    if (!permission) {
      return res.status(403).json({ message: "No access to this project" });
    }

    const environment = permission.environments.find(
      env => env.environmentId.toString() === environmentId
    );

    if (!environment) {
      return res.status(403).json({ message: "No access to this environment" });
    }

    const module = environment.modules?.find(
      mod => mod.moduleId.toString() === moduleId
    );

    if (!module) {
      return res.status(403).json({ message: "No access to this module" });
    }

    // Get accessible config IDs
    const accessibleConfigIds = module.configEntries?.map(c => 
      c.configId.toString()
    ) || [];

    // Filter entries
    const accessibleEntries = module.accessAll 
      ? config.entries 
      : config.entries.filter((entry: any) =>
          accessibleConfigIds.includes(entry._id.toString())
        );

    const exportedKeys = accessibleEntries.map((entry: any) => entry.key).filter(Boolean);

    const envContent = accessibleEntries
      .map((entry: any) => {
        const value = decryptValue(entry.value);
        return `${entry.key}=${value}`;
      })
      .join("\n");

    logAudit({
      category: "activity",
      action: "EXPORT_CONFIG",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(config._id),
      details: `Exported ${accessibleEntries.length} config entry(ies)`,
      metadata: {
        projectId: String(projectId || ""),
        moduleId: String(moduleId || ""),
        environmentId: String(environmentId || ""),
        exportedKeys,
        exportedCount: exportedKeys.length,
        accessAll: Boolean(module.accessAll),
        changeSummary: `Exported keys: ${summarizeItems(exportedKeys, "keys")}`,
      },
      req,
    });

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

/* ================= CALCULATE STATUS ================= */
const calculateStatus = (entry: any) => {
  const today = new Date();

  if (entry.isRevoked) return "revoked";

  if (entry.expireAt && new Date(entry.expireAt) < today) {
    return "expired";
  }

  if (entry.expireAt) {
    const expireDate = new Date(entry.expireAt);
    const diff = expireDate.getTime() - today.getTime();

    if (diff > 0 && diff < 7 * 24 * 60 * 60 * 1000) {
      return "near_expiry";
    }
  }

  if (entry.createdAt) {
    const createdDate = new Date(entry.createdAt);
    const diff = today.getTime() - createdDate.getTime();

    if (diff < 3 * 24 * 60 * 60 * 1000) {
      return "new";
    }
  }

  return "active";
};

export const transferConfigEntries = async (req: Request, res: Response) => {
  try {
    const { sourceModuleId, targetModuleId, environmentId, projectId, entries, action } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!["move", "copy"].includes(String(action))) {
      return res.status(400).json({ message: "Invalid transfer action" });
    }

    const selectedKeys = (entries || []).map((entry: any) => entry?.key).filter(Boolean);

    const [sourceModule, targetModule] = await Promise.all([
      Module.findById(sourceModuleId).select("moduleName"),
      Module.findById(targetModuleId).select("moduleName"),
    ]);

    if (action === "move") {
      // Remove from source module
      await ConfigEntry.updateOne(
        { moduleId: sourceModuleId, environmentId, projectId },
        { $pull: { entries: { _id: { $in: entries.map((e: any) => e._id) } } } }
      );
    }

    // Add to target module
    const targetConfig = await ConfigEntry.findOneAndUpdate(
      { moduleId: targetModuleId, environmentId, projectId },
      {
        $push: { entries: { $each: entries.map((e: any) => ({
          key: e.key,
          value: e.value,
          expireAt: e.expireAt,
          description: e.description,
          keyStatus: e.keyStatus,
          version: e.version || 1,
          createdAt: new Date(),
          updatedAt: new Date()
        })) } },
        $setOnInsert: {
          createdBy: user.id,
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const transferLabel = action === "move" ? "Moved" : "Copied";
    const actionName = action === "move" ? "MOVE_CONFIG" : "COPY_CONFIG";

    logAudit({
      category: "activity",
      action: actionName,
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(targetConfig?._id),
      details: `${transferLabel} ${selectedKeys.length} config entry(ies)`,
      metadata: {
        projectId,
        environmentId,
        sourceModuleId,
        targetModuleId,
        sourceModuleName: sourceModule?.moduleName || "Unknown",
        targetModuleName: targetModule?.moduleName || "Unknown",
        selectedKeys,
        action,
        changeSummary: `${transferLabel} keys to "${targetModule?.moduleName || "target module"}": ${summarizeItems(selectedKeys, "keys")}. Source module: "${sourceModule?.moduleName || "unknown"}"`,
      },
      req,
    });

    res.json({ message: `${action} successful`, config: targetConfig });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: "Failed to transfer configurations" });
  }
};

/* ================= SYNC FROM PARENT ================= */
export const syncFromParent = async (req: Request, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string;
    const user = (req as any).user;

    const userId = user?.id || user?._id;

    if (!user || !userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 1. Get the current module
    const currentModule = await Module.findById(moduleId);
    if (!currentModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (currentModule.isParent) {
      return res.status(400).json({ message: "Current module is already a parent" });
    }

    // Check permission - require update config permission
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkConfigPermission(
        userId,
        currentModule.projectId.toString(),
        currentModule.environmentId.toString(),
        moduleId,
        null,
        PERMISSIONS.UPDATE_CONFIG
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to sync config entries" });
      }
    }

    // 2. Find the parent module in the same environment
    const parentModule = await Module.findOne({
      environmentId: currentModule.environmentId,
      isParent: true
    });

    if (!parentModule) {
      return res.status(404).json({ message: "No parent module found in this environment" });
    }

    // 3. Get configs for both
    const parentConfig = await ConfigEntry.findOne({ moduleId: parentModule._id }).lean();
    if (!parentConfig || !parentConfig.entries || parentConfig.entries.length === 0) {
      return res.status(400).json({ message: "Parent module has no configurations" });
    }

    const currentConfig = await ConfigEntry.findOne({ moduleId: currentModule._id });
    if (!currentConfig || !currentConfig.entries || currentConfig.entries.length === 0) {
      return res.status(400).json({ message: "Current module has no configurations to sync" });
    }

    // 4. Sync values
    let updatedCount = 0;
    const updatedKeys: string[] = [];
    const parentEntriesMap = new Map();
    
    parentConfig.entries.forEach((e: any) => {
      try {
        if (e.key && e.value) parentEntriesMap.set(e.key, decryptValue(e.value));
      } catch (err) {}
    });

    currentConfig.entries.forEach((e: any) => {
      try {
        if (parentEntriesMap.has(e.key) && e.key && e.value) {
          const parentPlainValue = parentEntriesMap.get(e.key);
          const currentPlainValue = decryptValue(e.value);

          if (parentPlainValue !== currentPlainValue) {
            e.value = "enc::" + encrypt(parentPlainValue);
            e.version = (e.version || 1) + 1;
            updatedCount++;
            updatedKeys.push(e.key);
          }
        }
      } catch (err) {}
    });

    if (updatedCount > 0) {
      if (!currentConfig.createdBy) currentConfig.createdBy = userId;
      currentConfig.lastEditedBy = userId;
      await currentConfig.save();
    }

    const changeSummary =
      updatedCount > 0
        ? `Fetched from parent module "${parentModule.moduleName}". Updated keys: ${summarizeItems(updatedKeys, "keys")}`
        : `Fetched from parent module "${parentModule.moduleName}". No key values changed`;

    logAudit({
      category: "activity",
      action: "FETCH_PARENT_CONFIG",
      userId: String(userId),
      fullName: user.fullName || "Unknown",
      targetId: String(currentConfig._id),
      details: `Fetched ${updatedCount} configuration(s) from parent module`,
      metadata: {
        projectId: String(currentModule.projectId),
        environmentId: String(currentModule.environmentId),
        moduleId: String(currentModule._id),
        moduleName: currentModule.moduleName,
        parentModuleId: String(parentModule._id),
        parentModuleName: parentModule.moduleName,
        updatedCount,
        updatedKeys,
        changeSummary,
      },
      req,
    });

    res.json({ 
      message: `Successfully synced ${updatedCount} configuration(s) from parent module`,
      updatedCount 
    });

  } catch (err: any) {
    console.error("SYNC FROM PARENT ERROR:", err);
    require('fs').writeFileSync('sync-error.log', err.stack || err.toString());
    res.status(500).json({ message: "Server error", error: err.stack || err.toString() });
  }
};
