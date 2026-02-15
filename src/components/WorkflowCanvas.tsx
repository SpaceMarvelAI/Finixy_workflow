
import React, { useCallback, useEffect, useRef } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from '@components/CustomNode';
import { CustomEdge } from '@components/CustomEdge';
import { CustomMiniMap } from '@components/CustomMiniMap';
import { useWorkflow } from '@store/WorkflowContext';
import { WorkflowNode, NodeType } from '@/types/index';
import { Layers } from 'lucide-react';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export const WorkflowCanvas: React.FC = () => {
  const { config, updateConfig, setSelectedNode } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const isInternalUpdate = useRef(false);
  const prevConfigRef = useRef(config);

  const onNodesChangeHandler = useCallback(
    (changes: any[]) => {
      const hasRemoval = changes.some(change => change.type === 'remove');
      if (hasRemoval) {
        setSelectedNode(null);
      }
      onNodesChange(changes);
    },
    [onNodesChange, setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Sync config to canvas - Force update when config changes
  useEffect(() => {
    const configChanged = 
      JSON.stringify(prevConfigRef.current.nodes) !== JSON.stringify(config.nodes) ||
      JSON.stringify(prevConfigRef.current.edges) !== JSON.stringify(config.edges);

    if (configChanged) {
      console.log("=== FORCE CANVAS UPDATE ===");
      console.log("New nodes:", config.nodes?.length);
      console.log("New edges:", config.edges?.length);
      
      // Debug: Show actual node IDs
      if (config.nodes && config.nodes.length > 0) {
        console.log("Node IDs:", config.nodes.map((n: any) => n.id));
      }
      
      // Debug: Show edge connections
      if (config.edges && config.edges.length > 0) {
        console.log("Edge connections:", config.edges.map((e: any) => 
          `${e.id}: ${e.source} -> ${e.target}`
        ));
      }

      // Force update nodes
      setNodes(config.nodes || []);

      // Force update edges with proper formatting - MUST USE 'custom' TYPE
      const formattedEdges = (config.edges || []).map((edge, idx) => {
        const formatted = {
          id: edge.id || `edge-${idx}`,
          source: edge.source,
          target: edge.target,
          type: 'custom', // CRITICAL: Must match edgeTypes
          animated: true,
          style: { 
            stroke: '#b1b1b7', 
            strokeWidth: 2 
          }
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
          const status = sourceExists && targetExists ? "✅ VALID" : "❌ INVALID";
          console.log(`${status} Edge: ${edge.source} -> ${edge.target} (source: ${sourceExists}, target: ${targetExists})`);
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
        updatedEdges = currentEdges.filter(edge => edge.id !== edgeId);
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

    window.addEventListener('deleteEdge', handleDeleteEdge);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdge);
    };
  }, [setEdges, updateConfig, config]);

  // Sync canvas changes back to config (debounced)
  useEffect(() => {
    if (isInternalUpdate.current) return;
    
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type || 'custom',
      position: node.position,
      data: node.data
    }));
    
    if (nodes.length > 0 && JSON.stringify(workflowNodes) !== JSON.stringify(config.nodes)) {
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
    
    // Sync edges to config when they change
    const edgesStr = JSON.stringify(edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    const configEdgesStr = JSON.stringify((config.edges || []).map(e => ({ id: e.id, source: e.source, target: e.target })));
    
    if (edgesStr !== configEdgesStr) {
      const timeoutId = setTimeout(() => {
        console.log("Syncing edges to config:", edges.length);
        updateConfig({
          ...config,
          edges: edges,
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [edges, config, updateConfig]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const isConditionNode = sourceNode?.data?.nodeType === 'condition';
      
      const newEdge = {
        ...params,
        type: 'custom', // CRITICAL: Must match edgeTypes
        animated: true,
        label: isConditionNode 
          ? params.sourceHandle === 'if' ? '✓ IF' : '✗ ELSE'
          : undefined,
        style: isConditionNode
          ? params.sourceHandle === 'if'
            ? { stroke: '#0916cc', strokeWidth: 2 }
            : { stroke: '#ef4444', strokeWidth: 2 }
          : { stroke: '#b1b1b7', strokeWidth: 2 },
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
    [setEdges, nodes]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: any[]) => {
      console.log("🗑️ Deleting edges via keyboard:", edgesToDelete.length);
      
      // Store updated edges
      let updatedEdges: any[] = [];
      
      setEdges((currentEdges) => {
        const idsToDelete = new Set(edgesToDelete.map(e => e.id));
        updatedEdges = currentEdges.filter(edge => !idsToDelete.has(edge.id));
        
        console.log("Edges after keyboard deletion:", updatedEdges.length);
        return updatedEdges;
      });
      
      // Update config with captured edges
      setTimeout(() => {
        console.log("Updating config after keyboard delete:", updatedEdges.length);
        updateConfig({
          ...config,
          edges: updatedEdges,
          lastModified: new Date().toISOString(),
        });
      }, 50);
    },
    [setEdges, updateConfig, config]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data || !reactFlowInstance) return;

      const { nodeType, label } = JSON.parse(data) as { nodeType: NodeType; label: string };
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
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
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 relative" ref={reactFlowWrapper}>
      {/* Node Count Overlay - Top Right */}
      {nodes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl px-4 py-2 shadow-xl backdrop-blur-md flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-100">
            {nodes.length} {nodes.length === 1 ? 'Node' : 'Nodes'}
          </span>
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
          type: 'custom',
          animated: true,
          style: { stroke: '#b1b1b7', strokeWidth: 2 }
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
          style={{ backgroundColor: 'transparent' }}
        />
        
        {/* Modern Dark Controls - Left Side */}
        <Controls 
          className="!bg-gradient-to-br !from-gray-800 !to-gray-900 !border !border-gray-700 !rounded-xl !shadow-xl"
          position="top-left"
        />
        
        {/* Custom Mini Map - MUST be inside ReactFlow */}
        <CustomMiniMap />
      </ReactFlow>
      
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
      `}</style>
    </div>
  );
};