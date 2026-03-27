import { Request, Response } from "express";
import { Project } from "../models/Project.model";
import { Environment } from "../models/Environment.model";
import { Module } from "../models/Module.model";
import User from "../models/User.model";
import { ConfigEntry } from "../models/ConfigEntry.model";

const calculateStatus = (entry: any) => {
  const today = new Date();

  if (entry.isRevoked) return "revoked";

  if (entry.expireAt && new Date(entry.expireAt) < today) {
    return "expired";
  }

  if (entry.expireAt) {
    const expireDate = new Date(entry.expireAt);
    const diff = expireDate.getTime() - today.getTime();

    if (diff > 0 && diff < 7 * 24 * 60 * 60 * 1000) {
      return "near_expiry";
    }
  }

  if (entry.createdAt) {
    const createdDate = new Date(entry.createdAt);
    const diff = today.getTime() - createdDate.getTime();

    if (diff < 3 * 24 * 60 * 60 * 1000) {
      return "new";
    }
  }

  return "active";
};

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const [projectsCount, environmentsCount, modulesCount] = await Promise.all([
      Project.countDocuments(),
      Environment.countDocuments(),
      Module.countDocuments(),
    ]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [projectsRecentCount, projectsAssignedCount] = await Promise.all([
      Project.countDocuments({ createdAt: { $gte: weekAgo } }),
      Project.countDocuments({ assignedTo: { $exists: true, $ne: [] } }),
    ]);

    const userRoleAgg = await User.aggregate([
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$role.name", "user"] },
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
    ]);

    const roleBreakdown: Record<string, number> = {};
    let usersCount = 0;
    let activeUsersCount = 0;

    userRoleAgg.forEach((row) => {
      roleBreakdown[String(row._id).toLowerCase()] = row.count || 0;
      usersCount += row.count || 0;
      activeUsersCount += row.activeCount || 0;
    });

    const keyStatus = {
      active: 0,
      new: 0,
      near_expiry: 0,
      expired: 0,
      revoked: 0,
    };
    let configKeysCount = 0;

    const configs = await ConfigEntry.find({}, { entries: 1 }).lean();
    configs.forEach((config) => {
      (config.entries || []).forEach((entry: any) => {
        configKeysCount += 1;
        const status = calculateStatus(entry);
        keyStatus[status as keyof typeof keyStatus] += 1;
      });
    });

    return res.json({
      projectsCount,
      projectsRecentCount,
      projectsAssignedCount,
      usersCount,
      activeUsersCount,
      environmentsCount,
      modulesCount,
      configKeysCount,
      keyStatus,
      roleBreakdown,
    });
  } catch (err) {
    console.error("DASHBOARD SUMMARY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
