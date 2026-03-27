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
import { 
  FolderPlus, 
  FileText, 
  Upload, 
  X, 
  ChevronRight,
  LayoutTemplate,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

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
  const [fileName, setFileName] = useState("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState<Template | null>(null);

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
            setSelectedTemplateDetails(globalTemplate);
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

  /* ---------------- UPDATE SELECTED TEMPLATE DETAILS ---------------- */
  useEffect(() => {
    const template = templates.find(t => t._id === selectedTemplate);
    setSelectedTemplateDetails(template || null);
  }, [selectedTemplate, templates]);

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
    setFileName("");
    setSelectedTemplate("");
  };

  /* ---------------- HANDLE FILE SELECTION ---------------- */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill all required fields");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[95vh] flex flex-col bg-white p-0 overflow-hidden">
        
        {/* Header with Gradient */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <FolderPlus size={24} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                {editData ? "Edit Project" : "Create New Project"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 mt-1">
                {editData 
                  ? "Update your project details and configuration" 
                  : "Fill in the details to create a new project with optional template"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            
            {/* Project Name Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {title && <CheckCircle size={18} className="text-green-500" />}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Give your project a descriptive name</p>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
              <p className="text-xs text-gray-400 mt-1">Describe what this project is about</p>
            </div>

            {/* Template Selection Section */}
            {!editData && (
              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutTemplate size={18} className="text-blue-600" />
                  <label className="text-sm font-semibold text-gray-700">
                    Project Template
                  </label>
                  <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                </div>

                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                  disabled={fetchingTemplates}
                >
                  <option value="">Use Default Template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} {template.isGlobal ? "🌐" : ""}
                      {template.environments?.length ? ` (${template.environments.length} envs)` : ""}
                    </option>
                  ))}
                </select>

                {/* Template Preview */}
                {selectedTemplateDetails && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <LayoutTemplate size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{selectedTemplateDetails.name}</h4>
                        {selectedTemplateDetails.description && (
                          <p className="text-sm text-gray-500 mt-1">{selectedTemplateDetails.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{selectedTemplateDetails.environments?.length || 0} environments</span>
                          <span>•</span>
                          <span>{selectedTemplateDetails.isGlobal ? "Global template" : "Custom template"}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                )}

                {fetchingTemplates && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    Loading templates...
                  </div>
                )}

                {templates.length === 0 && !fetchingTemplates && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                    <AlertCircle size={14} />
                    No templates found. Default structure will be used.
                  </div>
                )}
              </div>
            )}

            {/* File Upload Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Upload size={18} className="text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">
                  Upload Document
                </label>
                <span className="text-xs text-gray-500 ml-2">(Optional)</span>
              </div>

              {!fileName ? (
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-200 bg-white"
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, TXT, or other documents</p>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{fileName}</p>
                      <p className="text-xs text-gray-400">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Buttons */}
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white flex flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => onOpenChange(false)}
            className="px-6 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {editData ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <FolderPlus size={18} />
                {editData ? "Update Project" : "Create Project"}
              </>
            )}
          </button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}