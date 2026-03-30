import mongoose, { Schema, Document } from "mongoose";

export interface IProjectTemplate extends Document {
  name: string;
  description?: string;
  environments: IEnvironmentConfig[];
  isActive: boolean;
  isGlobal: boolean;
  version: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnvironmentConfig {
  name: string;
  order: number;
  isDefault: boolean;
  modules: IModuleConfig[];
}

export interface IModuleConfig {
  name: string;
  description?: string;
  order: number;
  isDefault: boolean;
}


const ModuleConfigSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
});

const EnvironmentConfigSchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  modules: [ModuleConfigSchema]
});

const ProjectTemplateSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  environments: [EnvironmentConfigSchema],
  isActive: { type: Boolean, default: true },
  isGlobal: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true
});

export default mongoose.model<IProjectTemplate>("ProjectTemplate", ProjectTemplateSchema);