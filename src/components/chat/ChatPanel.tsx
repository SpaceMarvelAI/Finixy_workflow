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
          content:
            typeof m.content === "string" ? m.content : "Analysis complete.",
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

    if (
      currentSession &&
      currentSession !== previousSession &&
      previousSession !== undefined
    ) {
      console.log("New session detected, resetting chat", {
        currentSession,
        previousSession,
      });
      setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
      setParsedPreviewData(null);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      console.log("🔍 RAW CHAT HISTORY:", JSON.stringify(chatHistory, null, 2));

      // Transform messages to include document metadata from message.metadata
      const transformedMessages = chatHistory.map((msg: any, index: number) => {
        const transformed: ExtendedChatMessage = {
          role: msg.role,
          content: msg.content,
        };

        // If message has metadata with document info, add it to the message
        if (msg.metadata) {
          console.log(`📦 Message ${index} metadata:`, msg.metadata);

          // Document ID - check multiple possible field names
          if (msg.metadata.document_id) {
            transformed.documentId = msg.metadata.document_id;
          } else if (msg.metadata.documentId) {
            transformed.documentId = msg.metadata.documentId;
          }

          // File URL - IMPORTANT: Check for S3 key first, then fallback to URL
          // S3 keys are permanent, presigned URLs expire after 1 hour
          if (msg.metadata.s3_key || msg.metadata.s3Key) {
            // Store S3 key - we'll fetch fresh presigned URL when viewing
            const s3Key = msg.metadata.s3_key || msg.metadata.s3Key;
            console.log(`✅ Found S3 key for message ${index}:`, s3Key);
            // We'll use document_id to fetch fresh URL when needed
            transformed.fileUrl = ""; // Empty - will fetch fresh URL on demand
          } else if (msg.metadata.file_url) {
            transformed.fileUrl = msg.metadata.file_url;
            console.log(
              `✅ Found file_url for message ${index}:`,
              msg.metadata.file_url,
            );
          } else if (msg.metadata.fileUrl) {
            transformed.fileUrl = msg.metadata.fileUrl;
            console.log(
              `✅ Found fileUrl for message ${index}:`,
              msg.metadata.fileUrl,
            );
          } else {
            console.warn(
              `⚠️ No file_url or s3_key found for message ${index} with documentId:`,
              transformed.documentId,
            );
          }

          // File Type - check multiple possible field names
          if (msg.metadata.file_type) {
            transformed.fileType = msg.metadata.file_type;
          } else if (msg.metadata.fileType) {
            transformed.fileType = msg.metadata.fileType;
          }

          // Report URL - check multiple possible field names
          if (msg.metadata.report_url) {
            transformed.reportUrl = msg.metadata.report_url;
          } else if (msg.metadata.reportUrl) {
            transformed.reportUrl = msg.metadata.reportUrl;
          }

          // Report File Name - check multiple possible field names
          if (msg.metadata.report_file_name) {
            transformed.reportFileName = msg.metadata.report_file_name;
          } else if (msg.metadata.reportFileName) {
            transformed.reportFileName = msg.metadata.reportFileName;
          }

          console.log(`✅ Transformed message ${index}:`, transformed);
        }

        return transformed;
      });

      console.log("📝 FINAL transformed messages:", transformedMessages);
      setMessages(transformedMessages);
    }
  }, [chatHistory]);

  const handleViewParsedData = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      console.log("📄 Fetching parsed data for document:", documentId);
      const response = await documentService.getDocument(documentId);
      console.log("📦 API Response:", response.data);

      if (response.data.status === "success" && response.data.document) {
        console.log("✅ Parsed Preview Data:", response.data.document);
        setParsedPreviewData(response.data.document);
      } else {
        console.error("❌ Invalid response format:", response.data);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Unable to load parsed data. The document may still be processing.",
          },
        ]);
      }
    } catch (e: any) {
      console.error("❌ Error loading document:", e);
      const errorMsg = e.response?.data?.detail || e.message || "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error loading parsed data: ${errorMsg}`,
        },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewOriginalFile = async (
    fileUrl: string,
    fileType: string,
    documentId?: string,
  ) => {
    if (!documentId && !fileUrl) {
      console.error("❌ No file URL or document ID provided");
      return;
    }

    console.log("📥 Initiating download:", { fileUrl, fileType, documentId });
    setLoadingPreview(true);

    try {
      let finalDownloadUrl = fileUrl;
      let fileName = "document";

      // 1. If we have a documentId, try to get the details (especially S3 presigned URL)
      if (documentId) {
        try {
          const response = await documentService.getDocument(documentId);
          if (response.data.status === "success" && response.data.document) {
            const doc = response.data.document;
            // Use presigned S3 URL if available
            finalDownloadUrl = doc.file_url || doc.s3_url || doc.url || finalDownloadUrl;
            fileName = doc.file_name || fileName;
          }
        } catch (err) {
          console.warn("Could not fetch document details, falling back to proxy download", err);
        }
      }

      // 2. Determine if we should use axios blob download (for proxy) or direct link (for S3)
      const isProxyUrl = finalDownloadUrl && (finalDownloadUrl.includes("/api/v1/documents/") || !finalDownloadUrl);
      
      if (documentId && (isProxyUrl || !finalDownloadUrl)) {
        console.log("🛠️ Using authenticated blob download via API proxy");
        const response = await documentService.downloadFile(documentId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName.includes('.') ? fileName : `${fileName}.${fileType.split('/')[1] || 'pdf'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (finalDownloadUrl) {
        console.log("🚀 Using direct S3/File URL for download");
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
      console.error("❌ Download failed:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Failed to download file";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error downloading file: ${errorMsg}. If the link expired, please refresh or re-upload.`,
        },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const uploadMessage = {
      role: "user" as const,
      content: `📎 Uploading: ${file.name}`,
    };
    setMessages((prev) => [...prev, uploadMessage]);

    try {
      // ALWAYS pass the current chat_id so the backend attaches the document to this session
      const response = await documentService.upload(
        file,
        currentChatId || undefined,
      );
      console.log("Upload response:", response.data);

      if (response.data.status === "success") {
        const {
          document_id,
          extracted_data,
          file_url: backendFileUrl,
          s3_key,
          category,
          party,
          chat_id: backendChatId,
        } = response.data;

        // CRITICAL: If we already have an active chat, NEVER switch to a new one.
        // Only use the backend's chat_id when this is the very first message.
        const activeChatId = currentChatId || backendChatId;

        if (!currentChatId && backendChatId) {
          // This is a brand-new session — adopt the backend's chat_id and refresh sidebar
          console.log("💬 New chat started from file upload, chat_id:", backendChatId);
          setCurrentChatId(backendChatId);
          setTimeout(() => {
            console.log("🔄 Triggering sidebar refresh for new chat");
            refreshSidebar();
          }, 500);
        } else if (currentChatId && backendChatId && backendChatId !== currentChatId) {
          // Backend returned a DIFFERENT chat_id — this is the bug. Ignore it and stay in current chat.
          console.warn(
            "⚠️ Backend returned a different chat_id for file upload. Staying in current chat.",
            { currentChatId, backendChatId }
          );
        } else {
          console.log("✅ Continuing existing chat after upload:", activeChatId);
        }

        let fileUrlToUse = backendFileUrl;

        if (!fileUrlToUse && document_id) {
          try {
            console.log("📥 Fetching S3 presigned URL for new upload...");
            const docDetailsRes = await documentService.getDocument(document_id);
            if (docDetailsRes.data.status === "success" && docDetailsRes.data.document) {
              fileUrlToUse = docDetailsRes.data.document.file_url || docDetailsRes.data.document.fileUrl;
              console.log("✅ Got S3 presigned URL:", fileUrlToUse);
            }
          } catch (fetchErr) {
            console.warn("⚠️ Failed to fetch S3 URL, fallback to blob:", fetchErr);
            fileUrlToUse = URL.createObjectURL(file);
          }
        } else if (!fileUrlToUse) {
          fileUrlToUse = URL.createObjectURL(file);
        }

        const vendor =
          extracted_data?.vendor_name ||
          party?.vendor_name ||
          "Detected Vendor";

        const successMessage = {
          role: "assistant" as const,
          content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n**Category:** ${category || "Unknown"}\n\nItemized financial records are now ready for review.`,
          documentId: document_id,
          fileUrl: fileUrlToUse,
          fileType: file.type,
        };

        setMessages((prev) => [...prev, successMessage]);

        // Save messages to backend — always use the ACTIVE chat (not the backend's new one)
        if (activeChatId) {
          try {
            console.log("💾 Saving upload messages to chat:", activeChatId);

            await chatService.addMessage(
              activeChatId,
              "user",
              uploadMessage.content,
            );

            await chatService.addMessage(
              activeChatId,
              "assistant",
              successMessage.content,
              {
                document_id,
                s3_key: s3_key || undefined,
                file_url: fileUrlToUse || undefined,
                file_type: file.type,
                vendor,
                category,
              },
            );

            console.log("✅ Upload messages saved to chat history");
          } catch (saveError) {
            console.error("❌ Error saving messages to chat:", saveError);
          }
        } else {
          console.log("⚠️ No chat_id available, messages not persisted to backend");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
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

    console.log("📤 Sending query with chat_id:", currentChatId);

    try {
      const response = await chatService.sendQuery(
        query,
        currentChatId || undefined,
      );
      console.log("=== WORKFLOW RESPONSE ===");
      console.log("Full response:", response.data);

      const { workflow, report, chat_id } = response.data;

      // IMPORTANT: Always update chat_id if backend returns one
      // This ensures we continue the same conversation
      if (chat_id) {
        if (chat_id !== currentChatId) {
          console.log("💬 Updating chat_id:", {
            old: currentChatId,
            new: chat_id,
          });
          setCurrentChatId(chat_id);

          // Only trigger sidebar refresh if this is a NEW chat
          if (!currentChatId) {
            setTimeout(() => {
              console.log("🔄 Triggering sidebar refresh for new chat");
              refreshSidebar();
            }, 500);
          }
        } else {
          console.log("✅ Continuing existing chat:", chat_id);
        }
      } else {
        console.warn("⚠️ Backend did not return chat_id");
      }

      // Extract report ID and URL
      let reportId = null;
      let reportDownloadUrl = null;
      let reportFilePath = null;

      if (report) {
        reportId = report.report_id || report.id;
        reportDownloadUrl = report.download_url || report.downloadUrl;
        reportFilePath = report.file_path || report.filePath;

        console.log("📊 Report found:");
        console.log("  - Report ID:", reportId);
        console.log("  - Download URL:", reportDownloadUrl);
        console.log("  - File Path:", reportFilePath);
      }

      if (!reportDownloadUrl && workflow?.output_file_path) {
        reportFilePath = workflow.output_file_path;
        const fileName = reportFilePath.split("/").pop();
        reportDownloadUrl = `http://localhost:8000/api/v1/reports/download/${fileName}`;
      }

      const reportFileName = reportFilePath
        ? reportFilePath.split("/").pop()
        : "report.xlsx";

      // Check if workflow exists and has nodes
      console.log("🔍 Checking workflow structure:");
      console.log("  - workflow exists:", !!workflow);
      console.log("  - workflow.nodes:", workflow?.nodes);
      console.log(
        "  - workflow.workflow_definition:",
        workflow?.workflow_definition,
      );

      if (workflow) {
        // Try to get nodes from multiple possible locations
        let rawNodes =
          workflow.nodes || workflow.workflow_definition?.nodes || [];
        let rawEdges =
          workflow.edges || workflow.workflow_definition?.edges || [];

        console.log("📦 Raw nodes:", rawNodes);
        console.log("📦 Raw edges:", rawEdges);

        if (rawNodes && rawNodes.length > 0) {
          const safeNodes = mapBackendNodesToFrontend(
            rawNodes,
            workflow.name || "",
            workflow.report_type || "",
          );

          const mappedEdges = mapBackendEdgesToFrontend(
            rawEdges || [],
            safeNodes,
          );

          const safeEdges = mappedEdges.filter(
            (edge): edge is NonNullable<typeof edge> => edge !== null,
          );

          console.log("✅ Mapped nodes:", safeNodes.length);
          console.log("✅ Mapped edges:", safeEdges.length);
          console.log("✅ Safe nodes:", safeNodes);

          updateConfig({
            ...config,
            name: workflow.name || config.name,
            nodes: safeNodes,
            edges: safeEdges,
            reportId: reportId,
            reportUrl: reportDownloadUrl,
            reportFileName: reportFileName,
          });

          console.log("💾 Config updated with workflow");
        } else {
          console.warn("⚠️ No nodes found in workflow response");
        }
      } else {
        console.warn("⚠️ No workflow in response");
      }

      const hasReport = reportDownloadUrl && reportFilePath;

      let assistantMessage =
        "✅ **Workflow Created Successfully**\n\nYour workflow has been generated and is ready to execute.";

      if (hasReport) {
        assistantMessage = `✅ **Report Generated Successfully**\n\n📊 **Report** is ready for review.\n\nSwitch to the Report tab to view the interactive dashboard.`;

        setTimeout(() => {
          if (onSwitchToReport && reportDownloadUrl) {
            onSwitchToReport(reportDownloadUrl, reportFileName);
          }
        }, 1500);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage,
          reportUrl: reportDownloadUrl,
          reportFileName: reportFileName,
        },
      ]);
    } catch (e) {
      console.error("Send error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ System connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportUrl: string, fileName: string) => {
    if (onSwitchToReport) {
      onSwitchToReport(reportUrl, fileName);
    }
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* CHAT MESSAGES - Reduced horizontal padding */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-4 bg-black/50 backdrop-blur-sm custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in-up`}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationFillMode: "both",
            }}
          >
            <div
              className={`max-w-[92%] rounded-lg p-4 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] break-words overflow-hidden ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-500/50 shadow-blue-500/20"
                  : "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-100 rounded-bl-none"
              }`}
            >
              <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-invert overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(msg.content)}
                </ReactMarkdown>
              </div>

              {msg.documentId && (
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      handleViewOriginalFile(
                        msg.fileUrl || "",
                        msg.fileType || "application/pdf",
                        msg.documentId,
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Original
                  </button>

                  <button
                    onClick={() => handleViewParsedData(msg.documentId!)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/20"
                  >
                    <Eye className="w-3.5 h-3.5" /> Parsed Preview
                  </button>
                </div>
              )}

              {msg.reportUrl && msg.role === "assistant" && (
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end">
                  <button
                    onClick={() =>
                      handleViewReport(
                        msg.reportUrl!,
                        msg.reportFileName || "report.xlsx",
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 text-sm font-bold rounded-lg border border-green-500/30 transition-all shadow-lg hover:shadow-green-500/20"
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
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-lg flex items-center gap-3 shadow-xl">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-gray-300">
                {uploading
                  ? "Uploading..."
                  : loading
                    ? "Generating workflow..."
                    : "Loading..."}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-gray-800 bg-gradient-to-r from-gray-900 to-black backdrop-blur-md">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your query here..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-100 placeholder-gray-500 shadow-lg"
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Upload Invoice
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          if (parsedPreviewData?.id) {
            handleViewParsedData(parsedPreviewData.id);
          }
        }}
      />



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
