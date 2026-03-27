import { useState, useEffect } from "react";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../Components/ui/Dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { authFetch } from "../../lib/auth";
import { Plus, X, Loader2, FolderTree } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId: string;
  environmentId: string;
}

export default function AddModuleDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  environmentId,
}: Props) {
  const [moduleName, setModuleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setModuleName("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!moduleName.trim()) {
      setError("Module name is required");
      return;
    }

    if (moduleName.trim().length < 3) {
      setError("Module name must be at least 3 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authFetch("http://localhost:8000/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleName: moduleName.trim(),
          projectId,
          environmentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to create module");
        return;
      }

      setModuleName("");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError("Network error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleCreate();
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <FolderTree size={20} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Create Module
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm mt-0.5">
                Add a new module to this environment
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Module Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter module name"
                value={moduleName}
                onChange={(e) => {
                  setModuleName(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Must be at least 3 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-center gap-2">
                <X size={16} className="text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-5 py-2 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={loading || !moduleName.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Module
              </>
            )}
          </button>
        </div>

        <VisuallyHidden>
          <DialogTitle>Create Module</DialogTitle>
          <DialogDescription>
            Create a new module inside this environment
          </DialogDescription>
        </VisuallyHidden>
      </DialogContent>
    </DialogRoot>
  );
}