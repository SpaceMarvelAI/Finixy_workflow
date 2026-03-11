import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, Paperclip, Eye, FileText, Download } from "lucide-react";
import { ChatMessage } from "@/types/index";
import { useWorkflow } from "../../store/WorkflowContext";
import { INITIAL_CHAT_MESSAGE } from "../../utils/constants";
import { chatService, documentService } from "../../services/api";
import {
  mapBackendNodesToFrontend,
  mapBackendEdgesToFrontend,
} from "../../utils/workflowMapper";
import { DocumentPreviewModal } from "../modals/DocumentPreviewModal";

interface ExtendedChatMessage extends ChatMessage {
  documentId?: string;
  fileUrl?: string;
  fileType?: string;
  reportUrl?: string;
  reportFileName?: string;
}

interface ChatPanelProps {
  isExpanded: boolean;
  onSwitchToReport?: (reportUrl: string, fileName: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isExpanded,
  onSwitchToReport,
}) => {
  const {
    config,
    updateConfig,
    sessionId,
    chatHistory,
    currentChatId,
    setCurrentChatId,
    refreshSidebar,
  } = useWorkflow();
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
          content: typeof m.content === "string" ? m.content : "Analysis complete.",
        }));
      }
    } catch (e) {
      console.error("Storage load failed:", e);
    }
    return [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
  });

  const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);
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
      setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
      setParsedPreviewData(null);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const transformedMessages = chatHistory.map((msg: any) => {
        const transformed: ExtendedChatMessage = { role: msg.role, content: msg.content };
        if (msg.metadata) {
          if (msg.metadata.document_id) transformed.documentId = msg.metadata.document_id;
          else if (msg.metadata.documentId) transformed.documentId = msg.metadata.documentId;

          if (msg.metadata.s3_key || msg.metadata.s3Key) {
            transformed.fileUrl = "";
          } else if (msg.metadata.file_url) {
            transformed.fileUrl = msg.metadata.file_url;
          } else if (msg.metadata.fileUrl) {
            transformed.fileUrl = msg.metadata.fileUrl;
          }

          if (msg.metadata.file_type) transformed.fileType = msg.metadata.file_type;
          else if (msg.metadata.fileType) transformed.fileType = msg.metadata.fileType;

          if (msg.metadata.report_url) transformed.reportUrl = msg.metadata.report_url;
          else if (msg.metadata.reportUrl) transformed.reportUrl = msg.metadata.reportUrl;

          if (msg.metadata.report_file_name) transformed.reportFileName = msg.metadata.report_file_name;
          else if (msg.metadata.reportFileName) transformed.reportFileName = msg.metadata.reportFileName;
        }
        return transformed;
      });
      setMessages(transformedMessages);
    }
  }, [chatHistory]);

  const handleViewParsedData = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      const response = await documentService.getDocument(documentId);
      if (response.data.status === "success" && response.data.document) {
        setParsedPreviewData(response.data.document);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Unable to load parsed data. The document may still be processing." },
        ]);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || e.message || "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error loading parsed data: ${errorMsg}` },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewOriginalFile = async (fileUrl: string, fileType: string, documentId?: string) => {
    if (!documentId && !fileUrl) return;
    setLoadingPreview(true);
    try {
      let finalDownloadUrl = fileUrl;
      let fileName = "document";
      if (documentId) {
        try {
          const response = await documentService.getDocument(documentId);
          if (response.data.status === "success" && response.data.document) {
            const doc = response.data.document;
            finalDownloadUrl = doc.file_url || doc.s3_url || doc.url || finalDownloadUrl;
            fileName = doc.file_name || fileName;
          }
        } catch { /* fall through */ }
      }
      const isProxyUrl = finalDownloadUrl && (finalDownloadUrl.includes("/api/v1/documents/") || !finalDownloadUrl);
      if (documentId && (isProxyUrl || !finalDownloadUrl)) {
        const response = await documentService.downloadFile(documentId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName.includes(".") ? fileName : `${fileName}.${fileType.split("/")[1] || "pdf"}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (finalDownloadUrl) {
        const link = document.createElement("a");
        link.href = finalDownloadUrl;
        link.target = "_blank";
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        throw new Error("No download URL available");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || "Failed to download file";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error downloading file: ${errorMsg}. If the link expired, please refresh or re-upload.` },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const uploadMessage = { role: "user" as const, content: `📎 Uploading: ${file.name}` };
    setMessages((prev) => [...prev, uploadMessage]);

    try {
      const response = await documentService.upload(file, currentChatId || undefined);
      if (response.data.status === "success") {
        const { document_id, extracted_data, file_url: backendFileUrl, s3_key, category, party, chat_id: backendChatId } = response.data;
        const activeChatId = currentChatId || backendChatId;
        if (!currentChatId && backendChatId) {
          setCurrentChatId(backendChatId);
          setTimeout(() => refreshSidebar(), 500);
        }

        let fileUrlToUse = backendFileUrl;
        if (!fileUrlToUse && document_id) {
          try {
            const docDetailsRes = await documentService.getDocument(document_id);
            if (docDetailsRes.data.status === "success" && docDetailsRes.data.document) {
              fileUrlToUse = docDetailsRes.data.document.file_url || docDetailsRes.data.document.fileUrl;
            }
          } catch {
            fileUrlToUse = URL.createObjectURL(file);
          }
        } else if (!fileUrlToUse) {
          fileUrlToUse = URL.createObjectURL(file);
        }

        const vendor = extracted_data?.vendor_name || party?.vendor_name || "Detected Vendor";
        const successMessage = {
          role: "assistant" as const,
          content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n**Category:** ${category || "Unknown"}\n\nItemized financial records are now ready for review.`,
          documentId: document_id,
          fileUrl: fileUrlToUse,
          fileType: file.type,
        };
        setMessages((prev) => [...prev, successMessage]);

        if (activeChatId) {
          try {
            await chatService.addMessage(activeChatId, "user", uploadMessage.content);
            await chatService.addMessage(activeChatId, "assistant", successMessage.content, {
              document_id,
              s3_key: s3_key || undefined,
              file_url: fileUrlToUse || undefined,
              file_type: file.type,
              vendor,
              category,
            });
          } catch { /* non-fatal */ }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error processing document." },
      ]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || uploading) return;
    const query = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const response = await chatService.sendQuery(query, currentChatId || undefined);
      const { workflow, report, chat_id } = response.data;

      if (chat_id && chat_id !== currentChatId) {
        setCurrentChatId(chat_id);
        if (!currentChatId) setTimeout(() => refreshSidebar(), 500);
      }

      let reportId = null;
      let reportDownloadUrl = null;
      let reportFilePath = null;

      if (report) {
        reportId = report.report_id || report.id;
        reportDownloadUrl = report.download_url || report.downloadUrl;
        reportFilePath = report.file_path || report.filePath;
      }
      if (!reportDownloadUrl && workflow?.output_file_path) {
        reportFilePath = workflow.output_file_path;
        const fileName = reportFilePath.split("/").pop();
        reportDownloadUrl = `http://localhost:8000/api/v1/reports/download/${fileName}`;
      }
      const reportFileName = reportFilePath ? reportFilePath.split("/").pop() : "report.xlsx";

      if (workflow) {
        let rawNodes = workflow.nodes || workflow.workflow_definition?.nodes || [];
        let rawEdges = workflow.edges || workflow.workflow_definition?.edges || [];
        if (rawNodes && rawNodes.length > 0) {
          const safeNodes = mapBackendNodesToFrontend(rawNodes, workflow.name || "", workflow.report_type || "");
          const mappedEdges = mapBackendEdgesToFrontend(rawEdges || [], safeNodes);
          const safeEdges = mappedEdges.filter((edge): edge is NonNullable<typeof edge> => edge !== null);
          updateConfig({ ...config, name: workflow.name || config.name, nodes: safeNodes, edges: safeEdges, reportId, reportUrl: reportDownloadUrl, reportFileName });
        }
      }

      const hasReport = reportDownloadUrl && reportFilePath;
      let assistantMessage = "✅ **Workflow Created Successfully**\n\nYour workflow has been generated and is ready to execute.";
      if (hasReport) {
        assistantMessage = `✅ **Report Generated Successfully**\n\n📊 **Report** is ready for review.\n\nSwitch to the Report tab to view the interactive dashboard.`;
        setTimeout(() => {
          if (onSwitchToReport && reportDownloadUrl) onSwitchToReport(reportDownloadUrl, reportFileName);
        }, 1500);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage, reportUrl: reportDownloadUrl, reportFileName },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ System connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportUrl: string, fileName: string) => {
    if (onSwitchToReport) onSwitchToReport(reportUrl, fileName);
  };

  if (!isExpanded) return null;

  return (
    <div className="h-full flex flex-col relative bg-theme-primary theme-transition">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in-up`}
            style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}
          >
            <div
              className={`max-w-[92%] rounded-lg p-4 shadow-lg transition-all hover:scale-[1.01] break-words overflow-hidden ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-500/50"
                  : "theme-bubble-assistant border rounded-bl-none"
              }`}
            >
              <div className="text-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:font-semibold overflow-hidden text-theme-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(msg.content)}
                </ReactMarkdown>
              </div>

              {msg.documentId && (
                <div className="mt-4 pt-3 border-t border-theme-primary flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      handleViewOriginalFile(msg.fileUrl || "", msg.fileType || "application/pdf", msg.documentId)
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Original
                  </button>
                  <button
                    onClick={() => handleViewParsedData(msg.documentId!)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> Parsed Preview
                  </button>
                </div>
              )}

              {msg.reportUrl && msg.role === "assistant" && (
                <div className="mt-4 pt-3 border-t border-theme-primary flex justify-end">
                  <button
                    onClick={() => handleViewReport(msg.reportUrl!, msg.reportFileName || "report.xlsx")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 text-sm font-bold rounded-lg border border-green-500/30 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    View Report
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {(loading || uploading || loadingPreview) && (
          <div className="flex justify-start animate-pulse">
            <div className="theme-bubble-assistant border p-4 rounded-lg flex items-center gap-3 shadow-md">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-theme-secondary">
                {uploading ? "Uploading..." : loading ? "Generating workflow..." : "Loading..."}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-theme-primary bg-theme-secondary theme-transition">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your query here..."
            className="w-full px-4 py-3 theme-input border rounded-lg text-sm shadow-sm"
            disabled={loading || uploading}
          />
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
              disabled={uploading || loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Upload Invoice
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Processing..." : "Send Query"}
            </button>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        previewData={parsedPreviewData}
        onClose={() => setParsedPreviewData(null)}
        onRefresh={() => {
          if (parsedPreviewData?.id) handleViewParsedData(parsedPreviewData.id);
        }}
      />

      <style>{`
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-up { animation: slide-in-up 0.5s ease-out; }
      `}</style>
    </div>
  );
};
