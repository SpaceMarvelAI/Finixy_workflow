import React from "react";
import { Trash2, X } from "lucide-react";
import { useWorkflow } from "@store/WorkflowContext";

export const ConfigPanel: React.FC = () => {
  const { config, updateConfig, selectedNode, setSelectedNode } = useWorkflow();
  const node = config.nodes.find((n) => n.id === selectedNode);

  const updateNodeConfig = (updates: Record<string, any>) => {
    const updatedNodes = config.nodes.map((n) =>
      n.id === selectedNode
        ? { ...n, data: { ...n.data, config: { ...(n.data.config || {}), ...updates } } }
        : n,
    );
    updateConfig({ ...config, nodes: updatedNodes, lastModified: new Date().toISOString() });
  };

  const deleteNode = () => {
    const updatedNodes = config.nodes.filter((n) => n.id !== selectedNode);
    const updatedEdges = config.edges.filter(
      (e) => e.source !== selectedNode && e.target !== selectedNode,
    );
    updateConfig({ ...config, nodes: updatedNodes, edges: updatedEdges, lastModified: new Date().toISOString() });
    setSelectedNode(null);
  };

  const closePanel = () => setSelectedNode(null);

  if (!selectedNode || !node) return null;

  const currentNode = node;
  const nodeConfig = currentNode.data.config || {};

  /* shared classes */
  const inputCls =
    "w-full px-3 py-2 theme-input border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelCls = "text-sm font-medium text-theme-secondary mb-2 flex items-center gap-2";
  const sectionDivCls = "border-t border-theme-primary pt-4 mt-4";
  const sectionTitleCls = "font-medium text-theme-primary mb-3 flex items-center gap-2";

  return (
    <div className="h-full flex flex-col bg-theme-primary border-l border-theme-primary theme-transition">
      {/* Header */}
      <div className="p-4 border-b border-theme-primary bg-theme-secondary flex justify-between items-center theme-transition">
        <h3 className="font-semibold text-theme-primary tracking-wide">⚙️ Configure Node</h3>
        <div className="flex gap-2">
          <button
            onClick={deleteNode}
            className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30"
            title="Delete node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closePanel}
            className="text-theme-tertiary hover:text-theme-primary p-2 hover:bg-theme-tertiary rounded-lg transition-all border border-transparent hover:border-theme-primary"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-primary custom-scrollbar theme-transition">
        {/* Node Name */}
        <div>
          <label className={labelCls}>
            <div className="w-1 h-4 bg-blue-500 rounded-lg" />
            Node Name
          </label>
          <input
            type="text"
            value={nodeConfig.name || currentNode.data.label || ""}
            onChange={(e) => {
              const newName = e.target.value;
              updateNodeConfig({ name: newName });
              const updatedNodes = config.nodes.map((n) =>
                n.id === selectedNode
                  ? { ...n, data: { ...n.data, label: newName, config: { ...(n.data.config || {}), name: newName } } }
                  : n,
              );
              updateConfig({ ...config, nodes: updatedNodes, lastModified: new Date().toISOString() });
            }}
            className={inputCls}
            placeholder="Enter node name"
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>
            <div className="w-1 h-4 bg-purple-500 rounded-lg" />
            Description
          </label>
          <textarea
            value={nodeConfig.description || ""}
            onChange={(e) => updateNodeConfig({ description: e.target.value })}
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Describe what this node does"
          />
        </div>

        {/* Node Type */}
        <div>
          <label className={labelCls}>
            <div className="w-1 h-4 bg-cyan-500 rounded-lg" />
            Node Type
          </label>
          <div className="px-3 py-2 bg-theme-tertiary border border-theme-primary rounded-lg text-sm text-theme-secondary font-mono">
            {currentNode.data.nodeType || "Unknown"}
          </div>
        </div>

        {/* Trigger Node */}
        {currentNode.data.nodeType === "trigger" && (
          <>
            <div className={sectionDivCls}>
              <h4 className={sectionTitleCls}>
                <div className="w-1 h-4 bg-green-500 rounded-lg" /> Trigger Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Trigger Type</label>
              <select
                value={nodeConfig.triggerType || "manual"}
                onChange={(e) => updateNodeConfig({ triggerType: e.target.value })}
                className={inputCls}
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </>
        )}

        {/* Email Node */}
        {currentNode.data.nodeType === "email" && (
          <>
            <div className={sectionDivCls}>
              <h4 className={sectionTitleCls}>
                <div className="w-1 h-4 bg-blue-500 rounded-lg" /> Email Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">To</label>
              <input
                type="email"
                value={nodeConfig.emailTo || ""}
                onChange={(e) => updateNodeConfig({ emailTo: e.target.value })}
                className={inputCls}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Subject</label>
              <input
                type="text"
                value={nodeConfig.emailSubject || ""}
                onChange={(e) => updateNodeConfig({ emailSubject: e.target.value })}
                className={inputCls}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Body</label>
              <textarea
                value={nodeConfig.emailBody || ""}
                onChange={(e) => updateNodeConfig({ emailBody: e.target.value })}
                className={`${inputCls} resize-none`}
                rows={4}
                placeholder="Email body content"
              />
            </div>
          </>
        )}

        {/* Delay Node */}
        {currentNode.data.nodeType === "delay" && (
          <>
            <div className={sectionDivCls}>
              <h4 className={sectionTitleCls}>
                <div className="w-1 h-4 bg-yellow-500 rounded-lg" /> Delay Settings
              </h4>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-theme-secondary mb-2">Wait</label>
                <input
                  type="number"
                  value={nodeConfig.delayAmount || 1}
                  onChange={(e) => updateNodeConfig({ delayAmount: parseInt(e.target.value) })}
                  className={inputCls}
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-theme-secondary mb-2">Unit</label>
                <select
                  value={nodeConfig.delayUnit || "days"}
                  onChange={(e) => updateNodeConfig({ delayUnit: e.target.value })}
                  className={inputCls}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Export Node */}
        {currentNode.data.nodeType === "export" && (
          <>
            <div className={sectionDivCls}>
              <h4 className={sectionTitleCls}>
                <div className="w-1 h-4 bg-indigo-500 rounded-lg" /> Export Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Export Format</label>
              <select
                value={nodeConfig.exportFormat || "CSV"}
                onChange={(e) => updateNodeConfig({ exportFormat: e.target.value })}
                className={inputCls}
              >
                <option value="CSV">CSV</option>
                <option value="Excel">Excel</option>
                <option value="JSON">JSON</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </>
        )}

        {/* Condition Node */}
        {currentNode.data.nodeType === "condition" && (
          <>
            <div className={sectionDivCls}>
              <h4 className={sectionTitleCls}>
                <div className="w-1 h-4 bg-orange-500 rounded-lg" /> Condition Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Condition Expression
              </label>
              <input
                type="text"
                value={nodeConfig.condition || ""}
                onChange={(e) => updateNodeConfig({ condition: e.target.value })}
                className={`${inputCls} font-mono text-sm`}
                placeholder="e.g., amount > 1000"
              />
            </div>
          </>
        )}

        {/* Code Node */}
        {currentNode.data.nodeType === "code" && (
          <>
            <div className={sectionDivCls}>
              <h4 className={sectionTitleCls}>
                <div className="w-1 h-4 bg-pink-500 rounded-lg" /> Code Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Code</label>
              <textarea
                value={nodeConfig.code || ""}
                onChange={(e) => updateNodeConfig({ code: e.target.value })}
                className={`${inputCls} font-mono text-sm resize-none`}
                rows={8}
                placeholder="// Write your code here"
              />
            </div>
          </>
        )}

        {/* Backend Agent Info */}
        {!["trigger", "email", "delay", "export", "condition", "code"].includes(
          currentNode.data.nodeType || "",
        ) && (
          <div className={sectionDivCls}>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-500 flex items-center gap-2">
                <span className="text-lg">📋</span>
                <strong>Backend Agent Node</strong>
              </p>
              <p className="text-sm text-theme-secondary mt-2">
                This <strong className="text-purple-500">{currentNode.data.nodeType}</strong> node is
                configured through backend agent logic. You can customize its name and description
                above for documentation purposes.
              </p>
              <p className="text-xs text-theme-tertiary mt-2 flex items-center gap-1">
                <span>⚡</span> The node's execution logic is handled by the corresponding agent in
                your backend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};