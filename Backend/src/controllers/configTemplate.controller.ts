import { Request, Response } from "express";
import ConfigTemplate from "../models/ConfigTemplate.model";
import mongoose from "mongoose";
import { logAudit } from "../middlewares/auditLogger";

const buildConfigSummary = (configs: any[] = []) =>
  `${configs.length} keys: ${configs.map((config) => config.key).join(", ")}`;

const buildConfigDiffSummary = (beforeConfigs: any[] = [], afterConfigs: any[] = []) => {
  const beforeMap = new Map(beforeConfigs.map((config) => [config.key, config]));
  const afterMap = new Map(afterConfigs.map((config) => [config.key, config]));

  const added = [...afterMap.keys()].filter((key) => !beforeMap.has(key));
  const removed = [...beforeMap.keys()].filter((key) => !afterMap.has(key));

  const changed: string[] = [];
  for (const [key, afterConfig] of afterMap.entries()) {
    const beforeConfig = beforeMap.get(key);
    if (!beforeConfig) continue;

    if (
      beforeConfig.value !== afterConfig.value ||
      (beforeConfig.description || "") !== (afterConfig.description || "")
    ) {
      changed.push(key);
    }
  }

  const parts: string[] = [];
  if (added.length > 0) parts.push(`Added keys: ${added.join(", ")}`);
  if (removed.length > 0) parts.push(`Removed keys: ${removed.join(", ")}`);
  if (changed.length > 0) parts.push(`Updated keys: ${changed.join(", ")}`);

  return parts.length > 0 ? parts.join(". ") : "No config key changes.";
};

/* ================= GET ALL TEMPLATES ================= */
export const getAllConfigTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await ConfigTemplate.find()
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SINGLE TEMPLATE ================= */
export const getConfigTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await ConfigTemplate.findById(id);
    
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CREATE TEMPLATE ================= */
export const createConfigTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, configs, reason, changeSummary } = req.body;
    const user = (req as any).user;

    if (!name) {
      return res.status(400).json({ message: "Template name is required" });
    }

    if (!configs || configs.length === 0) {
      return res.status(400).json({ message: "At least one config entry is required" });
    }

    // Check if template name already exists
    const existingTemplate = await ConfigTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({ message: "Template with this name already exists" });
    }

    const template = await ConfigTemplate.create({
      name,
      description,
      configs,
      createdBy: user.id,
      createdByName: user.username || "Unknown",
      version: 1
    });

    logAudit({
      category: "admin",
      action: "CREATE_CONFIG_TEMPLATE",
      userId: String(user.id),
      userName: user.username || "Unknown",
      targetId: String(template._id),
      details: `Created config template "${template.name}"`,
      metadata: {
        templateName: template.name,
        reason: reason || null,
        changeSummary: changeSummary || `Created template with ${buildConfigSummary(configs)}`
      },
      req,
    });

    res.status(201).json(template);
  } catch (err) {
    console.error("CREATE CONFIG TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE TEMPLATE ================= */
export const updateConfigTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, configs, reason, changeSummary } = req.body;
    const user = (req as any).user;

    const template = await ConfigTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if updating to an existing name (excluding current)
    if (name && name !== template.name) {
      const existingTemplate = await ConfigTemplate.findOne({ name });
      if (existingTemplate) {
        return res.status(400).json({ message: "Template with this name already exists" });
      }
    }

    const previousConfigs = [...(template.configs || [])];
    const previousName = template.name;
    const previousDescription = template.description || "";

    template.name = name || template.name;
    template.description = description !== undefined ? description : template.description;
    template.configs = configs || template.configs;
    template.version += 1;
    template.updatedBy = user.id;
    template.updatedByName = user.username;

    await template.save();

    const summaryParts: string[] = [];
    if (previousName !== template.name) {
      summaryParts.push(`Name: "${previousName}" -> "${template.name}"`);
    }
    if (previousDescription !== (template.description || "")) {
      summaryParts.push("Description updated");
    }
    summaryParts.push(buildConfigDiffSummary(previousConfigs as any[], template.configs as any[]));

    logAudit({
      category: "admin",
      action: "UPDATE_CONFIG_TEMPLATE",
      userId: String(user.id),
      userName: user.username || "Unknown",
      targetId: String(template._id),
      details: `Updated config template "${template.name}"`,
      metadata: {
        templateName: template.name,
        version: template.version,
        reason: reason || null,
        changeSummary: changeSummary || summaryParts.join(". ")
      },
      req,
    });

    res.json(template);
  } catch (err) {
    console.error("UPDATE CONFIG TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE TEMPLATE ================= */
export const deleteConfigTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, changeSummary } = req.body || {};
    const user = (req as any).user;
    const template = await ConfigTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    await ConfigTemplate.findByIdAndDelete(id);

    logAudit({
      category: "admin",
      action: "DELETE_CONFIG_TEMPLATE",
      userId: String(user?.id || "system"),
      userName: user?.username || "System",
      targetId: String(id),
      details: `Deleted config template "${template.name}"`,
      metadata: {
        templateName: template.name,
        reason: reason || null,
        changeSummary: changeSummary || `Deleted template with ${buildConfigSummary(template.configs as any[])}`
      },
      req,
    });

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= APPLY TEMPLATE TO MODULE ================= */
export const applyTemplateToModule = async (req: Request, res: Response) => {
  try {
    const { templateId, moduleId, environmentId, projectId } = req.body;
    const user = (req as any).user;

    const template = await ConfigTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Create config entries from template
    const configEntries = template.configs.map(config => ({
      key: config.key,
      value: config.value,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Update or create config
    const ConfigEntry = mongoose.model("ConfigEntry");
    const updated = await ConfigEntry.findOneAndUpdate(
      { projectId, moduleId, environmentId },
      {
        $push: { entries: { $each: configEntries } },
        $setOnInsert: {
          createdBy: user.id,
          createdByName: user.username
        },
        $set: {
          lastEditedByName: user.username,
          updatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      message: `Applied ${configEntries.length} configurations from template`,
      config: updated
    });
  } catch (err) {
    console.error("APPLY TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
