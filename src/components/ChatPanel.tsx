import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, Loader2, Paperclip, Eye, FileText
} from "lucide-react";
import { ChatMessage } from "@/types/index";
import { useWorkflow } from "../store/WorkflowContext"; 
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
import { chatService, documentService } from "../services/api";
import { mapBackendNodesToFrontend, mapBackendEdgesToFrontend } from "../utils/workflowMapper";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { OriginalFilePreviewModal } from "./OriginalFilePreviewModal";

interface ExtendedChatMessage extends ChatMessage {
  documentId?: string;
  fileUrl?: string;
  fileType?: string;
}

interface ChatPanelProps {
  isExpanded: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isExpanded }) => {
  const { config, updateConfig, sessionId, chatHistory } = useWorkflow();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [messages, setMessages] = useState<ExtendedChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("finixy_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          content: typeof m.content === 'string' ? m.content : "Analysis complete."
        }));
      }
    } catch (e) {
      console.error("Storage load failed:", e);
    }
    return [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
  });
  
  const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);
  const [originalFileData, setOriginalFileData] = useState<{ url: string; type: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevSessionIdRef = useRef<string | number | null>(sessionId);

  useEffect(() => {
    sessionStorage.setItem("finixy_chat_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, uploading]);

  useEffect(() => {
    const currentSession = sessionId?.toString();
    const previousSession = prevSessionIdRef.current?.toString();
    
    if (currentSession && currentSession !== previousSession && previousSession !== undefined) {
      console.log("New session detected, resetting chat", { currentSession, previousSession });
      setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
      setParsedPreviewData(null);
      setOriginalFileData(null);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  const handleViewParsedData = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      const response = await documentService.getDocument(documentId);
      console.log("API Response:", response.data);
      if (response.data.status === "success") {
        console.log("Parsed Preview Data:", response.data.document);
        setParsedPreviewData(response.data.document);
      }
    } catch (e) {
      console.error("Error loading document:", e);
      alert("Error loading parsed data.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewOriginalFile = (fileUrl: string, fileType: string) => {
    console.log("Opening original file:", { fileUrl, fileType });
    setOriginalFileData({ url: fileUrl, type: fileType });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessages(prev => [...prev, { role: "user", content: `📎 Uploading: ${file.name}` }]);

    try {
      const response = await documentService.upload(file);
      console.log("Upload response:", response.data);
      if (response.data.status === "success") {
        const { document_id, extracted_data, file_url } = response.data;
        const vendor = extracted_data?.vendor_name || "Detected Vendor";
        
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n\nItemized financial records are now ready for review.`,
          documentId: document_id,
          fileUrl: file_url || URL.createObjectURL(file),
          fileType: file.type
        }]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Error processing document." }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ FIXED: Now generates edges and updates config properly
  const handleSend = async () => {
    if (!input.trim() || loading || uploading) return;
    const query = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setLoading(true);
    
    try {
      const response = await chatService.sendQuery(query);
      console.log("=== WORKFLOW RESPONSE ===");
      console.log("Full response:", response.data);
      
      const { workflow } = response.data;
      
      if (workflow?.nodes) {
        // 1. Map nodes from backend
        const safeNodes = mapBackendNodesToFrontend(
          workflow.nodes, 
          workflow.name || "", 
          workflow.report_type || ""
        );

        console.log("Mapped nodes:", safeNodes);
        console.log("Node count:", safeNodes.length);

        // 2. Generate edges (connections between nodes)
        const mappedEdges = mapBackendEdgesToFrontend(
          workflow.edges || [],
          safeNodes
        );

        // ✅ FIX: Filter out any null edges
        const safeEdges = mappedEdges.filter((edge): edge is NonNullable<typeof edge> => edge !== null);

        console.log("Generated edges:", safeEdges);
        console.log("Edge count:", safeEdges.length);

        // 3. ✅ CRITICAL: Update config with BOTH nodes AND edges
        updateConfig({ 
          ...config, 
          name: workflow.name || config.name,
          nodes: safeNodes,
          edges: safeEdges  // Now properly typed!
        });

        console.log("=== CONFIG UPDATED ===");
        console.log("Nodes:", safeNodes.length);
        console.log("Edges:", safeEdges.length);
      }
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "AI has updated your workflow based on your request." 
      }]);
    } catch (e) {
      console.error("Send error:", e);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "⚠️ System connection error." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything when collapsed
  if (!isExpanded) {
    return null;
  }

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
      
      {/* CHAT MESSAGES - Full height with custom scrollbar */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/50 backdrop-blur-sm custom-scrollbar">    
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in-up`}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] ${
              msg.role === "user" 
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-500/50 shadow-blue-500/20" 
                : "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-100 rounded-bl-none"
            }`}>
              <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(msg.content)}
                </ReactMarkdown>
              </div>

              {msg.documentId && (
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end gap-2">
                  {msg.fileUrl && (
                    <button 
                      onClick={() => handleViewOriginalFile(msg.fileUrl!, msg.fileType || 'application/pdf')} 
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/20"
                    >
                      <FileText className="w-3.5 h-3.5" /> Preview
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleViewParsedData(msg.documentId!)} 
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/20"
                  >
                    <Eye className="w-3.5 h-3.5" /> Parsed Preview
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(loading || uploading || loadingPreview) && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-2xl flex items-center gap-3 shadow-xl">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-gray-300">Processing...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} /> 
      </div>

      {/* INPUT AREA - Two rows: input on top, buttons below */}
      <div className="p-2 border-t border-gray-800 bg-gradient-to-r from-gray-900 to-black backdrop-blur-md">
        <div className="flex flex-col gap-3">
          {/* Top Row: Input Field */}
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === "Enter" && handleSend()} 
            placeholder="Type your query here..." 
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-100 placeholder-gray-500 shadow-lg" 
          />
          
          {/* Bottom Row: File Upload & Send Button */}
          <div className="flex gap-3 items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.csv,.xlsx" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading} 
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Upload Invoice
            </button>
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || loading || uploading} 
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Query
            </button>
          </div>
        </div>
      </div>

      {/* PARSED DATA MODAL */}
      <DocumentPreviewModal 
        previewData={parsedPreviewData}
        onClose={() => setParsedPreviewData(null)}
      />

      {/* ORIGINAL FILE MODAL */}
      <OriginalFilePreviewModal 
        fileData={originalFileData}
        onClose={() => setOriginalFileData(null)}
      />
      
      {/* Add custom scrollbar styles */}
      <style>{`
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.5s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60a5fa, #3b82f6);
        }
      `}</style>
    </div>
  );
};