import { useState, useEffect } from "react";
import { authFetch } from "../../lib/auth";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Globe, 
  Save,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ModuleConfig {
  name: string;
  description?: string;
  order: number;
}

interface EnvironmentConfig {
  name: string;
  order: number;
  modules: ModuleConfig[];
}

interface Template {
  _id: string;
  name: string;
  description?: string;
  environments: EnvironmentConfig[];
  isGlobal: boolean;
  version: number;
  createdByName: string;
  createdAt: string;
}

export default function TemplateManagementTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isGlobal: false,
    environments: [] as EnvironmentConfig[]
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await authFetch("http://localhost:8000/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Template CRUD operations
  const addEnvironment = () => {
    setFormData({
      ...formData,
      environments: [
        ...formData.environments,
        {
          name: `Environment ${formData.environments.length + 1}`,
          order: formData.environments.length,
          modules: []
        }
      ]
    });
  };

  const addModule = (envIndex: number) => {
    const newEnvironments = [...formData.environments];
    newEnvironments[envIndex].modules.push({
      name: `Module ${newEnvironments[envIndex].modules.length + 1}`,
      order: newEnvironments[envIndex].modules.length
    });
    setFormData({ ...formData, environments: newEnvironments });
  };

  const updateEnvironment = (envIndex: number, field: string, value: any) => {
    const newEnvironments = [...formData.environments];
    newEnvironments[envIndex] = { ...newEnvironments[envIndex], [field]: value };
    setFormData({ ...formData, environments: newEnvironments });
  };

  const updateModule = (envIndex: number, modIndex: number, field: string, value: any) => {
    const newEnvironments = [...formData.environments];
    newEnvironments[envIndex].modules[modIndex] = {
      ...newEnvironments[envIndex].modules[modIndex],
      [field]: value
    };
    setFormData({ ...formData, environments: newEnvironments });
  };

  const removeEnvironment = (envIndex: number) => {
    const newEnvironments = formData.environments.filter((_, i) => i !== envIndex);
    newEnvironments.forEach((env, i) => { env.order = i; });
    setFormData({ ...formData, environments: newEnvironments });
  };

  const removeModule = (envIndex: number, modIndex: number) => {
    const newEnvironments = [...formData.environments];
    newEnvironments[envIndex].modules = newEnvironments[envIndex].modules.filter((_, i) => i !== modIndex);
    newEnvironments[envIndex].modules.forEach((mod, i) => { mod.order = i; });
    setFormData({ ...formData, environments: newEnvironments });
  };

  const saveTemplate = async () => {
    if (!formData.name) {
      alert("Template name is required");
      return;
    }

    if (formData.environments.length === 0) {
      alert("At least one environment is required");
      return;
    }

    try {
      const url = editingTemplate
        ? `http://localhost:8000/api/templates/${editingTemplate._id}`
        : "http://localhost:8000/api/templates";
      
      const method = editingTemplate ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingTemplate(null);
        setFormData({ name: "", description: "", isGlobal: false, environments: [] });
        fetchTemplates();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to save template");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template");
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await authFetch(`http://localhost:8000/api/templates/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        fetchTemplates();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete template");
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template");
    }
  };

  const duplicateTemplate = async (template: Template) => {
    const newTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      isGlobal: false
    };
    delete (newTemplate as any)._id;

    try {
      const res = await authFetch("http://localhost:8000/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate)
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error("Error duplicating template:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Project Templates</h2>
        <button
          onClick={() => {
              setEditingTemplate(null);
                    
              const defaultTemplate = templates.find(t => t.isGlobal);
                    
              setFormData({
                name: "",
                description: "",
                isGlobal: false,
                environments: defaultTemplate
                  ? JSON.parse(JSON.stringify(defaultTemplate.environments))
                  : []
              });
          
              setShowModal(true);
            }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No templates created yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template._id} className="border rounded-lg bg-white overflow-hidden">
              {/* Template Header */}
              <div className="p-4 flex justify-between items-start bg-gray-50 border-b">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    {template.isGlobal && (
                      <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        <Globe size={12} />
                        Global
                      </span>
                    )}
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      v{template.version}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created by {template.createdByName} • {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                    title="Duplicate"
                  >
                    <Copy size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setFormData({
                        name: template.name,
                        description: template.description || "",
                        isGlobal: template.isGlobal,
                        environments: template.environments
                      });
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template._id)}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                  <button
                    onClick={() => setExpandedTemplate(
                      expandedTemplate === template._id ? null : template._id
                    )}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                  >
                    {expandedTemplate === template._id ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedTemplate === template._id && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {template.environments.map((env) => (
                      <div key={env.name} className="border rounded-lg p-3 bg-gray-50">
                        <h4 className="font-medium text-sm mb-2">{env.name}</h4>
                        <div className="space-y-1">
                          {env.modules.map((mod) => (
                            <div key={mod.name} className="text-xs text-gray-600 flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {mod.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form fields - same as before */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Standard Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Template description..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                  id="isGlobal"
                />
                <label htmlFor="isGlobal" className="text-sm">
                  Make this the global default template
                </label>
              </div>

              {/* Environments Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Environments</h3>
                  <button
                    onClick={addEnvironment}
                    className="text-sm bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                  >
                    + Add Environment
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.environments.map((env, envIndex) => (
                    <div key={envIndex} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <input
                          type="text"
                          value={env.name}
                          onChange={(e) => updateEnvironment(envIndex, "name", e.target.value)}
                          className="flex-1 border rounded-lg px-3 py-1 text-sm"
                          placeholder="Environment name"
                        />
                        <button
                          onClick={() => removeEnvironment(envIndex)}
                          className="ml-2 p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>

                      <div className="ml-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-500">MODULES</span>
                          <button
                            onClick={() => addModule(envIndex)}
                            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                          >
                            + Add Module
                          </button>
                        </div>

                        <div className="space-y-2">
                          {env.modules.map((mod, modIndex) => (
                            <div key={modIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={mod.name}
                                onChange={(e) => updateModule(envIndex, modIndex, "name", e.target.value)}
                                className="flex-1 border rounded-lg px-2 py-1 text-sm"
                                placeholder="Module name"
                              />
                              <input
                                type="text"
                                value={mod.description || ""}
                                onChange={(e) => updateModule(envIndex, modIndex, "description", e.target.value)}
                                className="flex-1 border rounded-lg px-2 py-1 text-sm"
                                placeholder="Description"
                              />
                              <button
                                onClick={() => removeModule(envIndex, modIndex)}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <Trash2 size={12} className="text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save size={16} />
                {editingTemplate ? "Update" : "Create"} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}