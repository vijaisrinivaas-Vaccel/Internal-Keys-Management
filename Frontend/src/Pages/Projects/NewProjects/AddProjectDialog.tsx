import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../Components/ui/Dialog";
import { authFetch } from "../../../lib/auth";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  editData?: any | null;
  onSuccess: () => void;
}

interface Template {
  _id: string;
  name: string;
  description?: string;
  isGlobal: boolean;
  environments: any[];
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

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingTemplates, setFetchingTemplates] = useState(false);

  /* ---------------- FETCH TEMPLATES ---------------- */

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!open) return;

      setFetchingTemplates(true);

      try {
        const res = await authFetch("http://localhost:8000/api/templates");

        if (res.ok) {
          const data = await res.json();
          setTemplates(data);

          // Auto select global template
          const globalTemplate = data.find((t: Template) => t.isGlobal);
          if (globalTemplate) {
            setSelectedTemplate(globalTemplate._id);
          }
        }
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setFetchingTemplates(false);
      }
    };

    fetchTemplates();
  }, [open]);

  /* ---------------- EDIT MODE ---------------- */

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDescription(editData.description || "");
      setSelectedTemplate(editData.templateId || "");
    } else {
      resetForm();
    }
  }, [editData, open]);

  /* ---------------- RESET FORM ---------------- */

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setSelectedTemplate("");
  };

  /* ---------------- SUBMIT ---------------- */

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

      if (selectedTemplate) {
        formData.append("templateId", selectedTemplate);
      }

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

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Save project error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] h-[75vh] overflow-y-auto bg-white">

        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {editData ? "Edit Project" : "Create New Project"}
          </DialogTitle>

          <DialogDescription>
            Create a new project and optionally choose a template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">

          {/* PROJECT NAME */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium">Project Name *</label>
            <input
              type="text"
              placeholder="Enter project name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium">Description *</label>
            <textarea
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* TEMPLATE SELECT */}
          {!editData && (
            <div className="flex flex-col space-y-2">
              <label className="font-medium">Project Template</label>

              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                disabled={fetchingTemplates}
              >
                <option value="">Use Default Template</option>

                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                    {template.isGlobal ? " 🌐 (Global)" : ""}
                    {template.environments?.length
                      ? ` (${template.environments.length} envs)`
                      : ""}
                  </option>
                ))}
              </select>

              {fetchingTemplates && (
                <p className="text-xs text-gray-500">Loading templates...</p>
              )}

              {templates.length === 0 && !fetchingTemplates && (
                <p className="text-xs text-amber-600">
                  No templates found. Default structure will be used.
                </p>
              )}
            </div>
          )}

          {/* FILE UPLOAD */}
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

        {/* FOOTER */}
        <DialogFooter className="mt-8">

          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? editData
                ? "Updating..."
                : "Creating..."
              : editData
              ? "Update Project"
              : "Create Project"}
          </button>

        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}