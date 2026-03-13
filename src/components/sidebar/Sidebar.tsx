import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  FolderOpen,
  BarChart3,
} from "lucide-react";
import { useTheme } from "../../store/ThemeContext";
import { chatService, reportService } from "../../services/api";
import { useWorkflow } from "../../store/WorkflowContext";
import { INITIAL_CHAT_MESSAGE } from "../../utils/constants";
import {
  mapBackendNodesToFrontend,
  mapBackendEdgesToFrontend,
} from "../../utils/workflowMapper";
import { DocumentsPanel } from "./DocumentsPanel";
import { ReportsPanel } from "./ReportsPanel";

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
  onTabChange?: (tab: "workflow" | "analysis" | "report") => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const Sidebar: React.FC<SidebarProps> = ({
  isChatExpanded,
  onToggleChat,
  onTabChange,
}) => {
  const { theme } = useTheme();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const {
    loadWorkflow,
    clearWorkflow,
    setChatHistory,
    setCurrentChatId,
    sidebarRefreshTrigger,
  } = useWorkflow();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // ============================================================================
  // TOAST
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
  // FETCH CHAT HISTORY
  // ============================================================================
  const fetchHistory = useCallback(async () => {
    console.log("🔄 [SIDEBAR] fetchHistory called", {
      isFetching: isFetchingRef.current,
      isHistoryOpen,
    });

    if (isFetchingRef.current) {
      console.log("⏸️ [SIDEBAR] Already fetching, skipping...");
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      console.log("📡 [SIDEBAR] Calling chatService.getChatHistory...");
      const response = await chatService.getChatHistory(100, 0);

      console.log("✅ [SIDEBAR] Chat history response:", response);

      if (response.data && Array.isArray(response.data)) {
        const uniqueChatsMap = new Map<string, ChatItem>();
        response.data.forEach((chat: ChatItem) => {
          if (chat.chat_id && !uniqueChatsMap.has(chat.chat_id)) {
            uniqueChatsMap.set(chat.chat_id, chat);
          }
        });
        const chats = Array.from(uniqueChatsMap.values());
        console.log("📊 [SIDEBAR] Processed chats:", chats.length);
        setChatItems(chats);
      } else {
        console.warn("⚠️ [SIDEBAR] Invalid response format:", response);
        showToast("Invalid response format", "error");
        setChatItems([]);
      }
    } catch (error: any) {
      console.error("❌ [SIDEBAR] Failed to load history:", error);
      console.error("❌ [SIDEBAR] Error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      showToast("Failed to load history", "error");
      setChatItems([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      console.log("✅ [SIDEBAR] fetchHistory completed");
    }
  }, [showToast]);

  // ============================================================================
  // LOAD CHAT
  // ============================================================================
  const handleChatItemClick = useCallback(
    async (chat_id: string) => {
      if (activeMenuId || editingId) return;
      try {
        showToast("Loading chat...", "success");
        const response = await chatService.getChatDetails(chat_id);
        if (response.data && response.data.chat_id) {
          const chat = response.data;
          setCurrentChatId(chat.chat_id);
          if (chat.messages && Array.isArray(chat.messages)) {
            setChatHistory(chat.messages);
          } else {
            setChatHistory([
              { role: "assistant", content: INITIAL_CHAT_MESSAGE },
            ]);
          }

          let workflow_id = null;
          let latest_report_id = null;

          if (chat.final_report_ids && chat.final_report_ids.length > 0) {
            latest_report_id =
              chat.final_report_ids[chat.final_report_ids.length - 1];
          }
          if (chat.messages) {
            for (let i = chat.messages.length - 1; i >= 0; i--) {
              if (chat.messages[i]?.metadata?.workflow_id) {
                workflow_id = chat.messages[i].metadata.workflow_id;
                break;
              }
            }
          }
          if (!workflow_id && chat.metadata?.workflow_id) {
            workflow_id = chat.metadata.workflow_id;
          }

          if (workflow_id) {
            try {
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
            } catch {
              if (latest_report_id)
                loadWorkflow("New Workflow", [], [], latest_report_id);
            }
          } else if (latest_report_id) {
            loadWorkflow("New Workflow", [], [], latest_report_id);
          }
          setIsHistoryOpen(false);
        }
      } catch {
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

  const handleViewReport = useCallback(
    async (report_id: string) => {
      try {
        const response = await reportService.getReport(report_id);
        const report =
          response.data.report ||
          (response.data.report_id ? response.data : null);

        if (report) {
          loadWorkflow(
            "Report Workflow",
            [],
            [],
            report_id,
            report.download_url || report.report_url,
            report.report_title ? `${report.report_title}.xlsx` : "report.xlsx",
          );
          setIsReportsOpen(false);
          if (onTabChange) onTabChange("report");
          showToast("Viewing report", "success");
        }
      } catch {
        showToast("Failed to load report details", "error");
      }
    },
    [loadWorkflow, onTabChange, showToast],
  );

  // ============================================================================
  // PIN / RENAME / DELETE
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
      } catch {
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

  const toggleMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleNewChat = useCallback(() => {
    clearWorkflow();
    setChatHistory([]);
    setCurrentChatId(null);
    setIsHistoryOpen(false);
  }, [clearWorkflow, setChatHistory, setCurrentChatId]);

  // ============================================================================
  // FILTERED HISTORY
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
    if (isHistoryOpen) fetchHistory();
  }, [isHistoryOpen, fetchHistory]);

  useEffect(() => {
    if (sidebarRefreshTrigger > 0 && isHistoryOpen) fetchHistory();
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
  // ICON BUTTON HELPER — adapts to dark/light
  // ============================================================================
  const iconBtnBase =
    "w-full px-2 py-2.5 flex items-center gap-3 rounded-lg transition-all group hover:bg-black/5 dark:hover:bg-white/5";

  const iconBox = (active: boolean, colors: string) =>
    `w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
      active
        ? colors
        : theme === "light"
          ? "bg-theme-tertiary text-theme-secondary shadow-md border border-theme-primary/50"
          : "bg-theme-tertiary text-theme-primary"
    }`;

  const iconColor = useMemo(() => {
    return theme === "light" ? "text-theme-secondary" : "text-white";
  }, [theme]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      {/* SIDEBAR RAIL */}
      <div
        className={`relative flex flex-col items-start py-4 gap-2 border-r h-full z-50 transition-all duration-300 theme-transition
          bg-theme-secondary border-theme-primary
          ${isSidebarExpanded ? "w-48" : "w-13"}`}
      >
        {/* EXPAND/COLLAPSE BUTTON */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className={`${iconBtnBase} mb-2`}
          title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <div className="w-7 h-7 bg-theme-tertiary text-theme-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all hover:bg-theme-primary">
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${isSidebarExpanded ? "rotate-180" : ""}`}
            />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-bold text-theme-primary whitespace-nowrap">
              Menu
            </span>
          )}
        </button>

        <div className="w-full h-px bg-theme-primary/50 mb-2" />

        {/* NEW CHAT */}
        <button
          onClick={handleNewChat}
          className={iconBtnBase}
          title="New Chat"
        >
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-blue-500/50 transition-all">
            <Plus className="w-4 h-4 text-white" />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-medium text-theme-secondary whitespace-nowrap">
              New Chat
            </span>
          )}
        </button>

        {/* ASK FINIXY AI */}
        <button
          onClick={onToggleChat}
          className={iconBtnBase}
          title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
        >
          <div
            className={iconBox(
              isChatExpanded,
              theme === "light"
                ? "bg-purple-100 border border-purple-200 shadow-sm"
                : "bg-gradient-to-br from-purple-600 to-purple-700 group-hover:from-purple-500 group-hover:to-purple-600 group-hover:shadow-purple-500/50",
            )}
          >
            <MessageSquare
              className={`w-4 h-4 ${isChatExpanded && theme === "light" ? "text-purple-600" : iconColor}`}
            />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-medium text-theme-secondary whitespace-nowrap">
              Ask Finixy AI
            </span>
          )}
        </button>

        {/* HISTORY */}
        <button
          onClick={() => {
            setIsHistoryOpen(!isHistoryOpen);
            setIsDocumentsOpen(false);
          }}
          className={iconBtnBase}
          title="History"
        >
          <div
            className={iconBox(
              isHistoryOpen,
              theme === "light"
                ? "bg-cyan-100 border border-cyan-200 shadow-sm"
                : "bg-gradient-to-br from-cyan-600 to-cyan-700 group-hover:from-cyan-500 group-hover:to-cyan-600 group-hover:shadow-cyan-500/50",
            )}
          >
            <History
              className={`w-4 h-4 ${isHistoryOpen && theme === "light" ? "text-cyan-600" : iconColor}`}
            />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-medium text-theme-secondary whitespace-nowrap">
              History
            </span>
          )}
        </button>

        {/* MY DOCUMENTS */}
        <button
          onClick={() => {
            setIsDocumentsOpen(!isDocumentsOpen);
            setIsHistoryOpen(false);
          }}
          className={iconBtnBase}
          title="My Documents"
        >
          <div
            className={iconBox(
              isDocumentsOpen,
              theme === "light"
                ? "bg-indigo-100 border border-indigo-200 shadow-sm"
                : "bg-gradient-to-br from-indigo-600 to-purple-700 group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:shadow-indigo-500/50",
            )}
          >
            <FolderOpen
              className={`w-4 h-4 ${isDocumentsOpen && theme === "light" ? "text-indigo-600" : iconColor}`}
            />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-medium text-theme-secondary whitespace-nowrap">
              My Documents
            </span>
          )}
        </button>

        {/* MY REPORTS */}
        <button
          onClick={() => {
            setIsReportsOpen(!isReportsOpen);
            setIsDocumentsOpen(false);
            setIsHistoryOpen(false);
          }}
          className={iconBtnBase}
          title="My Reports"
        >
          <div
            className={iconBox(
              isReportsOpen,
              theme === "light"
                ? "bg-emerald-100 border border-emerald-200 shadow-sm"
                : "bg-gradient-to-br from-emerald-600 to-green-700 group-hover:from-emerald-500 group-hover:to-green-600 group-hover:shadow-emerald-500/50",
            )}
          >
            <BarChart3
              className={`w-4 h-4 ${isReportsOpen && theme === "light" ? "text-emerald-600" : iconColor}`}
            />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-medium text-theme-secondary whitespace-nowrap">
              My Reports
            </span>
          )}
        </button>

        {/* SETTINGS */}
        <button className={`${iconBtnBase} mt-auto`}>
          <div className="w-7 h-7 bg-theme-tertiary text-theme-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all">
            <Settings className="w-4 h-4 text-theme-secondary" />
          </div>
          {isSidebarExpanded && (
            <span className="text-sm font-medium text-theme-secondary whitespace-nowrap">
              Settings
            </span>
          )}
        </button>

        {/* HISTORY PANEL */}
        {isHistoryOpen && (
          <div className="absolute left-full top-0 h-full w-80 theme-slide-panel border-r shadow-2xl flex flex-col z-[60]">
            {/* Header */}
            <div className="p-4 border-b border-theme-primary">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-theme-primary text-sm">
                  Chat History
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary p-1.5 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm theme-input border rounded-lg"
                />
              </div>
            </div>

            {/* Chat List */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar"
              ref={menuRef}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 text-theme-tertiary">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-400" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-theme-tertiary text-sm">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No chats found</p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.chat_id}
                    onClick={() => handleChatItemClick(item.chat_id)}
                    className={`group relative flex items-center gap-3 p-3 hover:bg-theme-tertiary rounded-lg cursor-pointer transition-all border ${
                      item.pinned
                        ? "bg-theme-tertiary border-theme-secondary"
                        : "border-transparent hover:border-theme-primary"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.pinned
                          ? "bg-theme-secondary border border-yellow-500 text-yellow-500 shadow-lg"
                          : "bg-theme-tertiary border border-theme-primary text-blue-500"
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
                          className="w-full text-sm font-medium theme-input border rounded-lg px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-theme-primary truncate">
                            {item.session_title}
                          </p>
                          <p className="text-[10px] text-theme-tertiary mt-0.5">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleMenu(e, item.chat_id)}
                      className="p-1.5 rounded-lg hover:bg-theme-tertiary text-theme-tertiary hover:text-theme-primary"
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${activeMenuId === item.chat_id ? "rotate-90" : ""}`}
                      />
                    </button>
                    {activeMenuId === item.chat_id && (
                      <div className="absolute right-0 top-full mt-1 w-36 theme-modal rounded-lg shadow-xl border z-[70] py-1">
                        <button
                          onClick={(e) => handlePin(e, item.chat_id)}
                          className="w-full text-left px-3 py-2 text-xs text-theme-secondary hover:bg-theme-tertiary flex items-center gap-2"
                        >
                          <Pin className="w-3 h-3" />
                          {item.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={(e) =>
                            startRename(e, item.chat_id, item.session_title)
                          }
                          className="w-full text-left px-3 py-2 text-xs text-theme-secondary hover:bg-theme-tertiary flex items-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                        <div className="h-px bg-theme-primary my-1" />
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

        {/* DOCUMENTS PANEL */}
        {isDocumentsOpen && (
          <DocumentsPanel onClose={() => setIsDocumentsOpen(false)} />
        )}

        {/* REPORTS PANEL */}
        {isReportsOpen && (
          <ReportsPanel
            onClose={() => setIsReportsOpen(false)}
            onViewReport={handleViewReport}
          />
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
          <div className="theme-modal border rounded-lg shadow-2xl w-96 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 border-2 border-red-500/40">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-theme-primary mb-2">
                Delete Chat?
              </h3>
              <p className="text-sm text-theme-secondary mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-lg text-sm font-medium transition-all border border-theme-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
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
                : "bg-theme-secondary border-theme-primary"
            }`}
          >
            {toast.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <span className="text-sm font-medium text-theme-primary">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};
