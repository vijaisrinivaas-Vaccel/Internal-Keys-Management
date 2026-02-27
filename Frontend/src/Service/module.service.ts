import { authFetch } from "../lib/auth";

export const fetchModules = async () => {
  const res = await authFetch("http://localhost:8000/api/modules");

  if (!res.ok) {
    throw new Error("Failed to fetch modules");
  }

  return await res.json();
};