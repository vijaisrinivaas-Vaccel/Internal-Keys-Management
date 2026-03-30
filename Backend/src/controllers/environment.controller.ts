import { Request, Response } from "express";
import { Environment } from "../models/Environment.model";
import { Module } from "../models/Module.model";
import { ConfigEntry } from "../models/ConfigEntry.model";
import ProjectUserPermission from "../models/ProjectUserPermission.model";
import User from "../models/User.model";
import {Permission , PERMISSIONS} from "../config/accessControl";
import { logAudit } from "../middlewares/auditLogger";

/* ================= CHECK ENVIRONMENT PERMISSION ================= */
const checkEnvironmentPermission = async (
  userId: string,
  projectId: string,
  environmentId: string,
  requiredPermission: Permission  
): Promise<boolean> => {
  const user = await User.findById(userId).populate("roleId");
  const roleName = (user?.roleId as any)?.name || "user";
  if (roleName === "superadmin") return true;

  const permission = await ProjectUserPermission.findOne({
    projectId,
    userId
  });

  if (!permission) return false;

  const environment = permission.environments.find(
    env => env.environmentId.toString() === environmentId
  );

  if (!environment) return false;
  
  // Check if the specific permission exists
  return environment.permissions.includes(requiredPermission);
};

/* ================= CREATE ENVIRONMENT ================= */
export const createEnvironment = async (req: Request, res: Response) => {
  try {
    const { name, projectId } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!name || !projectId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Check if user has permission to create environment
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkEnvironmentPermission(
        user.id,
        projectId,
        "", // No environment yet, check project-level permission
        "CREATE_ENVIRONMENT"
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to create environment" });
      }
    }

    // Check if environment already exists in this project
    const exists = await Environment.findOne({ name, projectId });
    if (exists) {
      return res.status(400).json({ message: "Environment already exists in this project" });
    }

    const env = await Environment.create({
      name,
      projectId,
      createdBy: user.id,
    });

    logAudit({
      category: "activity",
      action: "CREATE_ENVIRONMENT",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(env._id),
      details: `Created environment "${env.name}"`,
      metadata: {
        projectId,
        environmentId: String(env._id),
        environmentName: env.name,
        changeSummary: `Created environment "${env.name}"`,
      },
      req,
    });

    res.status(201).json(env);
  } catch (err) {
    console.error("CREATE ENVIRONMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ENVIRONMENTS BY PROJECT ================= */
export const getEnvironments = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get all environments from database
    const allEnvs = await Environment.find({ projectId }).populate("createdBy", "firstname lastname fullName");

    // Superadmin sees all
    if (user.roleName === "superadmin") {
      return res.json(allEnvs);
    }

    // For non-superadmin, get their permissions
    const permission = await ProjectUserPermission.findOne({
      projectId,
      userId: user.id
    });
    
    if (!permission) {
      return res.json([]);
    }

    // Get environment IDs that user has READ_ENVIRONMENT permission for
    const accessibleEnvIds = permission.environments
      .filter(env => env.permissions.includes(PERMISSIONS.READ_ENVIRONMENT))
      .map(env => env.environmentId.toString());

    // Filter environments from database
    const accessibleEnvs = allEnvs.filter(env => 
      accessibleEnvIds.includes(env._id.toString())
    );
    
    return res.json(accessibleEnvs);
    
  } catch (err) {
    console.error("GET ENVIRONMENTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE ENVIRONMENT ================= */
export const updateEnvironment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    //Convert id to string if it's an array
    
    const environmentId = Array.isArray(id) ? id[0] : id;
    
    // Get environment to find projectId
    const environment = await Environment.findById(environmentId);
    if (!environment) {
      return res.status(404).json({ message: "Environment not found" });
    }

    // Check permission
      if (user.roleName !== "superadmin") {
      const hasPermission = await checkEnvironmentPermission(
        user.id,
        environment.projectId.toString(),
        environmentId,  // ✅ Use the converted string
        PERMISSIONS.UPDATE_ENVIRONMENT  // Use enum instead of hardcoded string
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update this environment" });
      }
    }

    const updated = await Environment.findByIdAndUpdate(
      id,
      { name },
      { returnDocument: 'after' }
    );

    const previousName = environment.name;
    const nextName = updated?.name || name || previousName;
    const changeSummary =
      previousName !== nextName
        ? `Renamed environment from "${previousName}" to "${nextName}"`
        : `Updated environment "${nextName}"`;

    logAudit({
      category: "activity",
      action: "UPDATE_ENVIRONMENT",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(updated?._id || environmentId),
      details: `Updated environment "${nextName}"`,
      metadata: {
        projectId: String(environment.projectId),
        environmentId: String(updated?._id || environmentId),
        previousName,
        nextName,
        changeSummary,
      },
      req,
    });

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ENVIRONMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ENVIRONMENT ================= */
export const deleteEnvironment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get environment to find projectId
    const environment = await Environment.findById(id);
    if (!environment) {
      return res.status(404).json({ message: "Environment not found" });
    }

    const environmentId = Array.isArray(id) ? id[0] : id;

    // Check permission
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkEnvironmentPermission(
        user.id,
        environment.projectId.toString(),
        environmentId,  // ✅ Use the converted string
        PERMISSIONS.DELETE_ENVIRONMENT  // Use enum instead of hardcoded string
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to delete this environment" });
      }
    }

    // Check if environment has any modules
    const modulesExist = await Module.exists({ environmentId: id });

    if (modulesExist) {
      // Check if those modules have config entries
      const modules = await Module.find({ environmentId: id });
      for (const module of modules) {
        const configExists = await ConfigEntry.exists({
          moduleId: module.id,
          "entries.0": { $exists: true }
        });

        if (configExists) {
          return res.status(400).json({
            message: "Cannot delete environment. Modules still have configuration entries."
          });
        }
      }

      // Delete all modules first
      await Module.deleteMany({ environmentId: id });
    }

    // Delete the environment
    await Environment.findByIdAndDelete(id);

    logAudit({
      category: "activity",
      action: "DELETE_ENVIRONMENT",
      userId: String(user.id),
      fullName: user.fullName || "Unknown",
      targetId: String(environment._id),
      details: `Deleted environment "${environment.name}"`,
      metadata: {
        projectId: String(environment.projectId),
        environmentId: String(environment._id),
        environmentName: environment.name,
        changeSummary: `Deleted environment "${environment.name}"`,
      },
      req,
    });

    res.json({ message: "Environment deleted successfully" });
  } catch (err) {
    console.error("DELETE ENVIRONMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

