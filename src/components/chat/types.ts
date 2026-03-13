import { ChatMessage } from "@/types/index";

export interface ExtendedChatMessage extends ChatMessage {
  documentId?: string;
  fileUrl?: string;
  fileType?: string;
  reportUrl?: string;
  reportFileName?: string;
  fileName?: string;
}
