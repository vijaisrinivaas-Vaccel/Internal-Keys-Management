import mongoose from "mongoose";
import crypto from "crypto";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "supersecretkey123";

export const encrypt = (text: string) => {
  const key = crypto.scryptSync(ENCRYPTION_SECRET, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr", key, iv);
  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (hash: string) => {
  const key = crypto.scryptSync(ENCRYPTION_SECRET, "salt", 32);
  const [ivHex, encrypted] = hash.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-ctr", key, iv);
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};

interface Entry {
  key: string;
  value: string;
  expireAt?: Date;
  isRevoked?: boolean;
  version?: number;
  lastUsedAt?: Date;
  description?: string;
  
}

interface ConfigEntryDoc extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  environmentId: mongoose.Types.ObjectId; 
  entries: Entry[];
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  lastEditedByName?: string;
}

const entrySchema = new mongoose.Schema<Entry>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true },
    expireAt: { type: Date },
    isRevoked: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    lastUsedAt: { type: Date },
    description: { type: String },
    
  },
  { timestamps: true }
);

const configEntrySchema = new mongoose.Schema<ConfigEntryDoc>(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    environmentId: {type: mongoose.Schema.Types.ObjectId,ref: "Environment",required: true},
    entries: [entrySchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
    lastEditedByName: { type: String },
    
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);



export const ConfigEntry = mongoose.model<ConfigEntryDoc>(
  "ConfigEntry",
  configEntrySchema
);

// 🔓 Helper to decrypt
export const decryptValue = (value: string) => {
  if (value.startsWith("enc::")) {
    return decrypt(value.replace("enc::", ""));
  }
  return value;
};