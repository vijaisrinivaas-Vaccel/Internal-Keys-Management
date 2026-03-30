import { Request, Response } from "express";
import ProjectTemplate from "../models/ProjectTemplate.model";
import {Project} from "../models/Project.model";
import {Environment} from "../models/Environment.model";
import {Module} from "../models/Module.model";
import { logAudit } from "../middlewares/auditLogger";

const buildTemplateStructureSummary = (template: any) => {
  const environments = template?.environments || [];
  const moduleCount = environments.reduce(
    (count: number, env: any) => count + (env.modules?.length || 0),
    0
  );
  return `${environments.length} environments, ${moduleCount} modules`;
};

const buildTemplateUpdateSummary = (before: any, after: any) => {
  const parts: string[] = [];

  if (before?.name !== after?.name) {
    parts.push(`Name: "${before?.name}" -> "${after?.name}"`);
  }
  if ((before?.description || "") !== (after?.description || "")) {
    parts.push("Description updated");
  }
  if (Boolean(before?.isGlobal) !== Boolean(after?.isGlobal)) {
    parts.push(`Global default: ${before?.isGlobal ? "ON" : "OFF"} -> ${after?.isGlobal ? "ON" : "OFF"}`);
  }

  const beforeEnvNames = new Set((before?.environments || []).map((env: any) => env.name));
  const afterEnvNames = new Set((after?.environments || []).map((env: any) => env.name));
  const addedEnvs = [...afterEnvNames].filter((name) => !beforeEnvNames.has(name));
  const removedEnvs = [...beforeEnvNames].filter((name) => !afterEnvNames.has(name));
  if (addedEnvs.length > 0) parts.push(`Added environments: ${addedEnvs.join(", ")}`);
  if (removedEnvs.length > 0) parts.push(`Removed environments: ${removedEnvs.join(", ")}`);

  const beforeModules = new Set(
    (before?.environments || []).flatMap((env: any) =>
      (env.modules || []).map((module: any) => `${env.name}/${module.name}`)
    )
  );
  const afterModules = new Set(
    (after?.environments || []).flatMap((env: any) =>
      (env.modules || []).map((module: any) => `${env.name}/${module.name}`)
    )
  );
  const addedModules = [...afterModules].filter((name) => !beforeModules.has(name));
  const removedModules = [...beforeModules].filter((name) => !afterModules.has(name));
  if (addedModules.length > 0) parts.push(`Added modules: ${addedModules.join(", ")}`);
  if (removedModules.length > 0) parts.push(`Removed modules: ${removedModules.join(", ")}`);

  if (parts.length === 0) {
    parts.push(`Structure now: ${buildTemplateStructureSummary(after)}`);
  }

  return parts.join(". ");
};

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
    const { name, description, environments, isGlobal, reason, changeSummary } = req.body;
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
    });

    // Audit log: CREATE_TEMPLATE
    logAudit({
      category: "admin",
      action: "CREATE_TEMPLATE",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(template._id),
      details: `Created project template "${name}"`,
      metadata: {
        templateName: name,
        isGlobal,
        reason: reason || null,
        changeSummary: changeSummary || `Created template with ${buildTemplateStructureSummary(template)}`
      },
      req,
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
    const { name, description, environments, isGlobal, reason, changeSummary } = req.body;
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

    const beforeTemplate = {
      name: template.name,
      description: template.description,
      isGlobal: template.isGlobal,
      environments: template.environments
    };

    template.name = name || template.name;
    template.description = description !== undefined ? description : template.description;
    template.environments = processedEnvironments || template.environments;
    template.isGlobal = isGlobal !== undefined ? isGlobal : template.isGlobal;
    template.version += 1;
    template.updatedBy = user.id;

    await template.save();

    // Audit log: UPDATE_TEMPLATE
    logAudit({
      category: "admin",
      action: "UPDATE_TEMPLATE",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(template._id),
      details: `Updated project template "${template.name}"`,
      metadata: {
        templateName: template.name,
        version: template.version,
        reason: reason || null,
        changeSummary:
          changeSummary ||
          buildTemplateUpdateSummary(beforeTemplate, {
            name: template.name,
            description: template.description,
            isGlobal: template.isGlobal,
            environments: template.environments
          })
      },
      req,
    });

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
    const { reason, changeSummary } = req.body || {};
    
    // Check if template is being used by any projects
    const projectsUsingTemplate = await Project.find({ templateId: id });
    if (projectsUsingTemplate.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete template that is being used by projects",
        projects: projectsUsingTemplate.map(p => p.title)
      });
    }

    const template = await ProjectTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    await ProjectTemplate.findByIdAndDelete(id);

    // Audit log: DELETE_TEMPLATE
    logAudit({
      category: "admin",
      action: "DELETE_TEMPLATE",
      userId: String((req as any).user?.id || "system"),
      fullName: (req as any).user?.fullName || "System",
      targetId: String(id),
      details: `Deleted project template "${template.name}"`,
      metadata: {
        templateName: template.name,
        reason: reason || null,
        changeSummary:
          changeSummary ||
          `Deleted template with ${buildTemplateStructureSummary(template)}`
      },
      req,
    });

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= APPLY TEMPLATE TO PROJECT ================= */
export const applyTemplateToProject = async (projectId: string, templateId: string, userId: string, fullName: string) => {
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
      });

      // Create modules for this environment
      const modules = envConfig.modules.map((moduleConfig) => ({
        moduleName: moduleConfig.name,
        description: moduleConfig.description,
        projectId: projectId,
        environmentId: environment._id,
        createdBy: userId,
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
