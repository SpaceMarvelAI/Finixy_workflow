import { useState } from "react";
import { documentService } from "../../../services/api";
import { ExtendedChatMessage } from "../types";

export const useDocumentActions = (
  setMessages: React.Dispatch<React.SetStateAction<ExtendedChatMessage[]>>,
) => {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);

  const handleViewParsedData = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      const response = await documentService.getDocument(documentId);
      if (response.data.status === "success" && response.data.document) {
        setParsedPreviewData(response.data.document);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Unable to load parsed data. The document may still be processing.",
          },
        ]);
      }
    } catch (e: any) {
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
        } catch {
          /* fall through */
        }
      }
      const isProxyUrl =
        finalDownloadUrl &&
        (finalDownloadUrl.includes("/api/v1/documents/") || !finalDownloadUrl);
      if (documentId && (isProxyUrl || !finalDownloadUrl)) {
        const response = await documentService.downloadFile(documentId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          fileName.includes(".") ? fileName : `${fileName}.${fileType.split("/")[1] || "pdf"}`,
        );
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
        {
          role: "assistant",
          content: `⚠️ Error downloading file: ${errorMsg}. If the link expired, please refresh or re-upload.`,
        },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  return {
    loadingPreview,
    parsedPreviewData,
    setParsedPreviewData,
    handleViewParsedData,
    handleViewOriginalFile,
  };
};
