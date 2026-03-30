import mongoose, { Document, Schema } from "mongoose";

export interface ProjectDoc extends Document {
  title: string;
  description?: string;
  url?: string;
  uploadedFile?: string;

  createdBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId[];

  templateId?: mongoose.Types.ObjectId;
  templateName?: string;

  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    description: {
      type: String,
      trim: true,
    },

    url: {
      type: String,
      trim: true,
    },

    uploadedFile: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Add these new fields
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectTemplate",
    },

    templateName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model<ProjectDoc>("Project", projectSchema);