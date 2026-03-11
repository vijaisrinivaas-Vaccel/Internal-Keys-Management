import { Request, Response } from "express";
import User from "../models/User.model";

/* ================= GET USERS ================= */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    let query: any = {};

    if (currentUser.role === "superadmin") {
      query = { role: { $in: ["admin", "user"] } };
    }

    if (currentUser.role === "admin") {
      query = { role: "user" };
    }

    const users = await User.find(query).select("-password");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SINGLE USER ================= */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE ROLE ================= */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { role },
      { returnDocument: 'after' }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= TOGGLE STATUS ================= */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

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

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSuperAdmin = requestingUser?.role === "superadmin";
    const isAdmin = requestingUser?.role === "admin";
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
      permissions // Add this
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

    // Only superadmin can update username
    if (username !== undefined && isSuperAdmin) {
      updateData.username = username;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).select("-password");

    console.log("User updated successfully:", updatedUser);

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "error" });
  }
};

/* ================= DELETE ================= */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

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