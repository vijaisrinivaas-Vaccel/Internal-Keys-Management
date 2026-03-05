import mongoose, { Document, Schema } from "mongoose";

export interface ProjectDoc extends Document {
  title: string;
  description?: string;
  url?: string;
  uploadedFile?: string;

  createdBy: mongoose.Types.ObjectId;
  createdByName: string;

  lastEditedBy?: mongoose.Types.ObjectId;
  lastEditedByName?: string;

  assignedTo?: mongoose.Types.ObjectId[];
  assignedToNames?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
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

    createdByName: {
      type: String,
      required: true,
      trim: true,
    },

    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    lastEditedByName: {
      type: String,
      trim: true,
    },

    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    assignedToNames: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true,}
);

export const Project = mongoose.model<ProjectDoc>("Project",projectSchema);