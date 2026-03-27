import { Request, Response } from "express";
import User from "../models/User.model";
import Role from "../models/Role.model";
import { logAudit } from "../middlewares/auditLogger";

/* ================= GET USERS ================= */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    let query: any = {};

    const roleName = (currentUser as any).roleName;

    if (roleName === "superadmin") {
      // Superadmin can see all except other superadmins (optional)
      // For now, let's say they see all roles that are not isSystem: true, or just all.
      query = {}; 
    } else if (roleName === "admin") {
      // Admin can only see 'user' role users
      // This will need a lookup for the 'user' role ID
      const userRole = await Role.findOne({ name: "user" });
      if (userRole) {
        query = { roleId: userRole._id };
      }
    }

    const users = await User.find(query).select("-password").populate("roleId");

    const transformedUsers = users.map((u: any) => ({
      ...u.toObject(),
      role: u.roleId?.name || "user",
    }));

    res.json(transformedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SINGLE USER ================= */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password").populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      ...user.toObject(),
      role: (user.roleId as any)?.name || "user",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE ROLE ================= */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId, reason } = req.body;

    const existingUser = await User.findById(id).select("username email roleId");
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { roleId },
      { returnDocument: 'after' }
    ).select("-password").populate("roleId");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = (req as any).user;
    logAudit({
      category: "user",
      action: "UPDATE_USER_ROLE",
      userId: String(currentUser?.id || "system"),
      userName: currentUser?.username || "System",
      targetId: String(id),
      details: `Changed role for ${existingUser.username || existingUser.email}`,
      metadata: {
        reason: reason || null,
        previousRoleId: (existingUser as any).roleId,
        newRoleId: roleId,
      },
      req,
    });

    res.json({
      ...updated.toObject(),
      role: (updated.roleId as any)?.name || "user",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= TOGGLE STATUS ================= */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    // Audit log: TOGGLE_STATUS
    const currentUser = (req as any).user;
    logAudit({
      category: "user",
      action: user.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      userId: String(currentUser?.id || id),
      userName: currentUser?.username || "System",
      targetId: String(id),
      details: `User ${user.username} ${user.isActive ? "activated" : "deactivated"}`,
      metadata: { reason: reason || null },
      req,
    });

    const { password, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE USER PROFILE ================= */

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestingUser = (req as any).user;

    console.log("Updating user profile:", { id, requestingUser: requestingUser?.id, body: req.body });

    const userToUpdate = await User.findById(id).populate("roleId");
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    const requestingUserRole = (requestingUser as any).roleName;
    const isSuperAdmin = requestingUserRole === "superadmin";
    const isAdmin = requestingUserRole === "admin";
    const isOwnProfile = requestingUser?.id.toString() === id;

    if (!isSuperAdmin && !isAdmin && !isOwnProfile) {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    const {
      firstname,
      lastname,
      email,
      employeeId,
      jobRole,
      jobLevel,
      username,
      permissions,
      roleId, // Add this if allowed
      reason,
    } = req.body;

    const updateData: any = {};

    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (email !== undefined) updateData.email = email;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (jobRole !== undefined) updateData.jobRole = jobRole;
    if (jobLevel !== undefined) updateData.jobLevel = jobLevel;

    // Only superadmin/admin can update permissions
    if (permissions !== undefined && (isSuperAdmin || isAdmin)) {
      updateData.permissions = permissions;
    }

    // Only superadmin can update username and role
    if (username !== undefined && isSuperAdmin) {
      updateData.username = username;
    }
    
    if (roleId !== undefined && isSuperAdmin) {
      updateData.roleId = roleId;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).select("-password").populate("roleId");

    console.log("User updated successfully:", updatedUser);

    // Audit log: UPDATE_USER
    logAudit({
      category: "user",
      action: "UPDATE_USER",
      userId: String(requestingUser.id),
      userName: requestingUser.username || "Unknown",
      targetId: String(id),
      details: `Updated user profile for ${updatedUser?.username || id}`,
      metadata: { updatedFields: Object.keys(updateData), reason: reason || null },
      req,
    });

    res.json({
      ...updatedUser?.toObject(),
      role: (updatedUser?.roleId as any)?.name || "user",
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "error" });
  }
};

/* ================= DELETE ================= */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    // Audit log: DELETE_USER
    const currentUser = (req as any).user;
    logAudit({
      category: "user",
      action: "DELETE_USER",
      userId: String(currentUser?.id || "system"),
      userName: currentUser?.username || "System",
      targetId: String(id),
      details: `Deleted user ${deleted.username || deleted.email}`,
      metadata: { reason: reason || null },
      req,
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = (req as any).user._id;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password (assuming you have a pre-save hook that hashes)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
