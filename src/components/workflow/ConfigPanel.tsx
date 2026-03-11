import React from "react";
import { Trash2, X } from "lucide-react";
import { useWorkflow } from "@store/WorkflowContext";

export const ConfigPanel: React.FC = () => {
  const { config, updateConfig, selectedNode, setSelectedNode } = useWorkflow();
  const node = config.nodes.find((n) => n.id === selectedNode);

  const updateNodeConfig = (updates: Record<string, any>) => {
    const updatedNodes = config.nodes.map((n) =>
      n.id === selectedNode
        ? {
            ...n,
            data: { 
              ...n.data, 
              config: { 
                ...(n.data.config || {}), 
                ...updates 
              } 
            },
          }
        : n,
    );
    updateConfig({
      ...config,
      nodes: updatedNodes,
      lastModified: new Date().toISOString(),
    });
  };

  const deleteNode = () => {
    const updatedNodes = config.nodes.filter((n) => n.id !== selectedNode);
    const updatedEdges = config.edges.filter(
      (e) => e.source !== selectedNode && e.target !== selectedNode,
    );
    updateConfig({
      ...config,
      nodes: updatedNodes,
      edges: updatedEdges,
      lastModified: new Date().toISOString(),
    });
    setSelectedNode(null);
  };

  const closePanel = () => {
    setSelectedNode(null);
  };

  if (!selectedNode || !node) {
    return null;
  }

  const currentNode = node;
  const nodeConfig = currentNode.data.config || {};

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black flex justify-between items-center backdrop-blur-sm">
        <h3 className="font-semibold text-gray-100 tracking-wide">⚙️ Configure Node</h3>
        <div className="flex gap-2">
          <button
            onClick={deleteNode}
            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30"
            title="Delete node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closePanel}
            className="text-gray-400 hover:text-gray-200 p-2 hover:bg-gray-800 rounded-lg transition-all border border-transparent hover:border-gray-700"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {/* Common Fields - Available for ALL nodes */}
        <div>
          <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
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
                  ? {
                      ...n,
                      data: { 
                        ...n.data,
                        label: newName,
                        config: { 
                          ...(n.data.config || {}), 
                          name: newName
                        } 
                      },
                    }
                  : n,
              );
              updateConfig({
                ...config,
                nodes: updatedNodes,
                lastModified: new Date().toISOString(),
              });
            }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-100 placeholder-gray-500 transition-all"
            placeholder="Enter node name"
          />
        </div>

        <div>
          <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
            Description
          </label>
          <textarea
            value={nodeConfig.description || ""}
            onChange={(e) => updateNodeConfig({ description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-100 placeholder-gray-500 transition-all resize-none"
            rows={3}
            placeholder="Describe what this node does"
          />
        </div>

        <div>
          <label className=" text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
            Node Type
          </label>
          <div className="px-3 py-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 font-mono">
            {currentNode.data.nodeType || 'Unknown'}
          </div>
        </div>

        {/* Trigger Node */}
        {currentNode.data.nodeType === "trigger" && (
          <>
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                Trigger Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Trigger Type</label>
              <select
                value={nodeConfig.triggerType || "manual"}
                onChange={(e) => updateNodeConfig({ triggerType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-100 transition-all"
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
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                Email Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">To</label>
              <input
                type="email"
                value={nodeConfig.emailTo || ""}
                onChange={(e) => updateNodeConfig({ emailTo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-100 placeholder-gray-500 transition-all"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
              <input
                type="text"
                value={nodeConfig.emailSubject || ""}
                onChange={(e) => updateNodeConfig({ emailSubject: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-100 placeholder-gray-500 transition-all"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Body</label>
              <textarea
                value={nodeConfig.emailBody || ""}
                onChange={(e) => updateNodeConfig({ emailBody: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-100 placeholder-gray-500 transition-all resize-none"
                rows={4}
                placeholder="Email body content"
              />
            </div>
          </>
        )}

        {/* Delay Node */}
        {currentNode.data.nodeType === "delay" && (
          <>
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
                Delay Settings
              </h4>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">Wait</label>
                <input
                  type="number"
                  value={nodeConfig.delayAmount || 1}
                  onChange={(e) => updateNodeConfig({ delayAmount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-gray-100 transition-all"
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">Unit</label>
                <select
                  value={nodeConfig.delayUnit || "days"}
                  onChange={(e) => updateNodeConfig({ delayUnit: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-gray-100 transition-all"
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
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                Export Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Export Format</label>
              <select
                value={nodeConfig.exportFormat || "CSV"}
                onChange={(e) => updateNodeConfig({ exportFormat: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-100 transition-all"
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
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                Condition Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Condition Expression</label>
              <input
                type="text"
                value={nodeConfig.condition || ""}
                onChange={(e) => updateNodeConfig({ condition: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-100 placeholder-gray-500 transition-all font-mono text-sm"
                placeholder="e.g., amount > 1000"
              />
            </div>
          </>
        )}

        {/* Code Node */}
        {currentNode.data.nodeType === "code" && (
          <>
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-pink-500 rounded-full"></div>
                Code Settings
              </h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Code</label>
              <textarea
                value={nodeConfig.code || ""}
                onChange={(e) => updateNodeConfig({ code: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-gray-100 placeholder-gray-500 transition-all font-mono text-sm resize-none"
                rows={8}
                placeholder="// Write your code here"
              />
            </div>
          </>
        )}

        {/* Info Message for Backend Agent Nodes */}
        {!['trigger', 'email', 'delay', 'export', 'condition', 'code'].includes(currentNode.data.nodeType || '') && (
          <div className="border-t border-gray-800 pt-4 mt-4">
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-blue-300 flex items-center gap-2">
                <span className="text-lg">📋</span>
                <strong>Backend Agent Node</strong>
              </p>
              <p className="text-sm text-gray-300 mt-2">
                This <strong className="text-purple-300">{currentNode.data.nodeType}</strong> node is configured through backend agent logic. 
                You can customize its name and description above for documentation purposes.
              </p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <span>⚡</span>
                The node's execution logic is handled by the corresponding agent in your backend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};