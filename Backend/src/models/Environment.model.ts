import mongoose from "mongoose";

interface EnvironmentDoc extends mongoose.Document {
  name: string;              // Dev, UAT, Staging, Prod
  isGlobal: boolean;         // true = visible for all projects
  projectId: mongoose.Types.ObjectId; // only if custom
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
}

const environmentSchema = new mongoose.Schema<EnvironmentDoc>(
  {
    name: { type: String, required: true, trim: true },
    isGlobal: { type: Boolean, default: false },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Environment = mongoose.model<EnvironmentDoc>(
  "Environment",
  environmentSchema
);