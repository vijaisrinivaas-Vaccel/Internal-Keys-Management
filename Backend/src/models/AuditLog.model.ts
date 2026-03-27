import mongoose, { Document, Schema } from "mongoose";

export type AuditCategory = "auth" | "user" | "permission" | "activity" | "admin";

export interface AuditLogDoc extends Document {
  category: AuditCategory;
  action: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  targetId?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  status: "success" | "failure" | "warning";
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    category: {
      type: String,
      enum: ["auth", "user", "permission", "activity", "admin"],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "failure", "warning"],
      default: "success",
    },
  },
  { timestamps: true }
);

// Compound index for efficient filtered queries
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<AuditLogDoc>("AuditLog", auditLogSchema, "AuditLogs");
