import Role from "../models/Role.model";
import { PERMISSIONS } from "../config/accessControl";

export const seedRoles = async () => {
  try {
    const defaultRoles = [
      {
        name: "superadmin",
        description: "Full system access",
        isSystem: true,
        permissions: ["*"], // Special permission for full access
      },
      {
        name: "admin",
        description: "Administrator with most management permissions",
        isSystem: true,
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_PROJECTS,
          PERMISSIONS.CREATE_PROJECT,
          PERMISSIONS.UPDATE_PROJECT,
          PERMISSIONS.VIEW_USERS,
          PERMISSIONS.CREATE_USER,
          PERMISSIONS.UPDATE_USER,
          PERMISSIONS.VIEW_REPORTS,
          PERMISSIONS.VIEW_ROLES,
        ],
      },
      {
        name: "user",
        description: "Standard user with limited access",
        isSystem: true,
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_PROJECTS,
        ],
      },
    ];

    for (const roleData of defaultRoles) {
      const exists = await Role.findOne({ name: roleData.name });
      if (!exists) {
        await Role.create(roleData);
        console.log(`✅ Default role '${roleData.name}' created.`);
      }
    }
  } catch (err) {
    console.error("❌ Error seeding roles:", err);
  }
};
