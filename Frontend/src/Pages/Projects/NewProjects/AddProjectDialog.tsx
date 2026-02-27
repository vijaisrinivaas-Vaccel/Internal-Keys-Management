import { useState ,useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../Components/ui/Dialog";
import { authFetch } from "../../../lib/auth";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  editData?: any | null;
  onSuccess: () => void;
}

export default function AddProjectDialog({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: AddProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setDescription(editData.description);
      
    } else {
      setTitle("");
      setDescription("");
      setFile(null);
    }
  }, [editData, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill required fields ❌");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      if (file) {
        formData.append("file", file);
      }

      const url = editData
        ? `http://localhost:8000/api/projects/${editData._id}`
        : "http://localhost:8000/api/projects";

      const method = editData ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.message || "Failed to save project");
        return;
      }

      // Reset
      setTitle("");
      setDescription("");
      setFile(null);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Save project error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[75vw] h-[75vh] overflow-y-auto bg-white"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {editData ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        {/* Form Content */}
        <div className="space-y-6 mt-4">
          {/* Project Name */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium">Project Name</label>
            <input
              type="text"
              placeholder="Enter project name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium">Description</label>
            <textarea
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Upload */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium">Upload Document</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                }
              }}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-8">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}