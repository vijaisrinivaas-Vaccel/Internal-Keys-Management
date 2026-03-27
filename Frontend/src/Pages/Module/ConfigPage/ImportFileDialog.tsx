import { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle, AlertTriangle, Eye, FileCode, Database, Download } from "lucide-react";
import { authFetch } from "../../../lib/auth";
import ImportOptionsDialog from "./ImportConfirmDialog";

interface ImportFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  environmentId: string;
  moduleId: string;
  onSuccess: () => void;
}

export default function ImportFileDialog({
  open,
  onOpenChange,
  projectId,
  environmentId,
  moduleId,
  onSuccess,
}: ImportFileDialogProps) {
  const [envContent, setEnvContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  // Helper to parse env content to entries
  const parseEnvToEntries = (content: string) => {
    const lines = content.split("\n");
    const entries = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");

      entries.push({
        key: key.trim(),
        value: value.trim(),
      });
    }

    return entries;
  };

  const countEntries = (content: string) => {
    return parseEnvToEntries(content).length;
  };

  // Get current file name from content (first line)
  const getCurrentFileName = () => {
    if (!envContent.trim()) return null;
    const firstLine = envContent.split("\n")[0]?.trim();
    if (firstLine?.startsWith("# File:")) {
      return firstLine.replace("# File:", "").trim();
    }
    return null;
  };

  /* ================= HANDLE FILE IMPORT ================= */
  const handleFileImport = () => {
    fileRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Add file name as comment at the top
      const contentWithFileName = `# File: ${file.name}\n${content}`;

      // If there's existing content, show confirmation dialog
      if (envContent.trim()) {
        setPendingFileContent(contentWithFileName);
        setShowConfirmDialog(true);
      } else {
        setEnvContent(contentWithFileName);
        setError("");
      }
    };
    reader.readAsText(file);

    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleConfirmReplace = () => {
    if (pendingFileContent) {
      setEnvContent(pendingFileContent);
      setPendingFileContent(null);
      setShowConfirmDialog(false);
      setError("");
    }
  };

  const handleConfirmAppend = () => {
    if (pendingFileContent) {
      setEnvContent(prev => prev + "\n\n" + pendingFileContent);
      setPendingFileContent(null);
      setShowConfirmDialog(false);
      setError("");
    }
  };

  const handleCancelImport = () => {
    setPendingFileContent(null);
    setShowConfirmDialog(false);
  };

  /* ================= PARSE AND VALIDATE ENV CONTENT ================= */
  const validateEnvContent = (content: string): boolean => {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "" || line.startsWith("#")) continue;

      if (!line.includes("=")) {
        setError(`Invalid format at line ${i + 1}: Missing '='`);
        return false;
      }

      const [key] = line.split("=");
      if (!key.trim()) {
        setError(`Invalid format at line ${i + 1}: Empty key`);
        return false;
      }
    }
    return true;
  };

  /* ================= HANDLE IMPORT ================= */
  const handleImport = async () => {
    if (!envContent.trim()) {
      setError("Please enter or import env content");
      return;
    }

    if (!validateEnvContent(envContent)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const lines = envContent.split("\n");
      const entries = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) continue;

        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");

        entries.push({
          key: key.trim(),
          value: value.trim(),
        });
      }

      const res = await authFetch("http://localhost:8000/api/config/import-env", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          environmentId,
          moduleId,
          entries,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Import failed");
        return;
      }

      setSuccess(`Successfully imported ${entries.length} configuration entries`);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setEnvContent("");
      }, 1500);
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to import configurations");
    } finally {
      setLoading(false);
    }
  };

  // Find duplicate keys
  const findDuplicateKeys = (content: string) => {
    const lines = content.split("\n");
    const keyCount: Record<string, number> = {};
    const duplicates: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) return;

      const [key] = trimmed.split("=");
      const cleanKey = key?.trim();
      if (!cleanKey) return;

      keyCount[cleanKey] = (keyCount[cleanKey] || 0) + 1;
    });

    Object.entries(keyCount).forEach(([key, count]) => {
      if (count > 1) duplicates.push(key);
    });

    return duplicates;
  };

  // Check if a specific key is duplicate at given line index
  const isKeyDuplicate = (content: string, key: string, currentLineIndex: number) => {
    const lines = content.split("\n");
    let count = 0;

    for (let i = 0; i <= currentLineIndex; i++) {
      const line = lines[i].trim();
      if (line === "" || line.startsWith("#")) continue;

      const [lineKey] = line.split("=");
      if (lineKey?.trim() === key) {
        count++;
      }
    }

    return count > 1;
  };

  // Find invalid lines
  const findInvalidLines = (content: string) => {
    const lines = content.split("\n");
    const invalidLines: number[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) return;

      if (!trimmed.includes("=")) {
        invalidLines.push(index + 1);
      }
    });

    return invalidLines;
  };

  const currentFileName = getCurrentFileName();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Upload size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Import Environment Variables</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Import .env file or paste content directly</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-5">
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <AlertCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Format Instructions</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    Enter your environment variables in <code className="bg-blue-100 px-1.5 py-0.5 rounded">KEY=value</code> format (one per line).
                    Lines starting with <code className="bg-blue-100 px-1.5 py-0.5 rounded">#</code> are ignored as comments.
                  </p>
                </div>
              </div>

              {/* File Input (hidden) */}
              <input
                type="file"
                accept=".env,.txt"
                ref={fileRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFileImport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  <FileText size={18} />
                  Import from .env file
                </button>
                {currentFileName && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <FileCode size={14} />
                    <span>Current: {currentFileName}</span>
                  </div>
                )}
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Environment Variables Content
                </label>
                <textarea
                  value={envContent}
                  onChange={(e) => {
                    setEnvContent(e.target.value);
                    setError("");
                  }}
                  placeholder={`# Example:
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=sk_test_123456789
SECRET_KEY=my-super-secret-key
PORT=3000`}
                  className="w-full h-80 border-2 border-gray-200 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Import Failed</p>
                    <p className="text-sm text-red-700 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Import Successful</p>
                    <p className="text-sm text-green-700 mt-0.5">{success}</p>
                  </div>
                </div>
              )}

              {/* Badge Preview */}
              {envContent.trim() && !error && !success && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database size={16} className="text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">Preview & Validation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Color Legend */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-500">Valid</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-500">Duplicate</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-gray-500">Invalid</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-gray-500">Comment</span>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          {countEntries(envContent)} entries
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Summary */}
                  {(() => {
                    const duplicateKeys = findDuplicateKeys(envContent);
                    const invalidLines = findInvalidLines(envContent);

                    if (duplicateKeys.length > 0 || invalidLines.length > 0) {
                      return (
                        <div className="px-4 py-3 border-b border-gray-200 space-y-2">
                          {duplicateKeys.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                              <AlertTriangle size={14} />
                              <span>Duplicate keys found: <span className="font-mono">{duplicateKeys.join(', ')}</span></span>
                            </div>
                          )}
                          {invalidLines.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded-lg">
                              <AlertCircle size={14} />
                              <span>{invalidLines.length} invalid line(s) detected</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Scrollable Preview Area */}
                  <div className="max-h-64 overflow-y-auto p-3 font-mono text-xs space-y-1">
                    {envContent.split("\n").map((line, idx) => {
                      const trimmed = line.trim();
                      if (trimmed === "") {
                        return (
                          <div key={idx} className="flex items-center gap-2 text-gray-400 italic">
                            <span>⎯</span>
                            <span>empty line</span>
                          </div>
                        );
                      }

                      const isComment = trimmed.startsWith("#");
                      const isValid = isComment || trimmed.includes("=");
                      const [key] = trimmed.split("=");
                      const cleanKey = key?.trim() || "";

                      // Check for duplicate keys (only if not a comment)
                      const isDuplicate = !isComment && cleanKey && isKeyDuplicate(envContent, cleanKey, idx);

                      let bgColor = "";
                      let icon = null;

                      if (isComment) {
                        icon = <span className="text-green-600">#</span>;
                      } else if (!isValid) {
                        bgColor = "bg-red-50";
                        icon = <span className="text-red-500">✗</span>;
                      } else if (isDuplicate) {
                        bgColor = "bg-orange-50";
                        icon = <span className="text-orange-500">⚠️</span>;
                      } else {
                        icon = <span className="text-green-500">✓</span>;
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-1.5 rounded ${bgColor}`}
                        >
                          <span className="shrink-0 mt-0.5">{icon}</span>
                          <div className="flex-1 truncate">
                            {isComment ? (
                              <span className="text-green-600">{line}</span>
                            ) : (
                              <>
                                <span className={isDuplicate ? "text-orange-600 font-medium" : "text-blue-600 font-medium"}>
                                  {cleanKey}
                                </span>
                                {line.includes("=") && (
                                  <>
                                    <span className="text-gray-400">=</span>
                                    <span className="text-gray-600">
                                      {line.substring(line.indexOf("=") + 1)}
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
            <button
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !envContent.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Import
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      <ImportOptionsDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onReplace={handleConfirmReplace}
        onAppend={handleConfirmAppend}
        onCancel={handleCancelImport}
      />
    </>
  );
}