import { Request, Response } from "express";
import GlobalSetting from "../models/GlobalSetting.model";
import { logAudit } from "../middlewares/auditLogger";

export const getGlobalSettings = async (req: Request, res: Response) => {
  try {
    let settings = await GlobalSetting.findOne();
    if (!settings) {
      settings = await GlobalSetting.create({ underMaintenance: false });
    }
    res.json(settings);
  } catch (err) {
    console.error("GET GLOBAL SETTINGS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMaintenanceMode = async (req: Request, res: Response) => {
  try {
    const { underMaintenance, reason } = req.body;
    const user = (req as any).user;

    if (typeof underMaintenance !== "boolean") {
      return res.status(400).json({ message: "Invalid maintenance status" });
    }

    let settings = await GlobalSetting.findOne();
    if (!settings) {
      settings = new GlobalSetting();
    }

    const previousStatus = settings.underMaintenance;
    settings.underMaintenance = underMaintenance;
    settings.updatedBy = user.id;
    await settings.save();

    // Audit log
    logAudit({
      category: "admin",
      action: underMaintenance ? "ENABLE_MAINTENANCE" : "DISABLE_MAINTENANCE",
      userId: String(user?.id || "system"),
      fullName: user?.fullName || "System",
      targetId: String(settings._id),
      details: `Maintenance mode ${underMaintenance ? "enabled" : "disabled"}`,
      metadata: {
        previousStatus,
        newStatus: underMaintenance,
        reason: reason || null,
      },
      req,
    });

    res.json(settings);
  } catch (err) {
    console.error("UPDATE MAINTENANCE MODE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
