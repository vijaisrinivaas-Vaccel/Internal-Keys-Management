import { Request, Response } from "express";
import Role from "../models/Role.model";
import User from "../models/User.model";
import { logAudit } from "../middlewares/auditLogger";

const formatPermissionLabel = (permission: string) =>
  permission.replace(/_/g, " ").toLowerCase();

const buildPermissionDiffSummary = (before: string[], after: string[]) => {
  const beforeSet = new Set(before || []);
  const afterSet = new Set(after || []);
  const added = [...afterSet].filter((permission) => !beforeSet.has(permission));
  const removed = [...beforeSet].filter((permission) => !afterSet.has(permission));

  const parts: string[] = [];
  if (added.length > 0) {
    parts.push(`Added access: ${added.map(formatPermissionLabel).join(", ")}`);
  }
  if (removed.length > 0) {
    parts.push(`Removed access: ${removed.map(formatPermissionLabel).join(", ")}`);
  }

  return parts.length > 0 ? parts.join(". ") : "No permission changes.";
};

// Create Role
export const createRole = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }
    const { name, description, permissions, isSystem, reason, changeSummary } = req.body;
    const user = (req as any).user;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const role = await Role.create({
      name,
      description,
      permissions: permissions || [],
      isSystem: isSystem || false,
      createdBy: user?.id
    });

    // Audit log: CREATE_ROLE
    logAudit({
      category: "admin",
      action: "CREATE_ROLE",
      userId: String(user?.id || "system"),
      userName: user?.username || "System",
      targetId: String(role._id),
      details: `Created role "${name}"`,
      metadata: {
        roleName: name,
        permissions,
        reason: reason || null,
        changeSummary:
          changeSummary ||
          `Assigned ${permissions?.length || 0} permissions.`
      },
      req,
    });

    res.status(201).json(role);
  } catch (err: any) {
    console.error("CREATE ROLE ERROR:", err);
    res.status(500).json({ 
      message: "Server error creating role", 
      error: err.message 
    });
  }
};

// Get All Roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Role By ID
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions, isActive, reason, changeSummary } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const previousPermissions = [...(role.permissions || [])];

    if (role.isSystem && name !== role.name) {
      return res.status(400).json({ message: "Cannot rename system roles" });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions, isActive },
      { returnDocument: 'after' }
    );

    // Audit log: UPDATE_ROLE
    const user = (req as any).user;
    logAudit({
      category: "admin",
      action: "UPDATE_ROLE",
      userId: String(user?.id || "system"),
      userName: user?.username || "System",
      targetId: String(req.params.id),
      details: `Updated role "${updatedRole?.name || name}"`,
      metadata: {
        roleName: name,
        permissions,
        reason: reason || null,
        changeSummary:
          changeSummary ||
          buildPermissionDiffSummary(previousPermissions, permissions || previousPermissions)
      },
      req,
    });

    res.json(updatedRole);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { reason, changeSummary } = req.body || {};
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isSystem) {
      return res.status(400).json({ message: "Cannot delete system roles" });
    }

    // Check if any user is using this role
    const userWithRole = await User.findOne({ roleId: req.params.id });
    if (userWithRole) {
      return res.status(400).json({ message: "Cannot delete role. Users are still assigned to it." });
    }

    await Role.findByIdAndDelete(req.params.id);

    // Audit log: DELETE_ROLE
    const user = (req as any).user;
    logAudit({
      category: "admin",
      action: "DELETE_ROLE",
      userId: String(user?.id || "system"),
      userName: user?.username || "System",
      targetId: String(req.params.id),
      details: `Deleted role "${role.name}"`,
      metadata: {
        roleName: role.name,
        reason: reason || null,
        changeSummary:
          changeSummary ||
          `Removed role with ${role.permissions?.length || 0} permissions.`
      },
      req,
    });

    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
