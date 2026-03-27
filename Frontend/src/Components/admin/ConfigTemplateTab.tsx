import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  Key,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { authFetch } from "../../lib/auth";

interface ConfigTemplate {
  _id: string;
  name: string;
  description?: string;
  configs: ConfigEntry[];
  createdByName: string;
  createdAt: string;
  version: number;
}

interface ConfigEntry {
  _id?: string;
  key: string;
  value: string;
  description?: string;
  isVisible?: boolean;
}

interface ConfigTemplateFormState {
  name: string;
  description: string;
  configs: ConfigEntry[];
}

const buildConfigStructureSummary = (configs: ConfigEntry[]) =>
  `${configs.length} keys: ${configs.map((config) => config.key).join(", ")}`;

const buildConfigTemplateChangeSummary = (
  before: ConfigTemplate | null,
  after: ConfigTemplateFormState
) => {
  if (!before) {
    return `Created template with ${buildConfigStructureSummary(after.configs)}.`;
  }

  const parts: string[] = [];

  if (before.name !== after.name) {
    parts.push(`Name: "${before.name}" -> "${after.name}"`);
  }
  if ((before.description || "") !== (after.description || "")) {
    parts.push("Description updated");
  }

  const beforeMap = new Map(before.configs.map((config) => [config.key, config]));
  const afterMap = new Map(after.configs.map((config) => [config.key, config]));

  const addedKeys = [...afterMap.keys()].filter((key) => !beforeMap.has(key));
  const removedKeys = [...beforeMap.keys()].filter((key) => !afterMap.has(key));
  const changedKeys = [...afterMap.keys()].filter((key) => {
    const oldConfig = beforeMap.get(key);
    const newConfig = afterMap.get(key);
    if (!oldConfig || !newConfig) return false;

    return (
      oldConfig.value !== newConfig.value ||
      (oldConfig.description || "") !== (newConfig.description || "")
    );
  });

  if (addedKeys.length > 0) parts.push(`Added keys: ${addedKeys.join(", ")}`);
  if (removedKeys.length > 0) parts.push(`Removed keys: ${removedKeys.join(", ")}`);
  if (changedKeys.length > 0) parts.push(`Updated keys: ${changedKeys.join(", ")}`);

  if (parts.length === 0) {
    parts.push("No config key changes.");
  }

  return parts.join(". ");
};

