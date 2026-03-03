import React, { createContext, useContext, useState, ReactNode } from "react";
import { WorkflowConfig, ChatMessage } from "@/types/index";

interface WorkflowContextType {
  config: WorkflowConfig;
  updateConfig: (config: WorkflowConfig) => void;
  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;
  loadWorkflow: (
    name: string,
    nodes: any[],
    edges: any[],
    reportId?: string,
    reportUrl?: string,
    reportFileName?: string
  ) => void;
  clearWorkflow: () => void;
  sessionId: number;
  chatHistory: ChatMessage[];
  setChatHistory: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  refreshSidebar: () => void;
  sidebarRefreshTrigger: number;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context)
    throw new Error("useWorkflow must be used within WorkflowProvider");
  return context;
};

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<WorkflowConfig>({
    name: "New Workflow",
    nodes: [],
    edges: [],
    lastModified: new Date().toISOString(),
    reportId: undefined,
    reportUrl: undefined,
    reportFileName: undefined,
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number>(Date.now()); // Start with current time
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState<number>(0);

  const refreshSidebar = () => {
    setSidebarRefreshTrigger((prev) => prev + 1);
  };

  const loadWorkflow = (
    name: string,
    nodes: any[],
    edges: any[],
    reportId?: string,
    reportUrl?: string,
    reportFileName?: string
  ) => {
    setConfig({
      name,
      nodes,
      edges,
      lastModified: new Date().toISOString(),
      reportId,
      reportUrl,
      reportFileName,
    });
    // We do NOT change sessionId here because loading history might
    // want to keep the current chat context, or you can opt to clear it.
  };

  //  Resets everything for a fresh start
  const clearWorkflow = () => {
    setConfig({
      name: "New Workflow",
      nodes: [],
      edges: [],
      lastModified: new Date().toISOString(),
      reportId: undefined,
      reportUrl: undefined,
      reportFileName: undefined,
    });
    setSelectedNode(null);
    setSessionId(Date.now()); // This triggers the chat reset
    setCurrentChatId(null); // Reset chat ID for new chat
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
        currentChatId,
        setCurrentChatId,
        refreshSidebar,
        sidebarRefreshTrigger,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
