import { Request, Response } from "express";
import { Module } from "../models/Module.model";
import { ConfigEntry } from "../models/ConfigEntry.model";
import ProjectUserPermission from "../models/ProjectUserPermission.model";
import User from "../models/User.model";
import {Permission , PERMISSIONS} from "../config/accessControl";
import { logAudit } from "../middlewares/auditLogger";

/* ================= CHECK MODULE PERMISSION ================= */
const checkModulePermission = async (
  userId: string,
  projectId: string,
  environmentId: string,
  moduleId: string,
  requiredPermission: Permission 
): Promise<boolean> => {
  // Superadmin can do everything
  const user = await User.findById(userId).populate("roleId");
  const roleName = (user?.roleId as any)?.name || "user";
  if (roleName === "superadmin") return true;

  // Check if user has permission for this module
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
  return module.permissions.includes(requiredPermission);
};

/* ================= CREATE MODULE ================= */
export const createModule = async (req: Request, res: Response) => {
  try {
    const { moduleName, description, projectId, environmentId } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!moduleName || moduleName.trim().length < 3) {
      return res.status(400).json({ message: "Valid module name required" });
    }

    // Check if user has permission to create module
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkModulePermission(
        user.id,
        projectId,
        environmentId,
        "", // No module yet
        "CREATE_MODULE"
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to create module" });
      }
    }

    const exists = await Module.findOne({
      moduleName,
      projectId,
      environmentId,
    });
    
    if (exists) {
      return res.status(400).json({ message: "Module already exists" });
    }

    const module = await Module.create({
      moduleName,
      description,
      projectId,
      environmentId,
      createdBy: user.id,
      createdByName: user.username,
    });

    logAudit({
      category: "activity",
      action: "CREATE_MODULE",
      userId: String(user.id),
      userName: user.username || "Unknown",
      targetId: String(module._id),
      details: `Created module "${module.moduleName}"`,
      metadata: {
        projectId,
        environmentId,
        moduleId: String(module._id),
        moduleName: module.moduleName,
        changeSummary: `Created module "${module.moduleName}"`,
      },
      req,
    });

    res.status(201).json(module);
  } catch (err) {
    console.error("CREATE MODULE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET MODULES ================= */
export const getModules = async (req: Request, res: Response) => {
  try {
    const { projectId, environmentId } = req.query;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!projectId || !environmentId) {
      return res.status(400).json({ message: "projectId and environmentId required" });
    }

    // Get all modules from database
    const allModules = await Module.find({
      projectId,
      environmentId,
    }).sort({ createdAt: 1 });

    // Superadmin sees all
    if (user.roleName === "superadmin") { 
      return res.json(allModules);
    }

    // For other users, get their permissions
    const permission = await ProjectUserPermission.findOne({
      projectId,
      userId: user.id
    });

    if (!permission) {
      return res.json([]);
    }

    // Find the specific environment in permissions
    const environment = permission.environments.find(
      env => env.environmentId.toString() === environmentId.toString()
    );

    if (!environment || !environment.modules || environment.modules.length === 0) {
      return res.json([]);
    }

    // Get module IDs that user has READ_MODULE permission for
    const accessibleModuleIds = environment.modules
      .filter(mod => mod.permissions.includes(PERMISSIONS.READ_MODULE))
      .map(mod => mod.moduleId.toString());

    // Filter modules from database
    const accessibleModules = allModules.filter(module => 
      accessibleModuleIds.includes(module._id.toString())
    );

    res.json(accessibleModules);
    
  } catch (err) {
    console.error("❌ GET MODULES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE MODULE ================= */
export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { moduleName } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get module to find environment and project
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const moduleId = Array.isArray(id) ? id[0] : id;
    // Check permission
    if (user.role !== "superadmin") {
      const hasPermission = await checkModulePermission(
        user.id,
        module.projectId.toString(),
        module.environmentId.toString(),
        moduleId,
        PERMISSIONS.UPDATE_MODULE
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update this module" });
      }
    }

    const updated = await Module.findByIdAndUpdate(
      id,
      { moduleName },
      { returnDocument: 'after' }
    );

    const previousName = module.moduleName;
    const nextName = updated?.moduleName || moduleName || previousName;
    const changeSummary =
      previousName !== nextName
        ? `Renamed module from "${previousName}" to "${nextName}"`
        : `Updated module "${nextName}"`;

    logAudit({
      category: "activity",
      action: "UPDATE_MODULE",
      userId: String(user.id),
      userName: user.username || "Unknown",
      targetId: String(updated?._id || id),
      details: `Updated module "${nextName}"`,
      metadata: {
        projectId: String(module.projectId),
        environmentId: String(module.environmentId),
        moduleId: String(updated?._id || id),
        previousName,
        nextName,
        changeSummary,
      },
      req,
    });

    res.json(updated);
  } catch (err) {
    console.error("UPDATE MODULE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE MODULE ================= */
export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const moduleId = Array.isArray(id) ? id[0] : id;

    // Get module to find environment and project
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    // Check permission
    if (user.role !== "superadmin") {
      const hasPermission = await checkModulePermission(
        user.id,
        module.projectId.toString(),
        module.environmentId.toString(),
        moduleId,
        PERMISSIONS.DELETE_MODULE
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to delete this module" });
      }
    }

    // Check if module has any config entries
    const configExists = await ConfigEntry.exists({
      moduleId: id,
      "entries.0": { $exists: true }
    });

    if (configExists) {
      return res.status(400).json({
        message: "Cannot delete module. Configuration entries still exist."
      });
    }

    await Module.findByIdAndDelete(id);

    logAudit({
      category: "activity",
      action: "DELETE_MODULE",
      userId: String(user.id),
      userName: user.username || "Unknown",
      targetId: String(module._id),
      details: `Deleted module "${module.moduleName}"`,
      metadata: {
        projectId: String(module.projectId),
        environmentId: String(module.environmentId),
        moduleId: String(module._id),
        moduleName: module.moduleName,
        changeSummary: `Deleted module "${module.moduleName}"`,
      },
      req,
    });

    res.json({ message: "Module deleted successfully" });
  } catch (err) {
    console.error("DELETE MODULE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= SET PARENT MODULE ================= */
export const setParentModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const moduleId = Array.isArray(id) ? id[0] : id;

    // Get module to find environment and project
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    // Check permission - require update permission to set as parent
    if (user.roleName !== "superadmin") {
      const hasPermission = await checkModulePermission(
        user.id,
        module.projectId.toString(),
        module.environmentId.toString(),
        moduleId,
        PERMISSIONS.UPDATE_MODULE
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update this module" });
      }
    }

    // Unset isParent for all other modules in this environment
    await Module.updateMany(
      { environmentId: module.environmentId, _id: { $ne: moduleId } },
      { $set: { isParent: false } }
    );

    // Set isParent to true for the target module
    const updated = await Module.findByIdAndUpdate(
      id,
      { isParent: true },
      { returnDocument: 'after' }
    );

    logAudit({
      category: "activity",
      action: "UPDATE_MODULE",
      userId: String(user.id),
      userName: user.username || "Unknown",
      targetId: String(updated?._id || id),
      details: `Set module "${updated?.moduleName || module.moduleName}" as parent`,
      metadata: {
        projectId: String(module.projectId),
        environmentId: String(module.environmentId),
        moduleId: String(updated?._id || id),
        moduleName: updated?.moduleName || module.moduleName,
        changeSummary: `Set module "${updated?.moduleName || module.moduleName}" as parent module`,
      },
      req,
    });

    res.json({ message: "Module set as parent successfully", module: updated });
  } catch (err) {
    console.error("SET PARENT MODULE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
