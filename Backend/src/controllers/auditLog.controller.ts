import { Request, Response } from "express";
import AuditLog from "../models/AuditLog.model";
import User from "../models/User.model";

/* ================= GET AUDIT LOGS ================= */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const {
      category,
      search,
      startDate,
      endDate,
      action,
      status,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    // Build query
    const query: any = {};

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Action filter
    if (action) {
      query.action = action;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search by employee name
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      // Search by userName field directly
      query.userName = searchRegex;
    }

    // Role-based visibility
    const isSuperAdmin = currentUser.roleName === "superadmin";
    const isAdmin = currentUser.roleName === "admin";

    if (!isSuperAdmin && !isAdmin) {
      // Regular users only see their own logs
      query.userId = currentUser.id;
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("userId", "username firstname lastname email employeeId")
      .lean();

    return res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("GET AUDIT LOGS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET AUDIT LOG STATS ================= */
export const getAuditLogStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    const matchStage: any = {};

    // Role-based visibility
    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin") {
      matchStage.userId = currentUser.id;
    }

    const stats = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          lastEntry: { $max: "$createdAt" },
        },
      },
    ]);

    const categoryStats: Record<string, { count: number; lastEntry: Date | null }> = {
      auth: { count: 0, lastEntry: null },
      user: { count: 0, lastEntry: null },
      permission: { count: 0, lastEntry: null },
      activity: { count: 0, lastEntry: null },
      admin: { count: 0, lastEntry: null },
    };

    stats.forEach((s) => {
      categoryStats[s._id] = { count: s.count, lastEntry: s.lastEntry };
    });

    return res.json(categoryStats);
  } catch (err) {
    console.error("GET AUDIT STATS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= EXPORT AUDIT LOGS AS CSV ================= */
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { category, search, startDate, endDate } = req.query;

    const query: any = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      query.userName = new RegExp(search as string, "i");
    }

    if (currentUser.roleName !== "superadmin" && currentUser.roleName !== "admin") {
      query.userId = currentUser.id;
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    // Build CSV
    const headers = "Date,Time,User,Action,Category,Details,Status,IP Address";
    const rows = logs.map((log) => {
      const date = new Date(log.createdAt);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `"${log.userName}"`,
        log.action,
        log.category,
        `"${log.details.replace(/"/g, '""')}"`,
        log.status,
        log.ipAddress || "-",
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");

    res.setHeader("Content-Disposition", `attachment; filename=audit_logs_${category || "all"}_${Date.now()}.csv`);
    res.setHeader("Content-Type", "text/csv");
    return res.send(csv);
  } catch (err) {
    console.error("EXPORT AUDIT LOGS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE AUDIT LOG (SUPERADMIN) ================= */
export const deleteAuditLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await AuditLog.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    return res.json({ message: "Audit log deleted successfully" });
  } catch (err) {
    console.error("DELETE AUDIT LOG ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
