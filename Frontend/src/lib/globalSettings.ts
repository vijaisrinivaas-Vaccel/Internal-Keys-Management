import { authFetch, API_BASE_URL } from "./auth";

export interface GlobalSettings {
  underMaintenance: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export const getGlobalSettings = async (): Promise<GlobalSettings | null> => {
  try {
    const res = await authFetch(`${API_BASE_URL}/settings`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
    return null;
  }
};

export const updateMaintenanceMode = async (
  underMaintenance: boolean,
  reason?: string
): Promise<GlobalSettings | null> => {
  try {
    const res = await authFetch(`${API_BASE_URL}/settings/maintenance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ underMaintenance, reason }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to update maintenance mode:", error);
    return null;
  }
};
