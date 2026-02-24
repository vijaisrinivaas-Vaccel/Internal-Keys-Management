import mongoose, { Document, Schema } from "mongoose";
import argon2 from "argon2";

export interface UserDoc extends Document {
  firstname: string;
  lastname: string;
  username: string;
  employeeId?: string;
  email: string;
  password: string;
  role: "superadmin" | "admin" | "user";
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },

    username: {
      type: String,
      unique: true,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Hide password by default
    },

    role: {
      type: String,
      enum: ["superadmin", "admin", "user"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Track who created this user (useful for admin control)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await argon2.hash(this.password);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return argon2.verify(this.password, candidatePassword);
};

userSchema.pre("save", async function () {
  if (!this.isModified("firstname") && !this.isModified("lastname")) {
    return;
  }

  const capitalize = (str: string) =>
    str
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");

  const first = capitalize(this.firstname);
  const last = capitalize(this.lastname);

  this.firstname = first;
  this.lastname = last;
  this.username = `${first} ${last}`;
});

export default mongoose.model<UserDoc>("User", userSchema, "Users");

