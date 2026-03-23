import { Request, Response } from "express";
import { ConfigEntry, decryptValue, encrypt } from "../models/ConfigEntry.model";
import ProjectUserPermission from "../models/ProjectUserPermission.model";
import User from "../models/User.model";
import { Module } from "../models/Module.model";
import {Permission , PERMISSIONS} from "../config/accessControl";

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
  const user = await User.findById(userId);
  if (user?.role === "superadmin") return true;

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

/* ================= CREATE CONFIG ENTRY ================= */
export const createConfigEntry = async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId, environmentId, entries } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check permission
    if (user.role !== "superadmin") {
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
        lastEditedByName: user.username || "system",
        updatedAt: new Date()
      },
    };

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
        setDefaultsOnInsert: true
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
    if (user.role === "superadmin") {
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
    if (user.role !== "superadmin" && entries.length > 0) {
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
    if (user.role !== "superadmin") {
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

    entry.key = key;
    entry.value = "enc::" + encrypt(value);
    entry.expireAt = expireAt || null;
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
    if (user.role !== "superadmin") {
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
        returnDocument: 'after',
        new: true 
      }
    );

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
    if (user.role !== "superadmin") {
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
    if (user.role === "superadmin") {
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

    const envContent = accessibleEntries
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
          createdByName: user.username,
        }
      },
      { upsert: true, new: true }
    );

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
    if (user.role !== "superadmin") {
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
          }
        }
      } catch (err) {}
    });

    if (updatedCount > 0) {
      if (!currentConfig.createdBy) currentConfig.createdBy = userId;
      if (!currentConfig.createdByName) currentConfig.createdByName = user.username || "system";
      currentConfig.lastEditedByName = user.username || "system";
      await currentConfig.save();
    }

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