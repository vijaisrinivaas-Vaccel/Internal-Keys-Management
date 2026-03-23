import mongoose, { Document, Schema } from "mongoose";
import { Permission, PERMISSIONS } from "../config/accessControl";

export interface ConfigEntryPermission {
  configId: mongoose.Types.ObjectId;
  permissions: Permission[];
}

export interface ModulePermission {
  moduleId: mongoose.Types.ObjectId;
  permissions: Permission[];
  accessAll: boolean;
  configEntries?: ConfigEntryPermission[];
}

export interface EnvironmentPermission {
  environmentId: mongoose.Types.ObjectId;
  permissions: Permission[];
  modules?: ModulePermission[];
}

export interface ProjectUserPermissionDoc extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  environments: EnvironmentPermission[];
  grantedBy: mongoose.Types.ObjectId;
  grantedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const configEntryPermissionSchema = new Schema({
  configId: {
    type: Schema.Types.ObjectId,
    ref: "ConfigEntry",
    required: true,
  },
  permissions: {
    type: [String],
    enum: Object.values(PERMISSIONS),
    default: [],
  },
});

const modulePermissionSchema = new Schema({
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  permissions: {
    type: [String],
    enum: Object.values(PERMISSIONS),
    default: [],
  },
  accessAll: {
    type: Boolean,
    default: false,
  },
  configEntries: [configEntryPermissionSchema],
});

const environmentPermissionSchema = new Schema({
  environmentId: {
    type: Schema.Types.ObjectId,
    ref: "Environment",
    required: true,
  },
  permissions: {
    type: [String],
    enum: Object.values(PERMISSIONS),
    default: ["READ_ENVIRONMENT"], // Default permission when assigned
  },
  modules: [modulePermissionSchema],
});

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
    environments: [environmentPermissionSchema],
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