import { Request, Response } from "express";
import ProjectUserPermission from "../models/ProjectUserPermission.model";
import { Project } from "../models/Project.model";
import User from "../models/User.model";
import { Environment } from "../models/Environment.model";
import { Module } from "../models/Module.model";
import { ConfigEntry } from "../models/ConfigEntry.model";
import { logAudit } from "../middlewares/auditLogger";

type PermissionTree = Array<{
  environmentId?: unknown;
  permissions?: string[];
  modules?: Array<{
    moduleId?: unknown;
    permissions?: string[];
    accessAll?: boolean;
    configEntries?: Array<{
      configId?: unknown;
      permissions?: string[];
    }>;
  }>;
}>;

interface PermissionStats {
  environmentCount: number;
  moduleCount: number;
  configCount: number;
  accessAllModuleCount: number;
  permissions: string[];
}

const formatPermissionLabel = (permission: string) =>
  String(permission || "").replace(/_/g, " ").toLowerCase();

const summarizePermissionCodes = (permissions: string[]) =>
  permissions.length > 0
    ? permissions.map(formatPermissionLabel).join(", ")
    : "none";

const summarizeScope = (stats: PermissionStats) =>
  `${stats.environmentCount} environment(s), ${stats.moduleCount} module(s), ${stats.configCount} config(s), ${stats.accessAllModuleCount} access-all module(s)`;

const getPermissionStats = (environments: PermissionTree = []): PermissionStats => {
  const permissionSet = new Set<string>();
  const moduleIds = new Set<string>();
  const configIds = new Set<string>();
  let accessAllModuleCount = 0;

  for (const environment of environments || []) {
    for (const permission of environment?.permissions || []) {
      permissionSet.add(String(permission));
    }

    for (const module of environment?.modules || []) {
      if (module?.moduleId) {
        moduleIds.add(String(module.moduleId));
      }
      if (module?.accessAll) {
        accessAllModuleCount += 1;
      }

      for (const permission of module?.permissions || []) {
        permissionSet.add(String(permission));
      }

      for (const config of module?.configEntries || []) {
        if (config?.configId) {
          configIds.add(String(config.configId));
        }

        for (const permission of config?.permissions || []) {
          permissionSet.add(String(permission));
        }
      }
    }
  }

  return {
    environmentCount: (environments || []).length,
    moduleCount: moduleIds.size,
    configCount: configIds.size,
    accessAllModuleCount,
    permissions: Array.from(permissionSet).sort(),
  };
};

const buildAssignmentSummary = (environments: PermissionTree = []) => {
  const stats = getPermissionStats(environments);
  return {
    stats,
    summary: `Granted permissions: ${summarizePermissionCodes(stats.permissions)}. Scope: ${summarizeScope(stats)}`,
  };
};

const buildReassignmentSummary = (before: PermissionTree = [], after: PermissionTree = []) => {
  const beforeStats = getPermissionStats(before);
  const afterStats = getPermissionStats(after);

  const beforeSet = new Set(beforeStats.permissions);
  const afterSet = new Set(afterStats.permissions);

  const addedPermissions = afterStats.permissions.filter((permission) => !beforeSet.has(permission));
  const removedPermissions = beforeStats.permissions.filter((permission) => !afterSet.has(permission));

  const parts: string[] = [];

  if (addedPermissions.length > 0) {
    parts.push(`Added access: ${summarizePermissionCodes(addedPermissions)}`);
  }

  if (removedPermissions.length > 0) {
    parts.push(`Removed access: ${summarizePermissionCodes(removedPermissions)}`);
  }

  if (parts.length === 0) {
    parts.push("No permission-code changes");
  }

  if (
    beforeStats.environmentCount !== afterStats.environmentCount ||
    beforeStats.moduleCount !== afterStats.moduleCount ||
    beforeStats.configCount !== afterStats.configCount ||
    beforeStats.accessAllModuleCount !== afterStats.accessAllModuleCount
  ) {
    parts.push(
      `Scope changed: ${beforeStats.environmentCount}->${afterStats.environmentCount} environment(s), ${beforeStats.moduleCount}->${afterStats.moduleCount} module(s), ${beforeStats.configCount}->${afterStats.configCount} config(s), ${beforeStats.accessAllModuleCount}->${afterStats.accessAllModuleCount} access-all module(s)`
    );
  }

  return {
    beforeStats,
    afterStats,
    addedPermissions,
    removedPermissions,
    summary: parts.join(". "),
  };
};

