import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const migrateAllUsersNative = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/project_keys";
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not found");

    const usersCollection = db.collection("Users");
    const rolesCollection = db.collection("roles");

    // 1. Fetch system roles
    const roles = await rolesCollection.find({ isSystem: true }).toArray();
    const roleMap: Record<string, any> = {};
    
    roles.forEach(role => {
      roleMap[role.name] = role._id;
    });

    console.log("System Roles Found in DB:", Object.keys(roleMap));

    if (!roleMap["superadmin"] || !roleMap["admin"] || !roleMap["user"]) {
      console.error("Missing one or more system roles (superadmin, admin, user).");
      process.exit(1);
    }

    // 2. Fetch all users
    const users = await usersCollection.find({}).toArray();
    console.log(`Checking ${users.length} total users...`);

    let migratedCount = 0;
    for (const user of users) {
      if (user.roleId) {
        console.log(`  - user ${user.email} already has roleId. skipping.`);
        continue;
      }

      const oldRole = user.role || user.Role;
      if (!oldRole) {
        console.warn(`  ⚠️ skipping ${user.email}: No 'role' field found. Fields: ${Object.keys(user)}`);
        continue;
      }

      const roleName = String(oldRole).toLowerCase();
      const targetRoleId = roleMap[roleName];

      if (targetRoleId) {
        console.log(`  Updating ${user.email}: "${oldRole}" -> ${targetRoleId}`);
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { roleId: targetRoleId },
            $unset: { role: "", Role: "" } 
          }
        );
        migratedCount++;
      } else {
        console.warn(`  ⚠️ skipping ${user.email}: No mapping found for role value "${oldRole}"`);
      }
    }

    console.log(`\n✅ Migration summary: ${migratedCount} users successfully updated.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrateAllUsersNative();
