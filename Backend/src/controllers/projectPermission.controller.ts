import { Request, Response } from "express";
import ProjectUserPermission from "../models/ProjectUserPermission.model";
import { Project } from "../models/Project.model";
import User from "../models/User.model";

/* ================= GET USER PROJECT PERMISSIONS ================= */
export const getUserProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Permission check - only admin/superadmin can view others' permissions
    if (currentUser.role !== "superadmin" && currentUser.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all project permissions for this user
    const permissions = await ProjectUserPermission.find({ userId });

    // Format as object with projectId as key
    const permissionsMap: Record<string, string[]> = {};
    permissions.forEach(p => {
      permissionsMap[p.projectId.toString()] = p.permissions;
    });

    res.json(permissionsMap);
  } catch (err) {
    console.error("Error getting user project permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE USER PROJECT PERMISSIONS ================= */
export const updateUserProjectPermissions = async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params;
    const { permissions } = req.body;
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
    if (currentUser.role !== "superadmin" && currentUser.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update or create permissions
    const updated = await ProjectUserPermission.findOneAndUpdate(
      { projectId, userId },
      {
        projectId,
        userId,
        permissions,
        grantedBy: currentUser.id,
        grantedByName: currentUser.username || currentUser.email,
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      message: "Permissions updated successfully",
      projectId,
      permissions: updated.permissions
    });
  } catch (err) {
    console.error("Error updating user project permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL PROJECTS WITH USER PERMISSIONS ================= */
export const getAllProjectsWithUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;

    // Permission check
    if (currentUser.role !== "superadmin" && currentUser.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all projects
    const projects = await Project.find().select("title description");

    // Get user's permissions for each project
    const userPermissions = await ProjectUserPermission.find({ userId });

    // Create a map of projectId -> permissions
    const permissionsMap = new Map();
    userPermissions.forEach(p => {
      permissionsMap.set(p.projectId.toString(), p.permissions);
    });

    // Combine projects with their permissions
    const result = projects.map(project => ({
      _id: project._id,
      title: project.title,
      description: project.description,
      permissions: permissionsMap.get(project._id.toString()) || []
    }));

    res.json(result);
  } catch (err) {
    console.error("Error getting projects with permissions:", err);
    res.status(500).json({ message: "Server error" });
  }
};