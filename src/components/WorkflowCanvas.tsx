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
import { useWorkflow } from '@store/WorkflowContext';
import { WorkflowNode, NodeType } from '@/types/index';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export const WorkflowCanvas: React.FC = () => {
  const { config, updateConfig, setSelectedNode } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState(config.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(config.edges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);

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

  // Sync config -> local state
  useEffect(() => {
    setNodes(config.nodes);
    // Enforce dashed styling on load
    const fixedEdges = config.edges.map((edge) => ({
      ...edge,
      type: edge.type || 'custom',
      animated: true,
      style: { stroke: '#b1b1b7', strokeWidth: 2, ...edge.style }
    }));
    setEdges(fixedEdges);
  }, [config.nodes, config.edges, setNodes, setEdges]);

  // Handle deletions
  useEffect(() => {
    const handleDeleteEdge = (event: CustomEvent) => {
      const { edgeId } = event.detail;
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(edge => edge.id !== edgeId);
        setTimeout(() => {
          updateConfig({
            ...config,
            edges: updatedEdges,
            lastModified: new Date().toISOString(),
          });
        }, 0);
        return updatedEdges;
      });
    };

    window.addEventListener('deleteEdge', handleDeleteEdge as EventListener);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdge as EventListener);
    };
  }, [setEdges, config, updateConfig]);

  // Sync state -> config
  useEffect(() => {
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type || 'custom',
      position: node.position,
      data: node.data
    }));
    
    if (JSON.stringify(workflowNodes) !== JSON.stringify(config.nodes)) {
      const timeoutId = setTimeout(() => {
        updateConfig({
          ...config,
          nodes: workflowNodes,
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes]); 

  useEffect(() => {
    if (JSON.stringify(edges) !== JSON.stringify(config.edges)) {
      const timeoutId = setTimeout(() => {
        updateConfig({
          ...config,
          edges: edges,
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [edges]); 

  // --- FIXED MANUAL CONNECTION LOGIC ---
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const isConditionNode = sourceNode?.data?.nodeType === 'condition';
      
      const newEdge = {
        ...params,
        type: 'custom',
        animated: true, // Forces Dashed Line
        
        label: isConditionNode 
          ? params.sourceHandle === 'if' ? '✓ IF' : '✗ ELSE'
          : undefined,
          
        style: isConditionNode
          ? params.sourceHandle === 'if'
            ? { stroke: '#0916cc', strokeWidth: 2 }
            : { stroke: '#ef4444', strokeWidth: 2 }
          : { stroke: '#b1b1b7', strokeWidth: 2 }, // Default Grey Style
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodes]
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

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-full bg-gray-50" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-50"
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
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};