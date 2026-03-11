import { Request, Response } from "express";
import ProjectTemplate from "../models/ProjectTemplate.model";
import {Project} from "../models/Project.model";
import {Environment} from "../models/Environment.model";
import {Module} from "../models/Module.model";

/* ================= GET ALL TEMPLATES ================= */
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await ProjectTemplate.find({ isActive: true })
      .sort({ isGlobal: -1, createdAt: -1 });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SINGLE TEMPLATE ================= */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await ProjectTemplate.findById(id);
    
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
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, environments, isGlobal } = req.body;
    const user = (req as any).user;

    // Validate environments
    if (!environments || environments.length === 0) {
      return res.status(400).json({ message: "At least one environment is required" });
    }

    if (isGlobal) {
      await ProjectTemplate.updateMany(
        { isGlobal: true },
        { $set: { isGlobal: false } }
      );
    }

    // Check if template name already exists
    const existingTemplate = await ProjectTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({ message: "Template with this name already exists" });
    }

    // Add order to environments and modules if not provided
    const processedEnvironments = environments.map((env: any, envIndex: number) => ({
      ...env,
      order: env.order || envIndex,
      modules: env.modules?.map((mod: any, modIndex: number) => ({
        ...mod,
        order: mod.order || modIndex
      })) || []
    }));

    const template = await ProjectTemplate.create({
      name,
      description,
      environments: processedEnvironments,
      isGlobal: isGlobal || false,
      createdBy: user.id,
      createdByName: user.username || "Unknown"
    });

    res.status(201).json(template);
  } catch (err) {
    console.error("CREATE TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE TEMPLATE ================= */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, environments, isGlobal } = req.body;
    const user = (req as any).user;

    const template = await ProjectTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if updating to an existing name (excluding current)
    if (name && name !== template.name) {
      const existingTemplate = await ProjectTemplate.findOne({ name });
      if (existingTemplate) {
        return res.status(400).json({ message: "Template with this name already exists" });
      }
    }

    // Process environments with order
    const processedEnvironments = environments?.map((env: any, envIndex: number) => ({
      ...env,
      order: env.order || envIndex,
      modules: env.modules?.map((mod: any, modIndex: number) => ({
        ...mod,
        order: mod.order || modIndex
      })) || []
    }));

    template.name = name || template.name;
    template.description = description !== undefined ? description : template.description;
    template.environments = processedEnvironments || template.environments;
    template.isGlobal = isGlobal !== undefined ? isGlobal : template.isGlobal;
    template.version += 1;
    template.updatedBy = user.id;
    template.updatedByName = user.username;

    await template.save();
    res.json(template);
  } catch (err) {
    console.error("UPDATE TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE TEMPLATE ================= */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if template is being used by any projects
    const projectsUsingTemplate = await Project.find({ templateId: id });
    if (projectsUsingTemplate.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete template that is being used by projects",
        projects: projectsUsingTemplate.map(p => p.title)
      });
    }

    await ProjectTemplate.findByIdAndDelete(id);
    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= APPLY TEMPLATE TO PROJECT ================= */
export const applyTemplateToProject = async (projectId: string, templateId: string, userId: string, username: string) => {
  try {
    const template = await ProjectTemplate.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Create environments and modules based on template
    for (const envConfig of template.environments) {
      const environment = await Environment.create({
        name: envConfig.name,
        projectId: projectId,
        createdBy: userId,
        createdByName: username,
      });

      // Create modules for this environment
      const modules = envConfig.modules.map((moduleConfig) => ({
        moduleName: moduleConfig.name,
        description: moduleConfig.description,
        projectId: projectId,
        environmentId: environment._id,
        createdBy: userId,
        createdByName: username,
      }));

      if (modules.length > 0) {
        await Module.insertMany(modules);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("APPLY TEMPLATE ERROR:", err);
    throw err;
  }
};