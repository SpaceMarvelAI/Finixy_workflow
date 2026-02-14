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
import { mapBackendNodesToFrontend } from "../utils/workflowMapper";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { OriginalFilePreviewModal } from "./OriginalFilePreviewModal";

// Extend type to track document IDs for the "View" button
interface ExtendedChatMessage extends ChatMessage {
  documentId?: string;
  fileUrl?: string; // For original file preview
  fileType?: string; // For determining preview type
}

export const ChatPanel: React.FC = () => {
  const { config, updateConfig, sessionId, chatHistory } = useWorkflow();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Safe initialization from storage to prevent "White Screen" crashes
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
  
  // Fix: Use the same type as sessionId (string | number | null)
  const prevSessionIdRef = useRef<string | number | null>(sessionId);

  // Auto-scroll and Persistence
  useEffect(() => {
    sessionStorage.setItem("finixy_chat_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, uploading]);

  // CRITICAL: Reset chat when sessionId changes (new workflow started)
  useEffect(() => {
    // Convert both to strings for comparison to handle type differences
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

  // Sync with chatHistory from context
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  // --- 1. View Parsed Data Logic ---
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

  // --- 2. View Original File Logic ---
  const handleViewOriginalFile = (fileUrl: string, fileType: string) => {
    console.log("Opening original file:", { fileUrl, fileType });
    setOriginalFileData({ url: fileUrl, type: fileType });
  };

  // --- 3. File Upload Logic ---
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
          fileUrl: file_url || URL.createObjectURL(file), // Use API URL or create local URL
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

  // --- 4. Message Send Logic ---
  const handleSend = async () => {
    if (!input.trim() || loading || uploading) return;
    const query = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setLoading(true);
    try {
      const response = await chatService.sendQuery(query);
      console.log("Chat response:", response.data);
      const { workflow } = response.data;
      if (workflow?.nodes) {
        const safeNodes = mapBackendNodesToFrontend(workflow.nodes, workflow.name || "", workflow.report_type || "");
        updateConfig({ ...config, nodes: safeNodes });
      }
      setMessages(prev => [...prev, { role: "assistant", content: "AI has updated your workflow based on your request." }]);
    } catch (e) {
      console.error("Send error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ System connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-white">
      {/* HEADER */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
        <h2 className="text-lg font-bold">Finixy Workflow Assistant</h2>
      </div>
      
      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">    
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>
              {/* Type-safe Markdown Wrapper */}
              <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(msg.content)}
                </ReactMarkdown>
              </div>

              {msg.documentId && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                  {/* Original File Preview Button */}
                  {msg.fileUrl && (
                    <button 
                      onClick={() => handleViewOriginalFile(msg.fileUrl!, msg.fileType || 'application/pdf')} 
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition-all shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" /> Preview
                    </button>
                  )}
                  
                  {/* Parsed Data Preview Button */}
                  <button 
                    onClick={() => handleViewParsedData(msg.documentId!)} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition-all shadow-sm"
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
            <div className="bg-white border border-gray-200 p-3 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-gray-500">Working...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} /> 
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 items-center">
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
            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === "Enter" && handleSend()} 
            placeholder="Upload an invoice or type a query..." 
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all" 
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || loading || uploading} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
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
    </div>
  );
};