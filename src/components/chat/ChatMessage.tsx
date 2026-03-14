import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Eye, FileText } from "lucide-react";
import { ExtendedChatMessage } from "./types";

interface ChatMessageProps {
  message: ExtendedChatMessage;
  index: number;
  onViewOriginalFile: (
    fileUrl: string,
    fileType: string,
    documentId?: string,
  ) => void;
  onViewParsedData: (documentId: string) => void;
  onViewReport: (reportUrl: string, fileName: string) => void;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message: msg,
  index: i,
  onViewOriginalFile,
  onViewParsedData,
  onViewReport,
}) => {
  const isFileUpload =
    (msg.fileName || msg.content.includes("📎 Uploading:")) &&
    msg.content.includes("Uploading:");

  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in-up`}
      style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}
    >
      {isFileUpload ? (
        <div
          onClick={() => {
            if (msg.documentId) {
              onViewOriginalFile(
                msg.fileUrl || "",
                msg.fileType || "application/pdf",
                msg.documentId,
              );
            }
          }}
          className={`max-w-[85%] rounded-xl p-3 bg-gray-800/90 dark:bg-gray-900/90 border border-gray-700/50 shadow-lg flex items-center gap-3 transition-all ${
            msg.documentId
              ? "cursor-pointer hover:bg-gray-700/90 hover:border-gray-600/50"
              : ""
          }`}
        >
          <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-base font-medium truncate">
              {msg.fileName || msg.content.replace("📎 Uploading: ", "")}
            </div>
            <div className="text-gray-400 text-xs font-medium uppercase">
              {msg.fileType?.split("/")[1] || "PDF"}
            </div>
          </div>
        </div>
      ) : (
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
                  onViewOriginalFile(
                    msg.fileUrl || "",
                    msg.fileType || "application/pdf",
                    msg.documentId,
                  )
                }
                className="flex items-center gap-2 px-2 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Get Original
              </button>
              <button
                onClick={() => onViewParsedData(msg.documentId!)}
                className="flex items-center gap-2 px-2 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> Parsed Preview
              </button>
            </div>
          )}

          {msg.reportUrl && msg.role === "assistant" && (
            <div className="mt-4 pt-3 border-t border-theme-primary flex justify-end">
              <button
                onClick={() =>
                  onViewReport(
                    msg.reportUrl!,
                    msg.reportFileName || "report.xlsx",
                  )
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 text-sm font-bold rounded-lg border border-green-500/30 transition-all"
              >
                <FileText className="w-4 h-4" />
                View Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
