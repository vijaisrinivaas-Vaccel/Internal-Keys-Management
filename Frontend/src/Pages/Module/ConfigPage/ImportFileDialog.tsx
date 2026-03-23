import { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Upload size={20} className="text-blue-600" />
              Import Environment Variables
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700">
                Enter your environment variables in KEY=value format (one per line).
                Lines starting with # are ignored as comments.
              </p>
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
            <div className="flex gap-2">
              <button
                onClick={handleFileImport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <FileText size={16} />
                Import from .env file
              </button>
              {currentFileName && (
                <span className="text-sm text-gray-500 flex items-center">
                  Current file: {currentFileName}
                </span>
              )}
            </div>

            {/* Textarea */}
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
              className="w-full h-96 border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Badge Preview */}
            {envContent.trim() && !error && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">Preview & Validation:</p>
                  {/* Color Legend */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-600">Valid</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500">⚠️</span>
                      <span className="text-gray-600">Duplicate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-red-500">✗</span>
                      <span className="text-gray-600">Invalid</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">#</span>
                      <span className="text-gray-600">Comment</span>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {countEntries(envContent)} entries
                  </span>
                </div>

                {/* Validation Summary */}
                {(() => {
                  const duplicateKeys = findDuplicateKeys(envContent);
                  const invalidLines = findInvalidLines(envContent);

                  if (duplicateKeys.length > 0 || invalidLines.length > 0) {
                    return (
                      <div className="mb-3 space-y-1">
                        {duplicateKeys.length > 0 && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                            ⚠️ Duplicate keys found: {duplicateKeys.join(', ')}
                          </div>
                        )}
                        {invalidLines.length > 0 && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                            ⚠️ {invalidLines.length} invalid line(s) detected
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Scrollable Preview Area */}
                <div className="max-h-60 overflow-y-auto font-mono text-xs space-y-1 border rounded-lg p-2 bg-white">
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

                    // Determine line color
                    let lineColor = "text-gray-700";
                    let bgColor = "";
                    let icon = null;

                    if (isComment) {
                      lineColor = "text-green-600";
                      icon = <span className="text-green-500">#</span>;
                    } else if (!isValid) {
                      lineColor = "text-red-600";
                      bgColor = "bg-red-50";
                      icon = <span className="text-red-500">✗</span>;
                    } else if (isDuplicate) {
                      lineColor = "text-orange-600";
                      bgColor = "bg-orange-50";
                      icon = <span className="text-orange-500">⚠️</span>;
                    } else {
                      icon = <span className="text-green-500">✓</span>;
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-1 rounded ${bgColor}`}
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

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !envContent.trim()}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} />
              {loading ? "Importing..." : "Import"}
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