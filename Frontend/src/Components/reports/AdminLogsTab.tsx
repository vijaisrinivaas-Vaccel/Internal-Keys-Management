import { useState } from "react";
import { CircleHelp, X } from "lucide-react";
import AuditLogTable from "./AuditLogTable";
import type { AuditLogEntry } from "../hooks/useAuditLogs";

const ADMIN_ACTIONS = [
  { value: "CREATE_TEMPLATE", label: "Create Template" },
  { value: "UPDATE_TEMPLATE", label: "Update Template" },
  { value: "DELETE_TEMPLATE", label: "Delete Template" },
  { value: "CREATE_CONFIG_TEMPLATE", label: "Create Config Template" },
  { value: "UPDATE_CONFIG_TEMPLATE", label: "Update Config Template" },
  { value: "DELETE_CONFIG_TEMPLATE", label: "Delete Config Template" },
  { value: "CREATE_ROLE", label: "Create Role" },
  { value: "UPDATE_ROLE", label: "Update Role" },
  { value: "DELETE_ROLE", label: "Delete Role" },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE_TEMPLATE: "text-emerald-600 dark:text-emerald-400",
  UPDATE_TEMPLATE: "text-amber-600 dark:text-amber-400",
  DELETE_TEMPLATE: "text-red-600 dark:text-red-400",
  CREATE_CONFIG_TEMPLATE: "text-emerald-600 dark:text-emerald-400",
  UPDATE_CONFIG_TEMPLATE: "text-amber-600 dark:text-amber-400",
  DELETE_CONFIG_TEMPLATE: "text-red-600 dark:text-red-400",
  CREATE_ROLE: "text-emerald-600 dark:text-emerald-400",
  UPDATE_ROLE: "text-amber-600 dark:text-amber-400",
  DELETE_ROLE: "text-red-600 dark:text-red-400",
};

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  failure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

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

const formatAction = (action: string) =>
  action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminLogsTab() {
  const [selectedReason, setSelectedReason] = useState<{
    reason: string;
    changeSummary: string;
  } | null>(null);

  const columns = [
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
      key: "reason",
      label: "Reason",
      render: (log: AuditLogEntry) => {
        const reason =
          typeof log.metadata?.reason === "string" && log.metadata.reason.trim()
            ? log.metadata.reason.trim()
            : "";

        if (!reason) {
          return <span className="text-xs text-gray-400">-</span>;
        }

        return (
          <button
            type="button"
            onClick={() =>
              setSelectedReason({
                reason,
                changeSummary:
                  typeof log.metadata?.changeSummary === "string" && log.metadata.changeSummary.trim()
                    ? log.metadata.changeSummary.trim()
                    : log.details
              })
            }
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
            title="View reason"
          >
            <CircleHelp size={14} />
          </button>
        );
      },
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

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Admin Panel Logs</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track changes to admin panel configurations - templates, roles, and system settings
        </p>
      </div>
      <AuditLogTable category="admin" actionOptions={ADMIN_ACTIONS} columns={columns} />

      {selectedReason && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800">Reason</h4>
              <button
                onClick={() => setSelectedReason(null)}
                className="p-1 rounded-md hover:bg-gray-100 transition"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReason.reason}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Changes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReason.changeSummary || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
