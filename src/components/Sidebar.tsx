import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  History,
  Settings,
  Search,
  X,
  ChevronRight,
  Pin,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MessageSquare,
  FileText,
} from "lucide-react";
import { chatService } from "../services/api";
import { useWorkflow } from "../store/WorkflowContext";
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
import {
  mapBackendNodesToFrontend,
  mapBackendEdgesToFrontend,
} from "../utils/workflowMapper";

// ============================================================================
// TYPES
// ============================================================================
interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ChatItem {
  chat_id: string;
  session_title: string;
  session_type: string;
  created_at: string;
  last_message_at: string;
  pinned: boolean;
  message_count: number;
  report_count: number;
  session_status: string;
}

interface SidebarProps {
  isChatExpanded: boolean;
  onToggleChat: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const Sidebar: React.FC<SidebarProps> = ({
  isChatExpanded,
  onToggleChat,
}) => {
  const {
    loadWorkflow,
    clearWorkflow,
    setChatHistory,
    setCurrentChatId,
    sidebarRefreshTrigger,
  } = useWorkflow();

  // State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // ============================================================================
  // TOAST NOTIFICATIONS
  // ============================================================================
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3000,
      );
    },
    [],
  );

  // ============================================================================
  // FETCH CHAT HISTORY - WITH FILTERING
  // ============================================================================
  const fetchHistory = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log("⏸️ Already fetching, skipping...");
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await chatService.getChatHistory(100, 0);
      console.log("📋 Raw API Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        console.log("📊 Sample chat item:", response.data[0]);

        // Deduplicate by chat_id using Map
        const uniqueChatsMap = new Map<string, ChatItem>();
        response.data.forEach((chat: ChatItem) => {
          if (chat.chat_id && !uniqueChatsMap.has(chat.chat_id)) {
            uniqueChatsMap.set(chat.chat_id, chat);
          }
        });

        const uniqueChats = Array.from(uniqueChatsMap.values());

        console.log("📊 Total fetched:", response.data.length);
        console.log("📊 Unique chats:", uniqueChats.length);

        setChatItems(uniqueChats);
      } else {
        console.error("❌ Invalid response format");
        showToast("Invalid response format", "error");
        setChatItems([]);
      }
    } catch (error) {
      console.error("❌ Failed to load chat history:", error);
      showToast("Failed to load history", "error");
      setChatItems([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [showToast]);

  // ============================================================================
  // LOAD CHAT HANDLER
  // ============================================================================
  const handleChatItemClick = useCallback(
    async (chat_id: string) => {
      if (activeMenuId || editingId) return;

      try {
        showToast("Loading chat...", "success");
        const response = await chatService.getChatDetails(chat_id);

        console.log("=== LOADING CHAT ===");
        console.log("Chat ID:", chat_id);
        console.log("Response:", response.data);

        if (response.data && response.data.chat_id) {
          const chat = response.data;

          // Set current chat ID
          setCurrentChatId(chat.chat_id);

          // Load messages
          if (chat.messages && Array.isArray(chat.messages)) {
            console.log("📝 Loading", chat.messages.length, "messages");
            setChatHistory(chat.messages);
          } else {
            setChatHistory([
              { role: "assistant", content: INITIAL_CHAT_MESSAGE },
            ]);
          }

          // Try to load workflow and report if exists
          let workflow_id = null;
          let latest_report_id = null;

          if (chat.final_report_ids && chat.final_report_ids.length > 0) {
            latest_report_id = chat.final_report_ids[chat.final_report_ids.length - 1];
            console.log("📊 Found latest report ID in chat:", latest_report_id);
          }

          // Check messages for workflow_id
          if (chat.messages) {
            for (let i = chat.messages.length - 1; i >= 0; i--) {
              if (chat.messages[i]?.metadata?.workflow_id) {
                workflow_id = chat.messages[i].metadata.workflow_id;
                break;
              }
            }
          }

          // Check chat metadata
          if (!workflow_id && chat.metadata?.workflow_id) {
            workflow_id = chat.metadata.workflow_id;
          }

          if (workflow_id) {
            try {
              console.log("🔄 Loading workflow:", workflow_id);
              const wfResponse =
                await chatService.getWorkflowDetails(workflow_id);

              if (
                wfResponse.data?.status === "success" &&
                wfResponse.data.workflow
              ) {
                const wf = wfResponse.data.workflow;
                const rawNodes = wf.workflow_definition?.nodes || [];
                const rawEdges = wf.workflow_definition?.edges || [];

                if (rawNodes.length > 0) {
                  const safeNodes = mapBackendNodesToFrontend(
                    rawNodes,
                    wf.name || "",
                    wf.report_type || "",
                  );
                  const safeEdges = mapBackendEdgesToFrontend(
                    rawEdges,
                    safeNodes,
                  );

                  loadWorkflow(
                    wf.name || wf.query || "Loaded Workflow",
                    safeNodes,
                    safeEdges,
                    latest_report_id || undefined,
                  );

                  showToast("Workflow loaded", "success");
                }
              }
            } catch (wfError) {
              console.error("❌ Failed to load workflow:", wfError);
              // Fallback: Clear workflow but keep the report ID if we have it
              if (latest_report_id) {
                loadWorkflow("New Workflow", [], [], latest_report_id);
              }
            }
          } else if (latest_report_id) {
            // No workflow but have report
            loadWorkflow("New Workflow", [], [], latest_report_id);
          }

          setIsHistoryOpen(false);
        }
      } catch (error: any) {
        console.error("❌ Load Error:", error);
        showToast("Failed to load chat", "error");
      }
    },
    [
      activeMenuId,
      editingId,
      showToast,
      setCurrentChatId,
      setChatHistory,
      loadWorkflow,
    ],
  );

  // ============================================================================
  // PIN HANDLER
  // ============================================================================
  const handlePin = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const item = chatItems.find((i) => i.chat_id === id);
      if (!item) return;

      try {
        const newPinnedStatus = !item.pinned;
        setChatItems((prev) =>
          prev.map((i) =>
            i.chat_id === id ? { ...i, pinned: newPinnedStatus } : i,
          ),
        );
        await chatService.updateChat(id, { pinned: newPinnedStatus });
        showToast(newPinnedStatus ? "Pinned" : "Unpinned");
      } catch (error) {
        showToast("Failed to pin", "error");
        setChatItems((prev) =>
          prev.map((i) =>
            i.chat_id === id ? { ...i, pinned: item.pinned } : i,
          ),
        );
      }
      setActiveMenuId(null);
    },
    [chatItems, showToast],
  );

  // ============================================================================
  // RENAME HANDLERS
  // ============================================================================
  const startRename = useCallback(
    (e: React.MouseEvent, id: string, currentTitle: string) => {
      e.stopPropagation();
      setEditingId(id);
      setEditValue(currentTitle);
      setActiveMenuId(null);
    },
    [],
  );

  const saveRename = useCallback(async () => {
    if (editingId && editValue.trim()) {
      try {
        await chatService.updateChat(editingId, { session_title: editValue });
        setChatItems((prev) =>
          prev.map((i) =>
            i.chat_id === editingId ? { ...i, session_title: editValue } : i,
          ),
        );
        showToast("Renamed");
      } catch {
        showToast("Rename failed", "error");
      }
      setEditingId(null);
    }
  }, [editingId, editValue, showToast]);

  // ============================================================================
  // DELETE HANDLERS
  // ============================================================================
  const confirmDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteModal(true);
    setActiveMenuId(null);
  }, []);

  const executeDelete = useCallback(async () => {
    if (itemToDelete) {
      try {
        await chatService.deleteChat(itemToDelete);
        setChatItems((prev) => prev.filter((i) => i.chat_id !== itemToDelete));
        showToast("Deleted");
      } catch {
        showToast("Delete failed", "error");
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, showToast]);

  // ============================================================================
  // MENU TOGGLE
  // ============================================================================
  const toggleMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  }, []);

  // ============================================================================
  // NEW CHAT HANDLER
  // ============================================================================
  const handleNewChat = useCallback(() => {
    clearWorkflow();
    setChatHistory([]);
    setCurrentChatId(null);
    setIsHistoryOpen(false);
  }, [clearWorkflow, setChatHistory, setCurrentChatId]);

  // ============================================================================
  // FILTERED AND SORTED HISTORY
  // ============================================================================
  const filteredHistory = chatItems
    .filter((item) =>
      item.session_title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      );
    });

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory();
    }
  }, [isHistoryOpen, fetchHistory]);

  // Refresh sidebar when trigger changes (e.g., after file upload)
  useEffect(() => {
    if (sidebarRefreshTrigger > 0 && isHistoryOpen) {
      console.log("🔄 Sidebar refresh triggered");
      fetchHistory();
    }
  }, [sidebarRefreshTrigger, isHistoryOpen, fetchHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <div
        className={`relative bg-gradient-to-b from-gray-900 to-black flex flex-col items-start py-4 gap-2 border-r border-gray-800 h-full z-50 transition-all duration-300 ${
          isHovered ? "w-54" : "w-12"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* NEW CHAT */}
        <button
          onClick={handleNewChat}
          className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group"
          title="New Chat"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-blue-500/50 transition-all">
            <Plus className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
              New Chat
            </span>
          )}
        </button>

        {/* ASK FINIXY AI */}
        <button
          onClick={onToggleChat}
          className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group"
          title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
              isChatExpanded
                ? "bg-gradient-to-br from-purple-600 to-purple-700 group-hover:from-purple-500 group-hover:to-purple-600 group-hover:shadow-purple-500/50"
                : "bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
              Ask Finixy AI
            </span>
          )}
        </button>

        {/* HISTORY */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group"
          title="History"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
              isHistoryOpen
                ? "bg-gradient-to-br from-cyan-600 to-cyan-700 group-hover:from-cyan-500 group-hover:to-cyan-600 group-hover:shadow-cyan-500/50"
                : "bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700"
            }`}
          >
            <History className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
              History
            </span>
          )}
        </button>

        {/* SETTINGS */}
        <button className="w-full px-2 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all group mt-auto">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all">
            <Settings className="w-4 h-4 text-white" />
          </div>
          {isHovered && (
            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
              Settings
            </span>
          )}
        </button>

        {/* HISTORY PANEL */}
        {isHistoryOpen && (
          <div className="absolute left-full top-0 h-full w-80 bg-gradient-to-br from-gray-900 to-black border-r border-gray-800 shadow-2xl flex flex-col z-[60]">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-100 text-sm">
                  Chat History
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 p-1.5 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={menuRef}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-400" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No chats found</p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.chat_id}
                    onClick={() => handleChatItemClick(item.chat_id)}
                    className={`group relative flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-all border ${
                      item.pinned
                        ? "bg-gray-800/50 border-gray-700"
                        : "border-transparent hover:border-gray-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.pinned
                          ? "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white shadow-lg"
                          : "bg-gray-800 border border-gray-700 text-blue-400"
                      }`}
                    >
                      {item.pinned ? (
                        <Pin className="w-4 h-4 fill-current" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === item.chat_id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveRename}
                          onKeyDown={(e) => e.key === "Enter" && saveRename()}
                          autoFocus
                          className="w-full text-sm font-medium bg-gray-900 border border-blue-500 rounded-lg px-2 py-1 outline-none text-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-100 truncate">
                            {item.session_title}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleMenu(e, item.chat_id)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${activeMenuId === item.chat_id ? "rotate-90" : ""}`}
                      />
                    </button>
                    {activeMenuId === item.chat_id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-[70] py-1">
                        <button
                          onClick={(e) => handlePin(e, item.chat_id)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Pin className="w-3 h-3" />
                          {item.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={(e) =>
                            startRename(e, item.chat_id, item.session_title)
                          }
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                        <div className="h-px bg-gray-700 my-1"></div>
                        <button
                          onClick={(e) => confirmDelete(e, item.chat_id)}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
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
              <h3 className="text-lg font-bold text-gray-100 mb-2">
                Delete Chat?
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-all border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${
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
            <span className="text-sm font-medium text-white">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};
