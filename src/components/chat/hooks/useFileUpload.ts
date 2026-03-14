import { useState } from "react";
import { documentService, chatService } from "../../../services/api";
import { ExtendedChatMessage } from "../types";

export const useFileUpload = (
  currentChatId: string | null,
  setCurrentChatId: (id: string) => void,
  refreshSidebar: () => void,
  setMessages: React.Dispatch<React.SetStateAction<ExtendedChatMessage[]>>,
) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const uploadMessage: ExtendedChatMessage = {
      role: "user",
      content: `📎 Uploading: ${file.name}`,
      fileType: file.type,
      fileName: file.name,
    };
    setMessages((prev) => [...prev, uploadMessage]);

    try {
      const response = await documentService.upload(file, currentChatId || undefined);
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
              fileUrlToUse =
                docDetailsRes.data.document.file_url || docDetailsRes.data.document.fileUrl;
            }
          } catch {
            fileUrlToUse = URL.createObjectURL(file);
          }
        } else if (!fileUrlToUse) {
          fileUrlToUse = URL.createObjectURL(file);
        }

        const vendor = extracted_data?.vendor_name || party?.vendor_name || "Detected Vendor";

        // Update the upload message with documentId and fileUrl
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === prev.length - 1 && m.content.includes(`📎 Uploading: ${file.name}`)
              ? { ...m, documentId: document_id, fileUrl: fileUrlToUse }
              : m,
          ),
        );

        const successMessage: ExtendedChatMessage = {
          role: "assistant",
          content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n**Category:** ${category || "Unknown"}\n\nItemized financial records are now ready for review.`,
          documentId: document_id,
          fileUrl: fileUrlToUse,
          fileType: file.type,
        };
        setMessages((prev) => [...prev, successMessage]);

        if (activeChatId) {
          try {
            await chatService.addMessage(activeChatId, "user", uploadMessage.content, {
              document_id,
              file_url: fileUrlToUse || undefined,
              file_type: file.type,
            });
            await chatService.addMessage(activeChatId, "assistant", successMessage.content, {
              document_id,
              s3_key: s3_key || undefined,
              file_url: fileUrlToUse || undefined,
              file_type: file.type,
              vendor,
              category,
            });
          } catch {
            /* non-fatal */
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error processing document." },
      ]);
    } finally {
      setUploading(false);
    }
  };

  return { uploading, handleFileUpload };
};
