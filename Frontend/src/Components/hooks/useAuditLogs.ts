import { useState, useEffect, useCallback } from "react";
import { authFetch, API_BASE_URL } from "../../lib/auth";

export interface AuditLogEntry {
  _id: string;
  category: string;
  action: string;
  userId: {
    _id: string;
    fullName: string;
    firstname: string;
    lastname: string;
    email: string;
    employeeId?: string;
  } | null;
  fullName: string;
  targetId?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  status: "success" | "failure" | "warning";
  createdAt: string;
}

export interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UseAuditLogsOptions {
  category: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<AuditPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("category", options.category);
      if (options.search) params.set("search", options.search);
      if (options.startDate) params.set("startDate", options.startDate);
      if (options.endDate) params.set("endDate", options.endDate);
      if (options.action) params.set("action", options.action);
      if (options.status) params.set("status", options.status);
      params.set("page", String(options.page || 1));
      params.set("limit", String(options.limit || 10));

      const res = await authFetch(`${API_BASE_URL}/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");

      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || "Error fetching logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [
    options.category,
    options.search,
    options.startDate,
    options.endDate,
    options.action,
    options.status,
    options.page,
    options.limit,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCsv = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("category", options.category);
    if (options.search) params.set("search", options.search);
    if (options.startDate) params.set("startDate", options.startDate);
    if (options.endDate) params.set("endDate", options.endDate);

    const res = await authFetch(`${API_BASE_URL}/audit-logs/export?${params.toString()}`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${options.category}_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [options.category, options.search, options.startDate, options.endDate]);

  const deleteLog = useCallback(async (id: string) => {
    const res = await authFetch(`${API_BASE_URL}/audit-logs/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Failed to delete log" }));
      throw new Error(data.message || "Failed to delete log");
    }

    setLogs((prev) => prev.filter((log) => log._id !== id));
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  return { logs, pagination, loading, error, refetch: fetchLogs, exportCsv, deleteLog };
}
