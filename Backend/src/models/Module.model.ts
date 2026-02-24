import mongoose from "mongoose";

interface ModuleDoc extends mongoose.Document {
  moduleName: string; 

  description?: string;

  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  
}

const moduleSchema = new mongoose.Schema<ModuleDoc>(
  {
    moduleName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
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
    createdByName: {
      type: String,
      required: true, 
    },
  },
  { timestamps: true }
);

export const Module = mongoose.model<ModuleDoc>("Module", moduleSchema);