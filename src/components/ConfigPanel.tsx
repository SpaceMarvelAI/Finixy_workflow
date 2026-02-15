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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Configure Node</h3>
        <div className="flex gap-2">
          <button
            onClick={deleteNode}
            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closePanel}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-colors"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common Fields - Available for ALL nodes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={nodeConfig.name || currentNode.data.label || ""}
            onChange={(e) => {
              const newName = e.target.value;
              updateNodeConfig({ name: newName });
              // Also update the label to prevent reverting
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Enter node name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={nodeConfig.description || ""}
            onChange={(e) => updateNodeConfig({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={3}
            placeholder="Describe what this node does"
          />
        </div>

        {/* Node Type Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
            {currentNode.data.nodeType || 'Unknown'}
          </div>
        </div>

        {/* Trigger Node */}
        {currentNode.data.nodeType === "trigger" && (
          <>
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Trigger Settings</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={nodeConfig.triggerType || "manual"}
                onChange={(e) =>
                  updateNodeConfig({ triggerType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Email Settings</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="email"
                value={nodeConfig.emailTo || ""}
                onChange={(e) => updateNodeConfig({ emailTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={nodeConfig.emailSubject || ""}
                onChange={(e) =>
                  updateNodeConfig({ emailSubject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                value={nodeConfig.emailBody || ""}
                onChange={(e) =>
                  updateNodeConfig({ emailBody: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={4}
                placeholder="Email body content"
              />
            </div>
          </>
        )}

        {/* Delay Node */}
        {currentNode.data.nodeType === "delay" && (
          <>
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Delay Settings</h4>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wait
                </label>
                <input
                  type="number"
                  value={nodeConfig.delayAmount || 1}
                  onChange={(e) =>
                    updateNodeConfig({ delayAmount: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={nodeConfig.delayUnit || "days"}
                  onChange={(e) =>
                    updateNodeConfig({ delayUnit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Export Settings</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <select
                value={nodeConfig.exportFormat || "CSV"}
                onChange={(e) =>
                  updateNodeConfig({ exportFormat: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Condition Settings</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Expression
              </label>
              <input
                type="text"
                value={nodeConfig.condition || ""}
                onChange={(e) => updateNodeConfig({ condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., amount > 1000"
              />
            </div>
          </>
        )}

        {/* Code Node */}
        {currentNode.data.nodeType === "code" && (
          <>
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Code Settings</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <textarea
                value={nodeConfig.code || ""}
                onChange={(e) => updateNodeConfig({ code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm outline-none"
                rows={8}
                placeholder="// Write your code here"
              />
            </div>
          </>
        )}

        {/* Info Message for Backend Agent Nodes */}
        {!['trigger', 'email', 'delay', 'export', 'condition', 'code'].includes(currentNode.data.nodeType || '') && (
          <div className="border-t pt-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>📋 Backend Agent Node</strong>
              </p>
              <p className="text-sm text-blue-700 mt-2">
                This <strong>{currentNode.data.nodeType}</strong> node is configured through backend agent logic. 
                You can customize its name and description above for documentation purposes.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                The node's execution logic is handled by the corresponding agent in your backend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};