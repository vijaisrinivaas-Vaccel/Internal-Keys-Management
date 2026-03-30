import mongoose from "mongoose";
import ProjectTemplate from "../models/ProjectTemplate.model";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI! as string; // change if needed

async function seedDefaultTemplate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to DB");

    const existing = await ProjectTemplate.findOne({ name: "Default Project Template" });

    if (existing) {
      console.log("⚠️ Default template already exists");
      process.exit(0);
    }

    const template = await ProjectTemplate.create({
      name: "Default Project Template",
      description: "Default environments and modules for new projects",

      isGlobal: true,
      createdBy: new mongoose.Types.ObjectId(), // system user

      environments: [
        {
          name: "Development",
          order: 0,
          isDefault: true,
          modules: [
            { name: "Database", order: 0, isDefault: true },
            { name: "Auth Service", order: 1, isDefault: true },
            { name: "S3 Storage", order: 2, isDefault: true },
            { name: "Payment Gateway", order: 3, isDefault: true },
            { name: "Email Service", order: 4, isDefault: true }
          ]
        },
        {
          name: "Staging",
          order: 1,
          isDefault: true,
          modules: [
            { name: "Database", order: 0, isDefault: true },
            { name: "Auth Service", order: 1, isDefault: true },
            { name: "S3 Storage", order: 2, isDefault: true },
            { name: "Payment Gateway", order: 3, isDefault: true },
            { name: "Email Service", order: 4, isDefault: true }
          ]
        },
        {
          name: "UAT",
          order: 2,
          isDefault: true,
          modules: [
            { name: "Database", order: 0, isDefault: true },
            { name: "Auth Service", order: 1, isDefault: true },
            { name: "S3 Storage", order: 2, isDefault: true },
            { name: "Payment Gateway", order: 3, isDefault: true },
            { name: "Email Service", order: 4, isDefault: true }
          ]
        },
        {
          name: "Production",
          order: 3,
          isDefault: true,
          modules: [
            { name: "Database", order: 0, isDefault: true },
            { name: "Auth Service", order: 1, isDefault: true },
            { name: "S3 Storage", order: 2, isDefault: true },
            { name: "Payment Gateway", order: 3, isDefault: true },
            { name: "Email Service", order: 4, isDefault: true }
          ]
        }
      ]
    });

    console.log("✅ Default template created:", template.name);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seedDefaultTemplate();