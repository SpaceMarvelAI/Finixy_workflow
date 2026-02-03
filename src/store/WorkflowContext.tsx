import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkflowConfig,ChatMessage } from '@/types/index'; 

interface WorkflowContextType {
  config: WorkflowConfig;
  updateConfig: (config: WorkflowConfig) => void;
  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;
  loadWorkflow: (name: string, nodes: any[], edges: any[]) => void;
  clearWorkflow: () => void;
  sessionId: number;
  chatHistory: ChatMessage[]; 
  setChatHistory: (messages: ChatMessage[]) => void;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
};

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WorkflowConfig>({
    name: 'New Workflow',
    nodes: [],
    edges: [],
    lastModified: new Date().toISOString(),
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number>(Date.now()); // Start with current time
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const loadWorkflow = (name: string, nodes: any[], edges: any[]) => {
    setConfig({
      name,
      nodes,
      edges,
      lastModified: new Date().toISOString(),
    });
    // We do NOT change sessionId here because loading history might 
    // want to keep the current chat context, or you can opt to clear it.
  };

  // ✅ NEW: Resets everything for a fresh start
  const clearWorkflow = () => {
    setConfig({
      name: 'New Workflow',
      nodes: [],
      edges: [],
      lastModified: new Date().toISOString(),
    });
    setSelectedNode(null);
    setSessionId(Date.now()); // This triggers the chat reset
  };

  return (
    <WorkflowContext.Provider
      value={{
        config,
        updateConfig: setConfig,
        loadWorkflow,
        clearWorkflow, 
        sessionId,     
        selectedNode,
        setSelectedNode,
        chatHistory,   
        setChatHistory,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};