import React, { useState, useEffect, useRef } from "react";
import {
  Plus, History, Settings, Search, X, FileText,
  ChevronRight, Pin, Edit2, Trash2, AlertTriangle, CheckCircle, Loader2,
  MessageSquare
} from "lucide-react";
import { chatService } from "../services/api";
import { useWorkflow } from "../store/WorkflowContext"; 
import { mapBackendNodesToFrontend } from "../utils/workflowMapper";
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";

// --- Types ---
interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface WorkflowItem {
  id: string;
  title: string;
  date: string;
  pinned: boolean;
}

interface SidebarProps {
  isChatExpanded: boolean;
  onToggleChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isChatExpanded, onToggleChat }) => {
  const { loadWorkflow, clearWorkflow, setChatHistory } = useWorkflow();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyItems, setHistoryItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // --- Modal State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // 1. Fetch Workflows
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await chatService.getWorkflowHistory();
      if (response.data.status === "success") {
        const mappedData = response.data.workflows.map((wf: any) => ({
          id: wf.id,
          title: wf.name || wf.query || "Untitled Workflow",
          date: new Date(wf.created_at).toLocaleDateString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          }),
          pinned: wf.is_pinned || false,
        }));
        setHistoryItems(mappedData);
      }
    } catch (error) {
      showToast("Failed to load history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) fetchHistory();
  }, [isHistoryOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  LOAD WORKFLOW HANDLER 
  const handleHistoryItemClick = async (id: string) => {
    if (activeMenuId || editingId) return;

    try {
      showToast("Loading workflow...", "success");
      const response = await chatService.getWorkflowDetails(id);

      if (response.data.status === "success") {
        const wf = response.data.workflow;
        
        const rawDef = wf.workflow_definition || {};
        const rawNodes = rawDef.nodes || wf.nodes || [];
        const rawEdges = rawDef.edges || wf.edges || [];

        const safeNodes = mapBackendNodesToFrontend(
           rawNodes, 
           wf.name || "", 
           wf.report_type || wf.type || ""
        );

        let safeEdges: any[] = [];

        if (rawEdges.length > 0) {
          safeEdges = rawEdges.map((edge: any, i: number) => ({
            ...edge,
            id: (edge.id && edge.id !== "undefined") ? edge.id : `e-${edge.source}-${edge.target}-${i}-${Date.now()}`,
            type: "custom",
            animated: true,
            style: { stroke: "#b1b1b7", strokeWidth: 2, ...edge.style },
          }));
        } else {
          safeEdges = safeNodes.slice(0, -1).map((node: any, i: number) => ({
            id: `e-${node.id}-${safeNodes[i + 1].id}`,
            source: node.id,
            target: safeNodes[i + 1].id,
            type: "custom",
            animated: true,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          }));
        }

        loadWorkflow(wf.name || wf.query || "Loaded Workflow", safeNodes, safeEdges);
        
        if (wf.query) {
          setChatHistory([
            { role: 'assistant', content: INITIAL_CHAT_MESSAGE },
            { role: 'user', content: wf.query },
          ]);
        } else {
          setChatHistory([
            { role: 'assistant', content: `Loaded "${wf.name}" from history.` }
          ]);
        }
        setIsHistoryOpen(false);
      }
    } catch (error: any) {
      console.error("Load Error:", error);
      if (error.response?.status === 405) {
        showToast("Backend requires restart (405)", "error");
      } else {
        showToast("Failed to load workflow", "error");
      }
    }
  };

  const handlePin = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const item = historyItems.find(i => i.id === id);
      if (!item) return;
      try {
        const newPinnedStatus = !item.pinned;
        setHistoryItems(prev => prev.map(i => i.id === id ? { ...i, pinned: newPinnedStatus } : i));
        await chatService.updateWorkflow(id, { is_pinned: newPinnedStatus });
        showToast(newPinnedStatus ? "Workflow pinned" : "Workflow unpinned");
      } catch (error) { showToast("Failed to pin", "error"); }
      setActiveMenuId(null);
  };

  const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
      e.stopPropagation(); setEditingId(id); setEditValue(currentTitle); setActiveMenuId(null);
  };

  const saveRename = async () => {
      if (editingId && editValue.trim()) {
          try {
              await chatService.updateWorkflow(editingId, { name: editValue });
              setHistoryItems(prev => prev.map(i => i.id === editingId ? { ...i, title: editValue } : i));
              showToast("Renamed successfully");
          } catch { showToast("Rename failed", "error"); }
          setEditingId(null);
      }
  };
  
  const confirmDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); setItemToDelete(id); setShowDeleteModal(true); setActiveMenuId(null);
  };

  const executeDelete = async () => {
      if (itemToDelete) {
          try {
              await chatService.deleteWorkflow(itemToDelete);
              setHistoryItems(prev => prev.filter(i => i.id !== itemToDelete));
              showToast("Workflow deleted");
          } catch { showToast("Delete failed", "error"); }
          setShowDeleteModal(false); setItemToDelete(null);
      }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); setActiveMenuId(activeMenuId === id ? null : id);
  };

  const filteredHistory = historyItems
      .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

  const handleNewChat = () => {
    clearWorkflow();
    setIsHistoryOpen(false);
  };

  return (
    <>
      <div 
        className={`relative bg-gradient-to-b from-gray-900 to-black flex flex-col items-start py-4 gap-2 border-r border-gray-800 h-full z-50 transition-all duration-300 ${
          isHovered ? 'w-54' : 'w-12'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* NEW CHAT BUTTON */}
        <button 
          onClick={handleNewChat} 
          className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group"
          title="New Chat"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-blue-500/50 transition-all">
            <Plus className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">New Chat</span>
          )}
        </button>

        {/* ASK FINIXY AI BUTTON */}
        <button 
          onClick={onToggleChat}
          className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group"
          title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
            isChatExpanded 
              ? "bg-gradient-to-br from-purple-600 to-purple-700 group-hover:from-purple-500 group-hover:to-purple-600 group-hover:shadow-purple-500/50" 
              : "bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700"
          }`}>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">Ask Finixy AI</span>
          )}
        </button>

        {/* HISTORY BUTTON */}
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
          className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group"
          title="History"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
            isHistoryOpen 
              ? "bg-gradient-to-br from-cyan-600 to-cyan-700 group-hover:from-cyan-500 group-hover:to-cyan-600 group-hover:shadow-cyan-500/50" 
              : "bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700"
          }`}>
            <History className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">History</span>
          )}
        </button>

        {/* SETTINGS BUTTON - BOTTOM */}
        <button className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group mt-auto">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all">
            <Settings className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">Settings</span>
          )}
        </button>

        {/* HISTORY PANEL */}
        {isHistoryOpen && (
          <div className="absolute left-full top-0 h-full w-80 bg-gradient-to-br from-gray-900 to-black border-r border-gray-800 shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-40 backdrop-blur-md">
            <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black backdrop-blur-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-100 text-sm tracking-wide">📜 Workflow History</h3>
                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 p-1.5 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search workflows..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-10 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200 placeholder-gray-500 transition-all" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={menuRef}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-400" />
                  <span className="text-xs">Loading workflows...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No workflows found</p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleHistoryItemClick(item.id)} 
                    className={`group relative flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-all border border-transparent hover:border-gray-700 ${
                      item.pinned ? "bg-gray-800/50 border-gray-700" : ""
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      item.pinned 
                        ? "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white shadow-lg shadow-yellow-500/20" 
                        : "bg-gray-800 border border-gray-700 text-blue-400 group-hover:border-blue-500/50"
                    }`}>
                      {item.pinned ? <Pin className="w-4 h-4 fill-current" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <input 
                          type="text" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          onBlur={saveRename} 
                          onKeyDown={(e) => e.key === 'Enter' && saveRename()} 
                          autoFocus 
                          className="w-full text-sm font-medium bg-gray-900 border border-blue-500 rounded-lg px-2 py-1 outline-none text-gray-100 focus:ring-2 focus:ring-blue-500" 
                          onClick={(e) => e.stopPropagation()} 
                        />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-100 truncate">{item.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.date}</p>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={(e) => toggleMenu(e, item.id)} 
                      className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-all"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeMenuId === item.id ? "rotate-90" : ""}`} />
                    </button>
                    {activeMenuId === item.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 py-1 backdrop-blur-md">
                        <button 
                          onClick={(e) => handlePin(e, item.id)} 
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Pin className="w-3 h-3" /> {item.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button 
                          onClick={(e) => startRename(e, item.id, item.title)} 
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                        <div className="h-px bg-gray-700 my-1"></div>
                        <button 
                          onClick={(e) => confirmDelete(e, item.id)} 
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl shadow-2xl w-96 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-red-500/40">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">Delete Workflow?</h3>
              <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-all border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete} 
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md border ${
              toast.type === "error" 
                ? "bg-red-600 border-red-500" 
                : "bg-gray-800 border-gray-700"
            }`}
          >
            {toast.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
};