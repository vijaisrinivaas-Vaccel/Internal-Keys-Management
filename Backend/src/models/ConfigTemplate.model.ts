import mongoose, { Document, Schema } from "mongoose";

export interface ConfigTemplateEntry {
  key: string;
  value: string;
  description?: string;
}

export interface ConfigTemplateDoc extends Document {
  name: string;
  description?: string;
  configs: ConfigTemplateEntry[];
  version: number;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const configTemplateEntrySchema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
  description: { type: String }
});

const configTemplateSchema = new Schema<ConfigTemplateDoc>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    configs: [configTemplateEntrySchema],
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedByName: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<ConfigTemplateDoc>("ConfigTemplate", configTemplateSchema);