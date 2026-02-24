import mongoose from "mongoose";

interface ConfigEntryDoc extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;

  entries: {
    key: string;
    value: any;
    description?: string;
  }[];

  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  lastEditedByName?: string;
}

const configEntrySchema = new mongoose.Schema<ConfigEntryDoc>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    entries: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByName: {
      type: String,
      required: true,
    },

    lastEditedByName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const ConfigEntry = mongoose.model<ConfigEntryDoc>("ConfigEntry", configEntrySchema);