export default function ConfigTemplateTab() {
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConfigTemplate | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    configs: [] as ConfigEntry[]
  });

  // Generate a random value
  const generateRandomValue = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await authFetch("http://localhost:8000/api/config-templates");
      if (res.ok) {
        const data = await res.json();
        // Add visible flag to each config entry
        const processedData = data.map((template: ConfigTemplate) => ({
          ...template,
          configs: template.configs.map(config => ({ ...config, isVisible: false }))
        }));
        setTemplates(processedData);
      }
    } catch (err) {
      console.error("Error fetching config templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Add new config entry
  const addConfigEntry = () => {
    setFormData({
      ...formData,
      configs: [
        ...formData.configs,
        {
          key: `CONFIG_${formData.configs.length + 1}`,
          value: generateRandomValue(),
          description: "",
          isVisible: false
        }
      ]
    });
  };

  // Update config entry
  const updateConfigEntry = (index: number, field: string, value: string) => {
    const newConfigs = [...formData.configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setFormData({ ...formData, configs: newConfigs });
  };

  // Remove config entry
  const removeConfigEntry = (index: number) => {
    const newConfigs = formData.configs.filter((_, i) => i !== index);
    setFormData({ ...formData, configs: newConfigs });
  };

  // Regenerate value for a config entry
  const regenerateValue = (index: number) => {
    const newConfigs = [...formData.configs];
    newConfigs[index].value = generateRandomValue();
    setFormData({ ...formData, configs: newConfigs });
  };

  // Toggle visibility of config value
  const toggleVisibility = (index: number) => {
    const newConfigs = [...formData.configs];
    newConfigs[index].isVisible = !newConfigs[index].isVisible;
    setFormData({ ...formData, configs: newConfigs });
  };

  // Save template
  const saveTemplate = async () => {
    if (!formData.name) {
      alert("Template name is required");
      return;
    }

    if (formData.configs.length === 0) {
      alert("At least one config entry is required");
      return;
    }

    const changeSummary = buildConfigTemplateChangeSummary(editingTemplate, formData);
    const reasonInput = window.prompt(
      `Please provide a reason to ${editingTemplate ? "update" : "create"} this config template.\n\nChanges:\n${changeSummary}`
    );
    if (reasonInput === null) return;

    const reason = reasonInput.trim();
    if (!reason) {
      alert("Reason is required.");
      return;
    }

    try {
      const url = editingTemplate
        ? `http://localhost:8000/api/config-templates/${editingTemplate._id}`
        : "http://localhost:8000/api/config-templates";
      
      const method = editingTemplate ? "PUT" : "POST";

      // Remove isVisible flag before sending to backend
      const configsToSend = formData.configs.map(({ isVisible, ...rest }) => rest);

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          configs: configsToSend,
          reason,
          changeSummary
        })
      });

      if (res.ok) {
        setShowModal(false);
        setEditingTemplate(null);
        setFormData({ name: "", description: "", configs: [] });
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

  // Delete template
  const deleteTemplate = async (id: string) => {
    const templateToDelete = templates.find((template) => template._id === id);
    if (!templateToDelete) {
      alert("Template not found");
      return;
    }

    const changeSummary = `Deleting template "${templateToDelete.name}" with ${buildConfigStructureSummary(templateToDelete.configs)}.`;
    const reasonInput = window.prompt(
      `Please provide a reason to delete this config template.\n\nChanges:\n${changeSummary}`
    );
    if (reasonInput === null) return;

    const reason = reasonInput.trim();
    if (!reason) {
      alert("Reason is required.");
      return;
    }

    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await authFetch(`http://localhost:8000/api/config-templates/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, changeSummary })
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

  // Duplicate template
  const duplicateTemplate = async (template: ConfigTemplate) => {
    const newTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      configs: template.configs.map(config => ({
        key: config.key,
        value: generateRandomValue(), // Generate new random values
        description: config.description
      }))
    };

    const changeSummary = `Duplicated from "${template.name}" with ${buildConfigStructureSummary(template.configs)}.`;
    const reasonInput = window.prompt(
      `Please provide a reason to create this duplicated config template.\n\nChanges:\n${changeSummary}`
    );
    if (reasonInput === null) return;

    const reason = reasonInput.trim();
    if (!reason) {
      alert("Reason is required.");
      return;
    }

    try {
      const res = await authFetch("http://localhost:8000/api/config-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTemplate, reason, changeSummary })
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error("Error duplicating template:", err);
    }
  };

  // Toggle config visibility in preview
  const togglePreviewVisibility = (templateId: string, configIndex: number) => {
    setTemplates(prev => prev.map(template => {
      if (template._id === templateId) {
        const newConfigs = [...template.configs];
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          isVisible: !newConfigs[configIndex].isVisible
        };
        return { ...template, configs: newConfigs };
      }
      return template;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Configuration Templates</h2>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({ name: "", description: "", configs: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
          <p className="text-gray-500">No configuration templates created yet</p>
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
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      v{template.version}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {template.configs.length} configs
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
                        configs: template.configs.map(config => ({ ...config, isVisible: false }))
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
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Configuration Entries</h4>
                  <div className="space-y-2">
                    {template.configs.map((config, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <Key size={14} className="text-gray-500" />
                        <span className="text-sm font-mono font-medium text-blue-600 w-40">
                          {config.key}
                        </span>
                        <span className="text-sm font-mono text-gray-600 flex-1">
                          {config.isVisible ? config.value : '•'.repeat(20)}
                        </span>
                        {config.description && (
                          <span className="text-xs text-gray-500 italic">{config.description}</span>
                        )}
                        <button
                          onClick={() => togglePreviewVisibility(template._id, idx)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={config.isVisible ? "Hide value" : "Show value"}
                        >
                          {config.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
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

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Database Config Template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Template description..."
                />
              </div>

              {/* Config Entries Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Configuration Entries</h3>
                  <button
                    onClick={addConfigEntry}
                    className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Config
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.configs.map((config, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Key</label>
                          <input
                            type="text"
                            value={config.key}
                            onChange={(e) => updateConfigEntry(index, "key", e.target.value)}
                            className="w-full border rounded-lg px-2 py-1 text-sm font-mono"
                            placeholder="e.g., DATABASE_URL"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Value</label>
                          <div className="flex gap-2">
                            <input
                              type={config.isVisible ? "text" : "password"}
                              value={config.value}
                              onChange={(e) => updateConfigEntry(index, "value", e.target.value)}
                              className="flex-1 border rounded-lg px-2 py-1 text-sm font-mono"
                              placeholder="Auto-generated"
                            />
                            <button
                              onClick={() => toggleVisibility(index)}
                              className="p-1 border rounded-lg hover:bg-gray-200"
                              title={config.isVisible ? "Hide" : "Show"}
                            >
                              {config.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => regenerateValue(index)}
                              className="p-1 border rounded-lg hover:bg-gray-200"
                              title="Regenerate"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="w-32">
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={config.description || ""}
                            onChange={(e) => updateConfigEntry(index, "description", e.target.value)}
                            className="w-full border rounded-lg px-2 py-1 text-xs"
                            placeholder="Optional"
                          />
                        </div>
                        <button
                          onClick={() => removeConfigEntry(index)}
                          className="mt-5 p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.configs.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No configuration entries added. Click "Add Config" to start.
                    </p>
                  )}
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
