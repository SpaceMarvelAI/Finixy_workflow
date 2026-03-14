import { ExtendedChatMessage } from "./types";

export const transformChatHistory = (chatHistory: any[]): ExtendedChatMessage[] => {
  return chatHistory.map((msg: any) => {
    const transformed: ExtendedChatMessage = {
      role: msg.role,
      content: msg.content,
    };

    // Extract fileName from upload messages
    if (msg.content && msg.content.includes("📎 Uploading:")) {
      const fileNameMatch = msg.content.match(/📎 Uploading: (.+)/);
      if (fileNameMatch) {
        transformed.fileName = fileNameMatch[1];
      }
    }

    if (msg.metadata) {
      transformed.documentId = msg.metadata.document_id || msg.metadata.documentId;
      
      if (msg.metadata.s3_key || msg.metadata.s3Key) {
        transformed.fileUrl = "";
      } else {
        transformed.fileUrl = msg.metadata.file_url || msg.metadata.fileUrl;
      }

      transformed.fileType = msg.metadata.file_type || msg.metadata.fileType;
      transformed.reportUrl = msg.metadata.report_url || msg.metadata.reportUrl;
      transformed.reportFileName = msg.metadata.report_file_name || msg.metadata.reportFileName;
    }
    return transformed;
  });
};

export const loadMessagesFromStorage = (): ExtendedChatMessage[] => {
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
  return [];
};

export const saveMessagesToStorage = (messages: ExtendedChatMessage[]) => {
  sessionStorage.setItem("finixy_chat_messages", JSON.stringify(messages));
};
