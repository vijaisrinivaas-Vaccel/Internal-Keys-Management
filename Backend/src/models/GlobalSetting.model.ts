import mongoose, { Document, Schema } from "mongoose";

export interface GlobalSettingDoc extends Document {
  underMaintenance: boolean;
  updatedBy?: mongoose.Types.ObjectId;
}

const globalSettingSchema = new Schema<GlobalSettingDoc>(
  {
    underMaintenance: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model<GlobalSettingDoc>("GlobalSetting", globalSettingSchema, "GlobalSettings");
