import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import Role from "../models/Role.model";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await User.findById(decoded.id).populate("roleId");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const role = user.roleId as any; // Role document

    // 🔥 Attach everything you need
    (req as any).user = {
      id: user._id,
      fullName: user.fullName,
      roleId: user.roleId,
      roleName: role?.name || "user",
      permissions: role?.permissions || [],
      customPermissions: user.permissions || [],
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorizePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Superadmin override
    if (user.roleName === "superadmin" || user.permissions.includes("*")) {
      return next();
    }

    // Check if user has all required permissions
    const allPermissions = [...user.permissions, ...user.customPermissions];
    
    // Check if user has ANY of the required permissions (OR logic)
    // Or if you want ALL (AND logic), use every. The user's snippet suggested includes(requiredPermission).
    const hasPermission = requiredPermissions.every(perm => allPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied. Missing required permissions." });
    }

    next();
  };
};

// Keep authorizeRoles for backward compatibility if needed, but make it use roleName
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(user.roleName)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

export const attachUserIfPresent = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      ignoreExpiration: true,
    }) as any;

    const user = await User.findById(decoded.id).populate("roleId");
    if (!user) {
      return next();
    }

    const role = user.roleId as any;
    (req as any).user = {
      id: user._id,
      fullName: user.fullName,
      roleId: user.roleId,
      roleName: role?.name || "user",
      permissions: role?.permissions || [],
      customPermissions: user.permissions || [],
    };
  } catch {
    // Optional auth enrichment only; do not block logout flow.
  }

  return next();
};