const buildRemovalSummary = (environments: PermissionTree = []) => {
  const stats = getPermissionStats(environments);
  return {
    stats,
    summary: `Removed permissions: ${summarizePermissionCodes(stats.permissions)}. Removed scope: ${summarizeScope(stats)}`,
  };
};

export const assignProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { assignments } = req.body;
    const currentUser = (req as any).user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const results = [];

    for (const assignment of assignments) {
      const { userId, environments } = assignment;

      const user = await User.findById(userId);
      if (!user) continue;

      const existingPermission = await ProjectUserPermission.findOne({ projectId, userId })
        .lean();

      // Update or create permission document
      const updated = await ProjectUserPermission.findOneAndUpdate(
        { projectId, userId },
        {
          projectId,
          userId,
          environments,
          grantedBy: currentUser.id,
        },
        { upsert: true, returnDocument: 'after' }
      );

      results.push(updated);

      const targetUserName =
        user.fullName || `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email || String(user._id);

      if (existingPermission) {
        const diff = buildReassignmentSummary(
          (existingPermission.environments || []) as PermissionTree,
          (environments || []) as PermissionTree
        );

        logAudit({
          category: "permission",
          action: "UPDATE_PERMISSION",
          userId: String(currentUser.id),
          fullName: currentUser.fullName || "Unknown",
          targetId: String(userId),
          details: `Reassigned permissions for user "${targetUserName}" in project "${project.title}"`,
          metadata: {
            projectId,
            projectTitle: project.title,
            userId,
            targetUserName,
            operation: "reassigned",
            addedPermissions: diff.addedPermissions,
            removedPermissions: diff.removedPermissions,
            beforeStats: diff.beforeStats,
            afterStats: diff.afterStats,
            changeSummary: diff.summary,
          },
          req,
        });
      } else {
        const assignmentSummary = buildAssignmentSummary((environments || []) as PermissionTree);

        logAudit({
          category: "permission",
          action: "ASSIGN_PROJECT",
          userId: String(currentUser.id),
          fullName: currentUser.fullName || "Unknown",
          targetId: String(userId),
          details: `Assigned user "${targetUserName}" to project "${project.title}"`,
          metadata: {
            projectId,
            projectTitle: project.title,
            userId,
            targetUserName,
            operation: "assigned",
            assignedStats: assignmentSummary.stats,
            changeSummary: assignmentSummary.summary,
          },
          req,
        });
      }
    }

    res.json({
      message: "Permissions assigned successfully",
      assignments: results
    });
  } catch (err) {
    console.error("ASSIGN PERMISSIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE USER PROJECT PERMISSIONS ================= */
export const updateUserProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    const { environments } = req.body; // Changed from 'permissions' to 'environments'
    const currentUser = (req as any).user;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Permission check - only admin/superadmin can update permissions
    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const existingPermission = await ProjectUserPermission.findOne({ projectId, userId }).lean();

    // Update or create permissions with hierarchical structure
    const updated = await ProjectUserPermission.findOneAndUpdate(
      { projectId, userId },
      {
        projectId,
        userId,
        environments: environments || [], // Store the hierarchical environment permissions
        grantedBy: currentUser.id,
      },
      { upsert: true, returnDocument: "after" }
    );

    const targetUserName =
      user.fullName || `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email || String(user._id);

    if (existingPermission) {
      const diff = buildReassignmentSummary(
        (existingPermission.environments || []) as PermissionTree,
        (environments || []) as PermissionTree
      );

      logAudit({
        category: "permission",
        action: "UPDATE_PERMISSION",
        userId: String(currentUser.id),
        fullName: currentUser.fullName || "Unknown",
        targetId: String(userId),
        details: `Reassigned permissions for user "${targetUserName}" in project "${project.title}"`,
        metadata: {
          projectId,
          projectTitle: project.title,
          userId,
          targetUserName,
          operation: "reassigned",
          addedPermissions: diff.addedPermissions,
          removedPermissions: diff.removedPermissions,
          beforeStats: diff.beforeStats,
          afterStats: diff.afterStats,
          changeSummary: diff.summary,
        },
        req,
      });
    } else {
      const summary = buildAssignmentSummary((environments || []) as PermissionTree);

      logAudit({
        category: "permission",
        action: "ASSIGN_PROJECT",
        userId: String(currentUser.id),
        fullName: currentUser.fullName || "Unknown",
        targetId: String(userId),
        details: `Assigned user "${targetUserName}" to project "${project.title}"`,
        metadata: {
          projectId,
          projectTitle: project.title,
          userId,
          targetUserName,
          operation: "assigned",
          assignedStats: summary.stats,
          changeSummary: summary.summary,
        },
        req,
      });
    }

    res.json({
      message: "Permissions updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating user project permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET USER PROJECT PERMISSIONS ================= */
export const getUserProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    const currentUser = (req as any).user;


    const permissions = await ProjectUserPermission.findOne({
      projectId,
      userId
    });

    if (!permissions) {
      return res.json({
        projectId,
        userId,
        environments: [] // Return empty array if no permissions found
        
      });
    }

    res.json(permissions);
  } catch (err) {
    console.error("Error getting user project permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL PROJECTS WITH USER PERMISSIONS ================= */
export const getAllProjectsWithUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;

    // Permission check
    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all projects
    const projects = await Project.find().select("title description");

    // Get user's permissions for each project
    const userPermissions = await ProjectUserPermission.find({ userId });

    // Create a map of projectId -> environments with full structure
    const permissionsMap = new Map();
    userPermissions.forEach(p => {
      permissionsMap.set(p.projectId.toString(), p.environments || []);
    });

    // Combine projects with their permissions
    const result = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      environments: permissionsMap.get(project.id.toString()) || []
    }));

    res.json(result);
  } catch (err) {
    console.error("Error getting projects with permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= BULK ASSIGN PERMISSIONS ================= */
export const bulkAssignPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { assignments } = req.body;
    const currentUser = (req as any).user;

    // Permission check
    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const project = await Project.findById(projectId).select("title");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const results = [];
    const assignedUserIds = [];
    const assignedUserNames = [];

    for (const assignment of assignments) {
      const { userId, environments } = assignment;
      const existingPermission = await ProjectUserPermission.findOne({ projectId, userId }).lean();

      // Get user details for project assignment
      const user = await User.findById(userId).select("firstname lastname fullName");
      if (user) {
        assignedUserIds.push(userId);
        assignedUserNames.push(user.fullName || `${user.firstname} ${user.lastname}`);
      }

      // Update or create permissions for each user
      const updated = await ProjectUserPermission.findOneAndUpdate(
        { projectId, userId },
        {
          projectId,
          userId,
          environments,
          grantedBy: currentUser.id,
        },
        { upsert: true, returnDocument: 'after' }
      );

      results.push({
        userId,
        environments: updated.environments
      });

      const targetUserName =
        user?.fullName ||
        `${user?.firstname || ""} ${user?.lastname || ""}`.trim() ||
        String(userId);

      if (existingPermission) {
        const diff = buildReassignmentSummary(
          (existingPermission.environments || []) as PermissionTree,
          (environments || []) as PermissionTree
        );

        logAudit({
          category: "permission",
          action: "UPDATE_PERMISSION",
          userId: String(currentUser.id),
          fullName: currentUser.fullName || "Unknown",
          targetId: String(userId),
          details: `Reassigned permissions for user "${targetUserName}" in project "${project.title}"`,
          metadata: {
            projectId,
            projectTitle: project.title,
            userId,
            targetUserName,
            operation: "reassigned",
            addedPermissions: diff.addedPermissions,
            removedPermissions: diff.removedPermissions,
            beforeStats: diff.beforeStats,
            afterStats: diff.afterStats,
            changeSummary: diff.summary,
          },
          req,
        });
      } else {
        const summary = buildAssignmentSummary((environments || []) as PermissionTree);

        logAudit({
          category: "permission",
          action: "ASSIGN_PROJECT",
          userId: String(currentUser.id),
          fullName: currentUser.fullName || "Unknown",
          targetId: String(userId),
          details: `Assigned user "${targetUserName}" to project "${project.title}"`,
          metadata: {
            projectId,
            projectTitle: project.title,
            userId,
            targetUserName,
            operation: "assigned",
            assignedStats: summary.stats,
            changeSummary: summary.summary,
          },
          req,
        });
      }
    }

    // IMPORTANT: Update the Project's assignedTo field
    if (assignedUserIds.length > 0) {
      await Project.findByIdAndUpdate(
        projectId,
        {
          assignedTo: assignedUserIds,
        },
        { returnDocument: 'after' }
      );
    }

    res.json({
      message: `Permissions assigned to ${results.length} users successfully`,
      results
    });
  } catch (err) {
    console.error("Error bulk assigning permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProjectAssignedUsers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get project with assigned users
    const project = await Project.findById(projectId)
      .select("title assignedTo assignedToNames")
      .lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // If no users assigned, return empty array
    if (!project.assignedTo || project.assignedTo.length === 0) {
      return res.json({
        projectId,
        title: project.title,
        assignedUsers: []
      });
    }

    // Get permissions for each assigned user
    const permissions = await ProjectUserPermission.find({
      projectId,
      userId: { $in: project.assignedTo }
    });

    // Create a map of userId -> permissions
    const permissionsMap = new Map();
    permissions.forEach(p => {
      permissionsMap.set(p.userId.toString(), p.environments);
    });

    // Combine user info with permissions
    const assignedUsers = await Promise.all(
      project.assignedTo.map(async (userId) => {
        const user = await User.findById(userId)
          .select("firstname lastname fullName email roleId")
          .populate("roleId")
          .lean();

        const roleName = (user?.roleId as any)?.name || "user";

        return {
          _id: userId,
          firstname: user?.firstname,
          lastname: user?.lastname,
          fullName: user?.fullName,
          email: user?.email,
          role: roleName,
          environments: permissionsMap.get(userId.toString()) || []
        };
      })
    );

    res.json({
      projectId: project._id,
      title: project.title,
      assignedUsers
    });
  } catch (err) {
    console.error("Error getting project assigned users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= REMOVE USER PROJECT PERMISSIONS ================= */
export const removeUserProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    const currentUser = (req as any).user;

    // Permission check
    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const [project, targetUser] = await Promise.all([
      Project.findById(projectId).select("title"),
      User.findById(userId).select("firstname lastname fullName email roleId"),
    ]);

    const deleted = await ProjectUserPermission.findOneAndDelete({
      projectId,
      userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Permissions not found" });
    }

    const removalSummary = buildRemovalSummary((deleted.environments || []) as PermissionTree);
    const targetUserName =
      targetUser?.fullName ||
      `${targetUser?.firstname || ""} ${targetUser?.lastname || ""}`.trim() ||
      targetUser?.email ||
      String(userId);

    // Audit log: REMOVE_PERMISSION
    logAudit({
      category: "permission",
      action: "REMOVE_PERMISSION",
      userId: String(currentUser.id),
      fullName: currentUser.fullName || "Unknown",
      targetId: String(userId),
      details: `Removed permissions for user "${targetUserName}" from project "${project?.title || projectId}"`,
      metadata: {
        projectId,
        projectTitle: project?.title || null,
        userId,
        targetUserName,
        operation: "removed",
        removedStats: removalSummary.stats,
        changeSummary: removalSummary.summary,
      },
      req,
    });

    res.json({
      message: "Permissions removed successfully"
    });
  } catch (err) {
    console.error("Error removing user project permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserDetailedPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;

    // Permission check
    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin" && currentUser.id !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all projects with user permissions
    const userPermissions = await ProjectUserPermission.find({ userId }).populate('projectId', 'title');

    const result = await Promise.all(userPermissions.map(async (perm) => {
      const project = await Project.findById(perm.projectId).select('title');
      
      // For each environment, get names
      const environmentsWithNames = await Promise.all(perm.environments.map(async (env) => {
        const environment = await Environment.findById(env.environmentId).select('name');
        
        // For each module, get names and config entries
        const modulesWithNames = await Promise.all((env.modules || []).map(async (mod) => {
          const module = await Module.findById(mod.moduleId).select('moduleName');
          
          // For each config entry, get key
          const configsWithNames = await Promise.all((mod.configEntries || []).map(async (config: any) => {
            const configEntry = await ConfigEntry.findOne({ "entries._id": config.configId }).select('entries');
            const entry = configEntry?.entries.find((e: any) => e._id.toString() === config.configId.toString());
            
            return {
              configId: config.configId,
              configKey: entry?.key || config.configId,
              permissions: config.permissions
            };
          }));
          
          return {
            moduleId: mod.moduleId,
            moduleName: module?.moduleName,
            permissions: mod.permissions,
            configEntries: configsWithNames
          };
        }));
        
        return {
          environmentId: env.environmentId,
          environmentName: environment?.name,
          permissions: env.permissions,
          modules: modulesWithNames
        };
      }));
      
      return {
        projectId: perm.projectId,
        projectName: project?.title,
        environments: environmentsWithNames
      };
    }));
    
    res.json(result);
  } catch (err) {
    console.error("Error getting detailed permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};
