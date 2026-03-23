import { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../../lib/auth";
import ConfigEntryDialog from "./ConfigEntryDialog";
import ImportFileDialog from "./ImportFileDialog";
import { Eye, EyeOff, Copy, CheckSquare, ChevronDown, ChevronRight, Move, Copy as CopyIcon, X, Upload, Plus, Download, FileText } from "lucide-react";
import { Delbutton, EditButton } from "../../../Components/ui/Button";
import ConfirmationDialog from "../../../Components/common/ConfirmationDialog";
import { usePermissions } from "../../../Components/hooks/usePermissions";
import { PERMISSIONS } from "../../../userModel/User";

interface Entry {
  _id: string;
  key: string;
  value: string;
  createdAt: string;
  keyStatus?: string;
}

interface ConfigResponse {
  _id: string;
  moduleId: string;
  entries: Entry[];
}

interface Module {
  _id: string;
  moduleName: string;
}

interface ConfigTemplate {
  _id: string;
  name: string;
  description?: string;
  configs: Array<{ key: string; value: string; description?: string }>;
}

interface Props {
  projectId: string;
  environmentId: string;
  moduleId: string;
  moduleName?: string;
  isParent?: boolean;
}

export default function ConfigPage({ projectId, environmentId, moduleId, moduleName, isParent }: Props) {
  const [configs, setConfigs] = useState<ConfigResponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetchingParent, setIsFetchingParent] = useState(false);
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedTargetModule, setSelectedTargetModule] = useState<string>("");
  const [transferAction, setTransferAction] = useState<"move" | "copy" | null>(null);
  const [modulesExpanded, setModulesExpanded] = useState(false);

  const { hasPermission, loading: permissionsLoading } = usePermissions(projectId, environmentId, moduleId);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await authFetch("http://localhost:8000/api/config-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  }, []);

  const fetchConfigs = useCallback(async () => {
    if (!projectId || !environmentId || !moduleId) {
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    
    try {
      const res = await authFetch(
        `http://localhost:8000/api/config?projectId=${projectId}&environmentId=${environmentId}&moduleId=${moduleId}`
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to fetch configs" }));
        throw new Error(error.message || "Failed to fetch configs");
      }

      const data = await res.json();
      
      const configData = data[0];
      
      if (configData && configData.entries) {
        const filteredEntries = configData.entries.filter((entry: Entry) => {
          const hasRead = hasPermission(PERMISSIONS.READ_CONFIG, environmentId, moduleId, entry._id);
          return hasRead;
        });
        
        setConfigs([{
          ...configData,
          entries: filteredEntries
        }]);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      console.error("Error fetching configs:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch configs");
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, environmentId, moduleId, hasPermission]);

  // Apply template to module
  const applyTemplate = async () => {
    if (!selectedTemplate) return;

    setApplyingTemplate(true);
    try {
      const res = await authFetch(`http://localhost:8000/api/config-templates/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          moduleId,
          environmentId,
          projectId
        }),
      });

      if (res.ok) {
        await fetchConfigs();
        setTemplateDialogOpen(false);
        setSelectedTemplate("");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to apply template");
      }
    } catch (err) {
      console.error("Error applying template:", err);
      alert("Failed to apply template");
    } finally {
      setApplyingTemplate(false);
    }
  };

  // Fetch from parent module
  const fetchFromParent = async () => {
    if (!confirm("Are you sure you want to fetch configurations from the parent module? This will overwrite mismatched values.")) return;

    setIsFetchingParent(true);
    try {
      const res = await authFetch(`http://localhost:8000/api/config/sync-parent/${moduleId}`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Successfully synced configurations from parent`);
        await fetchConfigs();
      } else {
        alert(data.message || "Failed to fetch from parent");
      }
    } catch (err) {
      console.error("Fetch from parent error:", err);
      alert("Failed to fetch configurations from parent module");
    } finally {
      setIsFetchingParent(false);
    }
  };

  // Fetch modules for transfer
  const fetchModules = useCallback(async () => {
    if (!projectId || !environmentId) return;

    try {
      const res = await authFetch(
        `http://localhost:8000/api/modules?projectId=${projectId}&environmentId=${environmentId}`
      );

      if (res.ok) {
        const data = await res.json();
        const otherModules = data.filter((m: Module) => m._id !== moduleId);
        setAvailableModules(otherModules);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  }, [projectId, environmentId, moduleId]);

  const handleCopy = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
  }, []);

  const handleEdit = useCallback((entry: Entry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const res = await authFetch(
        `http://localhost:8000/api/config/delEntry/${deleteId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete config");
        return;
      }

      await fetchConfigs();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete configuration");
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, fetchConfigs]);

  const handleExport = useCallback(async () => {
    try {
      const res = await authFetch(
        `http://localhost:8000/api/config/export-env?projectId=${projectId}&environmentId=${environmentId}&moduleId=${moduleId}`
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Export failed" }));
        alert(error.message);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${moduleName || "config"}.env`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export configurations");
    }
  }, [projectId, environmentId, moduleId, moduleName]);

  // Selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (!selectionMode) {
      setSelectedConfigs(new Set());
      fetchModules();
    }
  };

  const toggleConfigSelection = (configId: string) => {
    setSelectedConfigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(configId)) {
        newSet.delete(configId);
      } else {
        newSet.add(configId);
      }
      return newSet;
    });
  };

  const selectAllConfigs = () => {
    const entries = configs.length > 0 ? configs[0].entries : [];
    if (selectedConfigs.size === entries.length) {
      setSelectedConfigs(new Set());
    } else {
      setSelectedConfigs(new Set(entries.map(e => e._id)));
    }
  };

  const handleTransfer = async () => {
    if (!selectedTargetModule || selectedConfigs.size === 0 || !transferAction) return;

    try {
      const entries = configs.length > 0 ? configs[0].entries : [];
      const selectedEntries = entries.filter(e => selectedConfigs.has(e._id));

      const res = await authFetch(`http://localhost:8000/api/config/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceModuleId: moduleId,
          targetModuleId: selectedTargetModule,
          environmentId,
          projectId,
          entries: selectedEntries,
          action: transferAction
        }),
      });

      if (res.ok) {
        await fetchConfigs();
        setSelectionMode(false);
        setSelectedConfigs(new Set());
        setShowModuleSelector(false);
        setTransferAction(null);
        alert(`Successfully ${transferAction}ed ${selectedConfigs.size} configuration(s)`);
      } else {
        const error = await res.json();
        alert(error.message || `Failed to ${transferAction} configurations`);
      }
    } catch (err) {
      console.error("Transfer error:", err);
      alert("Failed to transfer configurations");
    }
  };

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authFetch(`http://localhost:8000/api/auth/me`);
        setIsAuthenticated(res.ok);
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch configs when moduleId changes
  useEffect(() => {
    if (moduleId && environmentId && projectId && isAuthenticated === true && !permissionsLoading) {
      fetchConfigs();
      fetchTemplates();
    }
  }, [projectId, environmentId, moduleId, isAuthenticated, permissionsLoading, fetchConfigs, fetchTemplates]);

  // Permission helpers
  const canCreate = hasPermission(PERMISSIONS.CREATE_CONFIG, environmentId, moduleId);
  const canUpdate = useCallback((configId: string) => 
    hasPermission(PERMISSIONS.UPDATE_CONFIG, environmentId, moduleId, configId),
    [hasPermission, environmentId, moduleId]
  );
  const canDelete = useCallback((configId: string) => 
    hasPermission(PERMISSIONS.DELETE_CONFIG, environmentId, moduleId, configId),
    [hasPermission, environmentId, moduleId]
  );

  const handleCreateSuccess = useCallback(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleImportSuccess = useCallback(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Loading states
  if (isAuthenticated === null || permissionsLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        Loading configurations...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-red-600">
        Please log in to continue
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <p className="text-red-600 mb-2">Error: {fetchError}</p>
        <button 
          onClick={fetchConfigs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const entries = configs.length > 0 ? configs[0].entries : [];
  const isStaleData = configs.length > 0 && configs[0].moduleId !== moduleId;

  if (isLoading || isStaleData) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-100 rounded-lg w-28 animate-pulse"></div>
            <div className="h-9 bg-gray-100 rounded-lg w-28 animate-pulse"></div>
            <div className="h-9 bg-gray-100 rounded-lg w-28 animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200"></div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50 items-center">
              <div className="h-4 bg-gray-100 rounded w-8 animate-pulse shrink-0"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-24 animate-pulse ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state
  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Configurations</h2>
            {moduleName && (
              <p className="text-sm text-gray-500 mt-1">
                Module: <span className="font-medium text-gray-700">{moduleName}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <>
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setDialogOpen(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Add Config
                </button>
                <button
                  onClick={() => setTemplateDialogOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <FileText size={16} />
                  Use Template
                </button>
                <button
                  onClick={() => setImportDialogOpen(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Upload size={16} />
                  Import
                </button>
              </>
            )}
            {canCreate && !isParent && (
              <button
                onClick={fetchFromParent}
                disabled={isFetchingParent}
                className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Download size={16} />
                {isFetchingParent ? "Fetching..." : "Fetch from Parent"}
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-12 text-center text-gray-500">
            No configuration entries for this module
          </div>
        </div>

        {/* Dialogs for empty state */}
        {canCreate && (
          <>
            <ConfigEntryDialog
              moduleId={moduleId!}
              projectId={projectId!}
              environmentId={environmentId!}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSuccess={handleCreateSuccess}
              editEntry={selectedEntry}
            />
            <ImportFileDialog
              projectId={projectId!}
              environmentId={environmentId!}
              moduleId={moduleId!}
              open={importDialogOpen}
              onOpenChange={setImportDialogOpen}
              onSuccess={handleImportSuccess}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Configurations</h2>
            {moduleName && (
              <p className="text-sm text-gray-500 mt-1">
                Module: <span className="font-medium text-gray-700">{moduleName}</span>
              </p>
            )}
          </div>
          {!selectionMode ? (
            <button
              onClick={toggleSelectionMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <CheckSquare size={16} />
              Select Multiple
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <button
                onClick={toggleSelectionMode}
                className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-white"
                title="Cancel selection"
              >
                <X size={16} />
              </button>
              <span className="text-sm font-medium text-blue-700">
                {selectedConfigs.size} selected
              </span>
              <button
                onClick={selectAllConfigs}
                className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-white rounded"
              >
                {selectedConfigs.size === entries.length ? "Deselect All" : "Select All"}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {canCreate && !selectionMode && (
            <>
              <button
                onClick={() => {
                  setSelectedEntry(null);
                  setDialogOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Add Config
              </button>
              <button
                onClick={() => setTemplateDialogOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FileText size={16} />
                Use Template
              </button>
              <button
                onClick={() => setImportDialogOpen(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Upload size={16} />
                Import
              </button>
            </>
          )}
          {canCreate && !isParent && !selectionMode && (
            <button
              onClick={fetchFromParent}
              disabled={isFetchingParent}
              className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download size={16} />
              {isFetchingParent ? "Fetching..." : "Fetch from Parent"}
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Selection Action Bar */}
      {selectionMode && selectedConfigs.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            {selectedConfigs.size} configuration(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTransferAction("move");
                setShowModuleSelector(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Move size={16} />
              Move to...
            </button>
            <button
              onClick={() => {
                setTransferAction("copy");
                setShowModuleSelector(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CopyIcon size={16} />
              Copy to...
            </button>
          </div>
        </div>
      )}

      {/* Template Selector Dialog */}
      {templateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Apply Configuration Template</h3>
              <button
                onClick={() => setTemplateDialogOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select a template to apply configurations to this module
            </p>

            {/* Template List */}
            <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto mb-4">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <label
                    key={template._id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template._id}
                      checked={selectedTemplate === template._id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{template.name}</span>
                      {template.description && (
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {template.configs.length} configuration(s)
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-4 text-center">No templates available</p>
              )}
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Preview</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {templates.find(t => t._id === selectedTemplate)?.configs.map((config, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-blue-600">{config.key}</span>
                      <span className="text-gray-400">=</span>
                      <span className="font-mono text-gray-600">••••••••</span>
                      {config.description && (
                        <span className="text-gray-400 italic text-[10px]">({config.description})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTemplateDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={applyTemplate}
                disabled={!selectedTemplate || applyingTemplate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applyingTemplate ? "Applying..." : "Apply Template"}
                {!applyingTemplate && <FileText size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Selector Dialog */}
      {showModuleSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {transferAction === "move" ? "Move" : "Copy"} Configurations
              </h3>
              <button
                onClick={() => {
                  setShowModuleSelector(false);
                  setTransferAction(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select target module to {transferAction} {selectedConfigs.size} configuration(s)
            </p>

            {/* Module List */}
            <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto mb-4">
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setModulesExpanded(!modulesExpanded)}
              >
                <span className="font-medium text-gray-700">Available Modules</span>
                {modulesExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
              </div>
              
              {modulesExpanded && (
                <div className="p-2 space-y-1">
                  {availableModules.length > 0 ? (
                    availableModules.map((module) => (
                      <label
                        key={module._id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="targetModule"
                          value={module._id}
                          checked={selectedTargetModule === module._id}
                          onChange={(e) => setSelectedTargetModule(e.target.value)}
                          className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{module.moduleName}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">No other modules available</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModuleSelector(false);
                  setTransferAction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!selectedTargetModule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferAction === "move" ? "Move" : "Copy"} Configurations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className={`grid ${selectionMode ? 'grid-cols-[30px_50px_180px_1fr_120px_100px_100px]' : 'grid-cols-[50px_180px_1fr_120px_100px_100px]'} gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider`}>
          {selectionMode && <div className="text-center ">Select</div>}
          <div className="text-gray-800 text-left">S.No</div>
          <div className="text-gray-800 text-left">Key</div>
          <div className="text-gray-800 text-left text-center">Value</div>
          <div className="text-gray-800 text-left">Created</div>
          <div className="text-gray-800 text-center">Status</div>
          <div className="text-gray-800 text-center">Actions</div>
        </div>

        {/* Table Rows */}
        {entries.map((entry, index) => {
          const isVisible = visibleMap[entry._id] || false;
          const canUpdateThis = canUpdate(entry._id);
          const canDeleteThis = canDelete(entry._id);
          const isSelected = selectedConfigs.has(entry._id);

          return (
            <div
              key={entry._id}
              className={`grid ${selectionMode ? 'grid-cols-[30px_50px_180px_1fr_120px_100px_100px]' : 'grid-cols-[50px_180px_1fr_120px_100px_100px]'} gap-3 px-6 py-3 border-b border-gray-100 text-sm items-center hover:bg-gray-50 transition-colors ${
                isSelected ? "bg-blue-50/50" : ""
              }`}
            >
              {selectionMode && (
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleConfigSelection(entry._id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="text-gray-800">{index + 1}</div>
              <div className="font-mono text-gray-800 truncate">{entry.key}</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-800 truncate">
                  {isVisible ? entry.value : "••••••••••••••••••••••••••••"}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setVisibleMap((prev) => ({
                        ...prev,
                        [entry._id]: !isVisible,
                      }))
                    }
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title={isVisible ? "Hide value" : "Show value"}
                  >
                    {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleCopy(entry.value)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Copy value"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="text-gray-800 text-xs">
                {new Date(entry.createdAt).toLocaleDateString()}
              </div>
              <div className="flex justify-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.keyStatus === "expired"
                      ? "bg-red-100 text-red-700"
                      : entry.keyStatus === "near_expiry"
                      ? "bg-yellow-100 text-yellow-700"
                      : entry.keyStatus === "new"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {entry.keyStatus || "active"}
                </span>
              </div>
              <div className="flex gap-1 justify-center">
                {!selectionMode && canUpdateThis && (
                  <div className="p-1.5 flex items-center justify-center" title="Edit">
                    <EditButton onClick={() => handleEdit(entry)} />
                  </div>
                )}
                {!selectionMode && canDeleteThis && (
                  <div className="p-1.5 flex items-center justify-center" title="Delete">
                    <Delbutton
                      onClick={() => {
                        setDeleteId(entry._id);
                        setConfirmOpen(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      {canCreate && (
        <>
          <ConfigEntryDialog
            moduleId={moduleId!}
            projectId={projectId!}
            environmentId={environmentId!}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={handleCreateSuccess}
            editEntry={selectedEntry}
          />
          <ImportFileDialog
            projectId={projectId!}
            environmentId={environmentId!}
            moduleId={moduleId!}
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onSuccess={handleImportSuccess}
          />
        </>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Delete Configuration"
        message="Are you sure you want to delete this configuration key?"
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        disabled={isDeleting}
      />
    </div>
  );
}