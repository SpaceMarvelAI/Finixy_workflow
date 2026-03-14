import React, { useState, useEffect, useRef } from "react";
import { useWorkflow } from "../../store/WorkflowContext";
import { INITIAL_CHAT_MESSAGE } from "../../utils/constants";
import { DocumentPreviewModal } from "../modals/DocumentPreviewModal";
import { ChatMessageComponent } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { LoadingIndicator } from "./LoadingIndicator";
import { ExtendedChatMessage } from "./types";
import {
  transformChatHistory,
  loadMessagesFromStorage,
  saveMessagesToStorage,
} from "./chatUtils";
import { useFileUpload } from "./hooks/useFileUpload";
import { useChatQuery } from "./hooks/useChatQuery";
import { useDocumentActions } from "./hooks/useDocumentActions";

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
  const [messages, setMessages] = useState<ExtendedChatMessage[]>(() => {
    const loaded = loadMessagesFromStorage();
    return loaded.length > 0
      ? loaded
      : [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevSessionIdRef = useRef<string | number | null>(sessionId);

  const { uploading, handleFileUpload } = useFileUpload(
    currentChatId,
    setCurrentChatId,
    refreshSidebar,
    setMessages,
  );

  const { loading, handleSend } = useChatQuery(
    currentChatId,
    setCurrentChatId,
    refreshSidebar,
    setMessages,
    config,
    updateConfig,
    onSwitchToReport,
  );

  const {
    loadingPreview,
    parsedPreviewData,
    setParsedPreviewData,
    handleViewParsedData,
    handleViewOriginalFile,
  } = useDocumentActions(setMessages);

  useEffect(() => {
    saveMessagesToStorage(messages);
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
      setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
      setParsedPreviewData(null);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(transformChatHistory(chatHistory));
    }
  }, [chatHistory]);

  const handleViewReport = (reportUrl: string, fileName: string) => {
    if (onSwitchToReport) onSwitchToReport(reportUrl, fileName);
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onSendClick = () => {
    if (input.trim()) {
      handleSend(input);
      setInput("");
    }
  };

  if (!isExpanded) return null;

  return (
    <div className="h-full flex flex-col relative bg-theme-primary theme-transition">
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <ChatMessageComponent
            key={i}
            message={msg}
            index={i}
            onViewOriginalFile={handleViewOriginalFile}
            onViewParsedData={handleViewParsedData}
            onViewReport={handleViewReport}
          />
        ))}

        <LoadingIndicator
          loading={loading}
          uploading={uploading}
          loadingPreview={loadingPreview}
        />
        <div ref={chatEndRef} />
      </div>

      <ChatInput
        input={input}
        loading={loading}
        uploading={uploading}
        onInputChange={setInput}
        onSend={onSendClick}
        onFileUpload={onFileInputChange}
      />

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
