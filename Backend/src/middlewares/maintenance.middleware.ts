import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import GlobalSetting from "../models/GlobalSetting.model";
import User from "../models/User.model";

export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Always allow these paths
    const allowedPaths = [
      "/api/auth/login", 
      "/api/auth/me", 
      "/api/auth/refresh", 
      "/api/auth/logout",
      "/api/settings"
    ];
    if (allowedPaths.some(path => req.originalUrl.startsWith(path))) {
      return next();
    }

    // 2. Check if maintenance is active
    const settings = await GlobalSetting.findOne();
    if (!settings?.underMaintenance) {
      return next();
    }

    // 3. Maintenance is ON. Try to identify the user.
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).populate("roleId");
        const roleName = (user?.roleId as any)?.name || "user";

        if (roleName === "superadmin") {
          return next();
        }
      } catch (err) {
        // Token invalid or expired, proceed to block
      }
    }

    // 4. If maintenance is ON and user is NOT a superadmin, block request
    return res.status(503).json({
      message: "UNDER_MAINTENANCE",
      error: "The system is currently under maintenance. Only Superadmins have access at this time."
    });
  } catch (err) {
    console.error("MAINTENANCE MIDDLEWARE ERROR:", err);
    next();
  }
};
