import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomNode } from "@components/workflow/CustomNode";
import { CustomEdge } from "@components/workflow/CustomEdge";
import { CustomMiniMap } from "@components/workflow/CustomMiniMap";
import { useWorkflow } from "@store/WorkflowContext";
import { WorkflowNode, NodeType } from "@/types/index";
import { Layers, Play, Loader2 } from "lucide-react";
import { chatService } from "../../services/api";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export const WorkflowCanvas: React.FC = () => {
  const { config, updateConfig, setSelectedNode, currentChatId } =
    useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance | null>(null);

  const isInternalUpdate = useRef(false);
  const prevConfigRef = useRef(config);

  // Show notification helper
  const showNotification = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setNotification({ show: true, message, type });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
      }, 4000);
    },
    [],
  );

  const onNodesChangeHandler = useCallback(
    (changes: any[]) => {
      const hasRemoval = changes.some((change) => change.type === "remove");
      if (hasRemoval) {
        setSelectedNode(null);
      }
      onNodesChange(changes);
    },
    [onNodesChange, setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Sync config to canvas - Force update when config changes
  useEffect(() => {
    const configChanged =
      JSON.stringify(prevConfigRef.current.nodes) !==
        JSON.stringify(config.nodes) ||
      JSON.stringify(prevConfigRef.current.edges) !==
        JSON.stringify(config.edges);

    if (configChanged) {
      console.log("=== FORCE CANVAS UPDATE ===");
      console.log("New nodes:", config.nodes?.length);
      console.log("New edges:", config.edges?.length);

      // Debug: Show actual node IDs
      if (config.nodes && config.nodes.length > 0) {
        console.log(
          "Node IDs:",
          config.nodes.map((n: any) => n.id),
        );
      }

      // Debug: Show edge connections
      if (config.edges && config.edges.length > 0) {
        console.log(
          "Edge connections:",
          config.edges.map((e: any) => `${e.id}: ${e.source} -> ${e.target}`),
        );
      }

      // Force update nodes
      setNodes(config.nodes || []);

      // Force update edges with proper formatting - MUST USE 'custom' TYPE
      const formattedEdges = (config.edges || []).map((edge, idx) => {
        const formatted = {
          id: edge.id || `edge-${idx}`,
          source: edge.source,
          target: edge.target,
          type: "custom", // CRITICAL: Must match edgeTypes
          animated: edge.animated !== false, // Preserve animated state
          style: edge.style || {
            stroke: "#b1b1b7",
            strokeWidth: 2,
          },
          // Preserve any other edge properties
          ...(edge.label && { label: edge.label }),
        };
        console.log("Formatted edge:", formatted);
        return formatted;
      });

      setEdges(formattedEdges);
      prevConfigRef.current = config;

      console.log("=== CANVAS UPDATED ===");
      console.log("Canvas now has:", formattedEdges.length, "edges");

      // VALIDATION: Check if edges can connect to nodes
      if (config.nodes && config.edges && config.edges.length > 0) {
        const nodeIds = new Set(config.nodes.map((n: any) => n.id));
        console.log("=== EDGE VALIDATION ===");
        config.edges.forEach((edge: any) => {
          const sourceExists = nodeIds.has(edge.source);
          const targetExists = nodeIds.has(edge.target);
          const status =
            sourceExists && targetExists ? "✅ VALID" : "❌ INVALID";
          console.log(
            `${status} Edge: ${edge.source} -> ${edge.target} (source: ${sourceExists}, target: ${targetExists})`,
          );
        });
      }
    }
  }, [config, setNodes, setEdges]);

  // Handle edge deletions
  useEffect(() => {
    const handleDeleteEdge = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { edgeId } = customEvent.detail;

      console.log("🗑️ Deleting edge:", edgeId);

      // Store the updated edges in a variable we can use
      let updatedEdges: any[] = [];

      // Update edges state
      setEdges((currentEdges) => {
        updatedEdges = currentEdges.filter((edge) => edge.id !== edgeId);
        console.log("Edges after deletion:", updatedEdges.length);
        console.log("Updated edges:", updatedEdges);
        return updatedEdges;
      });

      // Update config after state update with the captured edges
      setTimeout(() => {
        console.log("Updating config with edges:", updatedEdges.length);
        updateConfig({
          ...config,
          edges: updatedEdges,
          lastModified: new Date().toISOString(),
        });
      }, 50);
    };

    window.addEventListener("deleteEdge", handleDeleteEdge);
    return () => {
      window.removeEventListener("deleteEdge", handleDeleteEdge);
    };
  }, [setEdges, updateConfig, config]);

  // Sync canvas changes back to config (debounced)
  useEffect(() => {
    if (isInternalUpdate.current) return;

    const workflowNodes: WorkflowNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type || "custom",
      position: node.position,
      data: node.data,
    }));

    if (
      nodes.length > 0 &&
      JSON.stringify(workflowNodes) !== JSON.stringify(config.nodes)
    ) {
      const timeoutId = setTimeout(() => {
        updateConfig({
          ...config,
          nodes: workflowNodes,
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, config, updateConfig]);

  useEffect(() => {
    if (isInternalUpdate.current) return;

    // Sync edges to config when they change - preserve all edge properties
    const edgesStr = JSON.stringify(
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        animated: e.animated,
        style: e.style,
        label: e.label,
      })),
    );
    const configEdgesStr = JSON.stringify(
      (config.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        animated: e.animated,
        style: e.style,
        label: e.label,
      })),
    );

    if (edgesStr !== configEdgesStr && edges.length > 0) {
      const timeoutId = setTimeout(() => {
        console.log("💾 Syncing edges to config:", edges.length);
        updateConfig({
          ...config,
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type || "custom",
            animated: e.animated !== false,
            style: e.style || { stroke: "#b1b1b7", strokeWidth: 2 },
            ...(e.label && { label: e.label }),
          })),
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [edges, config, updateConfig]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const isConditionNode = sourceNode?.data?.nodeType === "condition";

      const newEdge = {
        ...params,
        type: "custom", // CRITICAL: Must match edgeTypes
        animated: true,
        label: isConditionNode
          ? params.sourceHandle === "if"
            ? "✓ IF"
            : "✗ ELSE"
          : undefined,
        style: isConditionNode
          ? params.sourceHandle === "if"
            ? { stroke: "#0916cc", strokeWidth: 2 }
            : { stroke: "#ef4444", strokeWidth: 2 }
          : { stroke: "#b1b1b7", strokeWidth: 2 },
      };

      isInternalUpdate.current = true;
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 100);
        return updated;
      });
    },
    [setEdges, nodes],
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: any[]) => {
      console.log("🗑️ Deleting edges via keyboard:", edgesToDelete.length);

      // Store updated edges
      let updatedEdges: any[] = [];

      setEdges((currentEdges) => {
        const idsToDelete = new Set(edgesToDelete.map((e) => e.id));
        updatedEdges = currentEdges.filter((edge) => !idsToDelete.has(edge.id));

        console.log("Edges after keyboard deletion:", updatedEdges.length);
        return updatedEdges;
      });

      // Update config with captured edges
      setTimeout(() => {
        console.log(
          "Updating config after keyboard delete:",
          updatedEdges.length,
        );
        updateConfig({
          ...config,
          edges: updatedEdges,
          lastModified: new Date().toISOString(),
        });
      }, 50);
    },
    [setEdges, updateConfig, config],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData("application/reactflow");
      if (!data || !reactFlowInstance) return;

      const { nodeType, label } = JSON.parse(data) as {
        nodeType: NodeType;
        label: string;
      };
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: "custom",
        position,
        data: {
          label,
          nodeType,
          config: { name: label },
        },
      };

      isInternalUpdate.current = true;
      setNodes((nds) => {
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 100);
        return [...nds, newNode];
      });
    },
    [reactFlowInstance, setNodes],
  );

  // ============================================================================
  // RUN WORKFLOW HANDLER
  // ============================================================================
  // RUN WORKFLOW HANDLER
  // ============================================================================
  const handleRunWorkflow = useCallback(async () => {
    if (!config.name || nodes.length === 0) {
      showNotification("Please create a workflow first", "error");
      return;
    }

    setIsExecuting(true);

    try {
      console.log("🚀 Running workflow:", config.name);
      console.log("📋 Chat ID:", currentChatId);

      // Re-execute the workflow by sending the original query
      const query = config.name || "Execute workflow";

      const response = await chatService.sendQuery(
        query,
        currentChatId || undefined,
      );

      console.log("✅ Workflow executed:", response.data);

      // Update workflow with new execution results
      if (response.data.workflow) {
        const workflow = response.data.workflow;

        // Update node statuses to completed
        setNodes((currentNodes) =>
          currentNodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              status: workflow.status === "completed" ? "completed" : "failed",
            },
          })),
        );

        showNotification("Workflow executed successfully!", "success");
      }
    } catch (error: any) {
      console.error("❌ Workflow execution failed:", error);
      showNotification(
        `Workflow execution failed: ${error.response?.data?.detail || error.message}`,
        "error",
      );
    } finally {
      setIsExecuting(false);
    }
  }, [config, nodes, currentChatId, setNodes, showNotification]);

  return (
    <div
      className="h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 relative"
      ref={reactFlowWrapper}
    >
      {/* Node Count & Run Button - Top Right */}
      {nodes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          {/* Node Count */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl px-4 py-2 shadow-xl backdrop-blur-md flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-100">
              {nodes.length} {nodes.length === 1 ? "Node" : "Nodes"}
            </span>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunWorkflow}
            disabled={isExecuting}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            title="Execute workflow"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-transparent"
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
          style: { stroke: "#b1b1b7", strokeWidth: 2 },
        }}
        edgesUpdatable={true}
        edgesFocusable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        {/* Dark Grid Background - More Visible */}
        <Background
          color="#6b7280"
          gap={20}
          size={2}
          style={{ backgroundColor: "transparent" }}
        />

        {/* Modern Dark Controls - Left Side */}
        <Controls
          className="!bg-gradient-to-br !from-gray-800 !to-gray-900 !border !border-gray-700 !rounded-xl !shadow-xl"
          position="top-left"
        />

        {/* Custom Mini Map - MUST be inside ReactFlow */}
        <CustomMiniMap />
      </ReactFlow>

      {/* Notification Toast - Positioned below Run button */}
      {notification.show && (
        <div className="fixed top-36 right-4 z-[100] animate-slide-in-right">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-2xl backdrop-blur-sm min-w-[280px] ${
              notification.type === "success"
                ? "bg-green-500/95 border border-green-400/50"
                : "bg-red-500/95 border border-red-400/50"
            }`}
          >
            <div className="flex-shrink-0">
              {notification.type === "success" ? (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-white font-medium text-sm flex-1">
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {/* Custom Styles for Dark Theme */}
      <style>{`
        /* React Flow Dark Theme Overrides */
        .react-flow__node {
          font-family: inherit;
        }
        
        .react-flow__edge-path {
          stroke-width: 2;
        }
        
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #ef4444 !important;
          stroke-width: 4 !important;
        }
        
        .react-flow__controls {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        
        .react-flow__controls-button {
          background: linear-gradient(to bottom right, #1f2937, #111827) !important;
          border: none !important;
          border-bottom: 1px solid #374151 !important;
          color: #9ca3af !important;
          transition: all 0.2s !important;
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
        }
        
        .react-flow__controls-button:first-child {
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
        }
        
        .react-flow__controls-button:last-child {
          border-bottom-left-radius: 12px !important;
          border-bottom-right-radius: 12px !important;
          border-bottom: none !important;
        }
        
        .react-flow__controls-button:hover {
          background: linear-gradient(to bottom right, #374151, #1f2937) !important;
          color: #e5e7eb !important;
          transform: scale(1.05);
        }
        
        .react-flow__controls-button:hover:enabled {
          background: linear-gradient(to bottom right, #3b82f6, #2563eb) !important;
          color: white !important;
        }
        
        .react-flow__controls-button svg {
          fill: currentColor;
          max-width: 16px !important;
          max-height: 16px !important;
        }
        
        .react-flow__background {
          background-color: transparent;
        }
        
        /* Selection box */
        .react-flow__selection {
          background: rgba(59, 130, 246, 0.1);
          border: 2px solid #3b82f6;
        }
        
        /* Connection line while dragging */
        .react-flow__connectionline {
          stroke: #3b82f6;
          stroke-width: 2;
        }
        
        /* Handle styles */
        .react-flow__handle {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid #1e3a8a;
        }
        
        .react-flow__handle:hover {
          background: #60a5fa;
        }

        /* Notification Animation */
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};
