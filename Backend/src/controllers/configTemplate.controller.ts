import { Request, Response } from "express";
import ConfigTemplate from "../models/ConfigTemplate.model";
import mongoose from "mongoose";

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
    const { name, description, configs } = req.body;
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
    const { name, description, configs } = req.body;
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

    template.name = name || template.name;
    template.description = description !== undefined ? description : template.description;
    template.configs = configs || template.configs;
    template.version += 1;
    template.updatedBy = user.id;
    template.updatedByName = user.username;

    await template.save();
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
    
    await ConfigTemplate.findByIdAndDelete(id);
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
      { upsert: true, new: true }
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