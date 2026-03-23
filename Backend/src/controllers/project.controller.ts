import { Request, Response } from "express";
import { Project } from "../models/Project.model";
import { ConfigEntry } from "../models/ConfigEntry.model";
import { Environment } from "../models/Environment.model";
import { Module } from "../models/Module.model";
import User from "../models/User.model";
import mongoose from "mongoose";
import ProjectTemplate from "../models/ProjectTemplate.model";
import ProjectUserPermission from "../models/ProjectUserPermission.model";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, description, templateId } = req.body;
    const user = (req as any).user;
    const file = req.file;

    if (!title) {
      return res.status(400).json({ message: "Project title required" });
    }

    // Find template if selected
    let selectedTemplate = null;
    if (templateId) {
      selectedTemplate = await ProjectTemplate.findById(templateId);
    }

    // Create the project
    const project = await Project.create({
      title,
      description,
      uploadedFile: file ? file.path : undefined,
      createdBy: user.id,
      createdByName: user.username || "Unknown",
      templateId: selectedTemplate?._id,
      templateName: selectedTemplate?.name
    });

    // Apply template if selected
    if (selectedTemplate) {
      await applyTemplateToProject(project._id, selectedTemplate, user.id, user.username);
    } else {
      // Use default template or fallback to hardcoded defaults
      const defaultTemplate = await ProjectTemplate.findOne({ isGlobal: true, isActive: true })
        .sort({ createdAt: -1 });
      
      if (defaultTemplate) {
        await applyTemplateToProject(project._id, defaultTemplate, user.id, user.username);
      } else {
        // Fallback to hardcoded defaults
        await createDefaultProjectStructure(project._id, user.id, user.username);
      }
    }

    return res.status(201).json(project);
  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper function to apply template
async function applyTemplateToProject(
  projectId: any,
  template: any,
  userId: string,
  username: string
) {
  for (const envConfig of template.environments) {
    const environment = await Environment.create({
      name: envConfig.name,
      projectId: projectId,
      createdBy: userId,
      createdByName: username,
    });

    const modules = envConfig.modules.map((moduleConfig: any) => ({
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
}

// Helper function for default structure
async function createDefaultProjectStructure(
  projectId: any,
  userId: string,
  username: string
) {
  const defaultEnvironments = ["Development", "Staging", "UAT", "Production"];
  const defaultModules = ["Database", "Auth Service", "S3 Storage", "Payment Gateway", "Email Service"];

  for (const envName of defaultEnvironments) {
    const env = await Environment.create({
      name: envName,
      projectId: projectId,
      createdBy: userId,
      createdByName: username,
    });

    const modules = defaultModules.map((moduleName) => ({
      moduleName,
      projectId: projectId,
      environmentId: env._id,
      createdBy: userId,
      createdByName: username,
    }));

    await Module.insertMany(modules);
  }
}

/* ================= GET ALL PROJECTS (MAIN PAGE) ================= */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: 1 }) 
      .lean();

    return res.json(projects);
  } catch (err) {
    console.error("GET ALL PROJECTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PROJECTS for module ================= */
export const getProjectsForModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.query; // 🔥 important

    if (!moduleId) {
      return res.status(400).json({ message: "moduleId required" });
    }

    // 1️⃣ Get all projects
    const projects = await Project.find().lean();

    // 2️⃣ Aggregate key counts grouped by projectId
    const keyCounts = await ConfigEntry.aggregate([
      {
        $match: {
          moduleId: new mongoose.Types.ObjectId(moduleId as string),
        },
      },
      { $unwind: "$entries" },
      {
        $group: {
          _id: "$projectId",
          totalKeys: { $sum: 1 },
        },
      },
    ]);

    // 3️⃣ Convert aggregation result to map for fast lookup
    const keyCountMap = new Map(
      keyCounts.map((item) => [
        item._id.toString(),
        item.totalKeys,
      ])
    );

    // 4️⃣ Attach key count to each project
    const projectsWithKeyCount = projects.map((project) => ({
      ...project,
      totalKeys: keyCountMap.get(project._id.toString()) || 0,
    }));

    return res.json(projectsWithKeyCount);
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE PROJECT ================= */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    const updateData: any = {
      title,
      description,
    };

    if (req.file) {
      updateData.UploadedFile = req.file.path;
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE PROJECT ================= */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 🔎 Check if any config keys exist in this project
    const keysExist = await ConfigEntry.exists({
      projectId: id,
      "entries.0": { $exists: true }
    });

    if (keysExist) {
      return res.status(400).json({
        message: "Cannot delete project. Keys still exist in this project."
      });
    }

    // ✅ Safe to delete
    await Project.findByIdAndDelete(id);

    return res.json({ message: "Project deleted successfully" });

  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};

/* ================= ASSIGN PROJECT ================= */
export const assignProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { userIds } = req.body;
    const currentUser = (req as any).user;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const validUserIds = userIds.filter((id: string) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const users = await User.find(
      { _id: { $in: validUserIds } },
      { firstname: 1, lastname: 1, username: 1 }
    ).lean();

    const assignedTo = users.map((u) => u._id);
    const assignedToNames = users.map((u) => u.username || `${u.firstname} ${u.lastname}`);

    // Update project with basic assignment info
    const updated = await Project.findByIdAndUpdate(
      projectId,
      {
        assignedTo,
        assignedToNames,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Initialize default permissions for each assigned user
    // This creates permission documents with READ-only access by default
    for (const userId of validUserIds) {
      // Check if permissions already exist
      const existingPerms = await ProjectUserPermission.findOne({
        projectId,
        userId
      });

      if (!existingPerms) {
        // Get all environments for this project
        const environments = await Environment.find({ projectId });
        
        // Create default permissions structure
        const defaultEnvironments = await Promise.all(environments.map(async (env) => {
          // Get all modules for this environment
          const modules = await Module.find({ 
            projectId, 
            environmentId: env._id 
          });

          return {
            environmentId: env._id,
            permissions: ["READ_ENVIRONMENT"], // Default read access
            modules: modules.map(module => ({
              moduleId: module._id,
              permissions: ["READ_MODULE"], // Default read access
              configEntries: [] // No config access by default
            }))
          };
        }));

        // Create permission document
        await ProjectUserPermission.create({
          projectId,
          userId,
          environments: defaultEnvironments,
          grantedBy: currentUser.id,
          grantedByName: currentUser.username || currentUser.email
        });
      }
    }

    return res.json({
      message: "Project assigned successfully",
      project: updated
    });
  } catch (err) {
    console.error("ASSIGN PROJECT ERROR:", err);
    return res.status(500).json({ message: "Assign failed" });
  }
};

export const getUserProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;

    const permissions = await ProjectUserPermission.findOne({
      projectId,
      userId
    });

    if (!permissions) {
      return res.status(404).json({ message: "No permissions found" });
    }

    res.json(permissions);
  } catch (err) {
    console.error("GET USER PERMISSIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
