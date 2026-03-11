import mongoose, { Document, Schema } from "mongoose";
import { Permission, PERMISSIONS } from "../config/accessControl";

export interface ProjectUserPermissionDoc extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  permissions: Permission[];
  grantedBy: mongoose.Types.ObjectId;
  grantedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectUserPermissionSchema = new Schema<ProjectUserPermissionDoc>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: {
      type: [String],
      enum: Object.values(PERMISSIONS),
      default: [],
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grantedByName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure unique combination of projectId and userId
projectUserPermissionSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ProjectUserPermissionDoc>(
  "ProjectUserPermission",
  projectUserPermissionSchema
);