import { Request } from "express";
import AuditLog, { AuditCategory } from "../models/AuditLog.model";

interface AuditParams {
  category: AuditCategory;
  action: string;
  userId: string;
  fullName: string;
  targetId?: string;
  details: string;
  metadata?: Record<string, any>;
  status?: "success" | "failure" | "warning";
  req?: Request;
}

/**
 * Fire-and-forget audit logger.
 * Call after a successful (or failed) operation.
 */
export function logAudit(params: AuditParams): void {
  const ipAddress =
    params.req?.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    params.req?.socket?.remoteAddress ||
    undefined;

  AuditLog.create({
    category: params.category,
    action: params.action,
    userId: String(params.userId),
    fullName: String(params.fullName),
    targetId: params.targetId ? String(params.targetId) : undefined,
    details: params.details,
    metadata: params.metadata || {},
    ipAddress,
    status: params.status || "success",
  }).catch((err) => {
    console.error("AUDIT LOG ERROR:", err);
  });
}
