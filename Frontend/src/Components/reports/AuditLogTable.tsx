import { useState } from "react";
import { Search, Calendar, Download, ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
import { useAuditLogs, type AuditLogEntry } from "../hooks/useAuditLogs";

interface AuditLogTableProps {
  category: string;
  actionOptions?: { value: string; label: string }[];
  columns?: { key: string; label: string; render?: (log: AuditLogEntry) => React.ReactNode }[];
}

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  failure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-blue-600 dark:text-blue-400",
  LOGOUT: "text-gray-500 dark:text-gray-400",
  CREATE_USER: "text-emerald-600 dark:text-emerald-400",
  UPDATE_USER: "text-amber-600 dark:text-amber-400",
  DELETE_USER: "text-red-600 dark:text-red-400",
  ACTIVATE_USER: "text-emerald-600 dark:text-emerald-400",
  DEACTIVATE_USER: "text-red-600 dark:text-red-400",
  ASSIGN_PROJECT: "text-blue-600 dark:text-blue-400",
  UPDATE_PERMISSION: "text-amber-600 dark:text-amber-400",
  REMOVE_PERMISSION: "text-red-600 dark:text-red-400",
  CREATE_CONFIG: "text-emerald-600 dark:text-emerald-400",
  UPDATE_CONFIG: "text-amber-600 dark:text-amber-400",
  DELETE_CONFIG: "text-red-600 dark:text-red-400",
  CREATE_TEMPLATE: "text-emerald-600 dark:text-emerald-400",
  UPDATE_TEMPLATE: "text-amber-600 dark:text-amber-400",
  DELETE_TEMPLATE: "text-red-600 dark:text-red-400",
  CREATE_ROLE: "text-emerald-600 dark:text-emerald-400",
  UPDATE_ROLE: "text-amber-600 dark:text-amber-400",
  DELETE_ROLE: "text-red-600 dark:text-red-400",
};

export default function AuditLogTable({ category, actionOptions, columns }: AuditLogTableProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
    setTimer(t);
  };

  const { logs, pagination, loading, error, refetch, exportCsv, deleteLog } = useAuditLogs({
    category,
    search: debouncedSearch,
    startDate,
    endDate,
    action: selectedAction,
    page,
    limit: 10,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canDeleteAuditLogs = currentUser?.role === "superadmin";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) return "-";
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const defaultColumns = [
    {
      key: "date",
      label: "Date & Time",
      render: (log: AuditLogEntry) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white text-sm">{formatDate(log.createdAt)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(log.createdAt)}</div>
        </div>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (log: AuditLogEntry) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white text-sm">
            {log.userId?.username || log.userName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {log.userId?.email || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (log: AuditLogEntry) => (
        <span className={`font-semibold text-sm ${ACTION_COLORS[log.action] || "text-gray-700 dark:text-gray-300"}`}>
          {formatAction(log.action)}
        </span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (log: AuditLogEntry) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate block">
          {log.details}
        </span>
      ),
    },
    {
      key: "loggedHours",
      label: "Logged Hours",
      render: (log: AuditLogEntry) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
          {category === "auth" && log.action === "LOGOUT"
            ? formatDuration(Number(log.metadata?.sessionDurationMs))
            : "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (log: AuditLogEntry) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[log.status] || STATUS_STYLES.success}`}>
          {log.status}
        </span>
      ),
    },
  ];

  const displayColumns = columns || defaultColumns;
  const allColumns = canDeleteAuditLogs
    ? [
        ...displayColumns,
        {
          key: "rowActions",
          label: "Actions",
          render: (log: AuditLogEntry) => (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this audit log permanently?")) return;
                try {
                  setDeletingId(log._id);
                  await deleteLog(log._id);
                } catch (err: any) {
                  alert(err.message || "Failed to delete audit log");
                } finally {
                  setDeletingId(null);
                }
              }}
              disabled={deletingId === log._id}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Delete log"
            >
              <Trash2 size={14} className={deletingId === log._id ? "animate-pulse" : ""} />
            </button>
          ),
        },
      ]
    : displayColumns;

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <span className="text-gray-400 text-sm">to</span>
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Action Filter */}
        {actionOptions && actionOptions.length > 0 && (
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">All Actions</option>
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Actions */}
        <button
          onClick={refetch}
          className="p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    className={
                      col.key === "rowActions"
                        ? "w-14 px-2 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        : "px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    }
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {allColumns.map((col) => (
                      <td
                        key={col.key}
                        className={col.key === "rowActions" ? "px-2 py-4 text-center" : "px-5 py-4"}
                      >
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length} className="px-5 py-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500">
                      <div className="text-lg font-medium mb-1">No logs found</div>
                      <div className="text-sm">Try adjusting your filters or date range</div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {allColumns.map((col) => (
                      <td
                        key={col.key}
                        className={col.key === "rowActions" ? "px-2 py-3.5 text-center" : "px-5 py-3.5"}
                      >
                        {col.render ? col.render(log) : (log as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      pagination.page === pageNum
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
