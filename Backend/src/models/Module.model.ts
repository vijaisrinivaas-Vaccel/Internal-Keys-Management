import mongoose from "mongoose";

interface ModuleDoc extends mongoose.Document {
  moduleName: string; 

  projectId: mongoose.Types.ObjectId;     
  environmentId: mongoose.Types.ObjectId; 

  description?: string;
  createdBy: mongoose.Types.ObjectId;
  isParent: boolean;
}

const moduleSchema = new mongoose.Schema<ModuleDoc>(
  {
    moduleName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    
    environmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Environment",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,   
    },
    isParent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Module = mongoose.model<ModuleDoc>("Module", moduleSchema);