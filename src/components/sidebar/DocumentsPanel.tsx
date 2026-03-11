import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Search,
  FileSpreadsheet,
  FileImage,
  File,
} from "lucide-react";
import { documentService } from "../../services/api";
import { DocumentPreviewModal } from "../modals/DocumentPreviewModal";

interface DocumentItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  status: string;
  vendor_name?: string;
  category?: string;
  grand_total?: number;
  currency?: string;
  canonical_data?: any;
}

interface DocumentsPanelProps {
  onClose: () => void;
}

const getFileIcon = (fileType: string, fileName: string) => {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  if (fileType?.includes("spreadsheet") || ext === "xlsx" || ext === "xls")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  if (fileType?.includes("image") || ["jpg", "jpeg", "png", "webp"].includes(ext))
    return <FileImage className="w-4 h-4 text-blue-400" />;
  if (fileType?.includes("pdf") || ext === "pdf")
    return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-gray-400" />;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "processed":
    case "success":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "processing":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "failed":
    case "error":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ onClose }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Normalize raw API response into consistent shape
  // The all-document-data-by-user-id endpoint may use different field names
  const normalizeDoc = (raw: any): DocumentItem => {
    const id =
      raw.id ||
      raw.document_id ||
      raw.doc_id ||
      raw._id ||
      raw.uuid ||
      "";
    const file_name =
      raw.file_name ||
      raw.filename ||
      raw.original_filename ||
      raw.originalFilename ||
      raw.file ||
      raw.name ||
      "";
    const file_type =
      raw.file_type ||
      raw.fileType ||
      raw.mime_type ||
      raw.mimeType ||
      raw.content_type ||
      "";
    const file_size =
      raw.file_size ||
      raw.fileSize ||
      raw.size ||
      0;
    const uploaded_at =
      raw.uploaded_at ||
      raw.upload_date ||
      raw.created_at ||
      raw.createdAt ||
      raw.date ||
      "";
    const status =
      raw.status ||
      raw.processing_status ||
      raw.document_status ||
      "ready";
    // Vendor may be at top level OR inside canonical_data
    const canonical = raw.canonical_data || {};
    const vendor_name =
      raw.vendor_name ||
      raw.vendor ||
      canonical.vendor?.name ||
      canonical.extracted_fields?.vendor_name ||
      "";
    const category =
      raw.category ||
      raw.document_type ||
      raw.doc_type ||
      "";

    return { id, file_name, file_type, file_size, uploaded_at, status, vendor_name, category, canonical_data: raw.canonical_data };
  };

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentService.getAllDocuments();
      const data = res.data;
      console.log("📄 Raw documents API response:", JSON.stringify(data, null, 2));

      // API may return array directly or wrapped in a key
      const rawDocs: any[] = Array.isArray(data)
        ? data
        : data.documents || data.data || data.items || data.results || [];

      if (rawDocs.length > 0) {
        console.log("📄 First raw doc fields:", Object.keys(rawDocs[0]));
      }

      const docs = rawDocs.map(normalizeDoc);
      console.log("✅ Normalized docs:", docs.map(d => ({ id: d.id, file_name: d.file_name })));
      setDocuments(docs);
    } catch (e: any) {
      console.error("Failed to fetch documents:", e);
      showToast("Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleViewParsed = async (doc: DocumentItem) => {
    if (!doc.id) {
      showToast("Cannot load parsed data: document ID is missing", "error");
      console.error("❌ Missing document ID for:", doc);
      return;
    }
    setLoadingPreviewId(doc.id);
    try {
      console.log("👁️ Fetching parsed data for document:", doc.id);
      const res = await documentService.getDocument(doc.id);
      console.log("📦 getDocument response:", res.data);

      // Handle multiple possible response shapes
      const docObj =
        res.data?.document ||    // {status: "success", document: {...}}
        res.data?.data ||        // {data: {...}}
        (res.data?.id || res.data?.document_id ? res.data : null); // direct object

      if (docObj) {
        // Ensure the object has a usable .id property
        const normalizedPreview = {
          ...docObj,
          id: docObj.id || docObj.document_id || doc.id,
        };
        setPreviewData(normalizedPreview);
      } else {
        console.error("❌ Unexpected getDocument response shape:", res.data);
        showToast("Could not load parsed data", "error");
      }
    } catch (e: any) {
      console.error("❌ Error loading parsed data:", e);
      showToast(`Error: ${e?.response?.data?.detail || e?.message || "Unknown error"}`, "error");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const triggerBlobDownload = (data: any, contentType: string, fileName: string) => {
    const blob = new Blob([data], { type: contentType || "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (doc: DocumentItem) => {
    if (!doc.id) {
      showToast("Cannot download: document ID is missing", "error");
      return;
    }
    const fileName = doc.file_name || `document_${doc.id}`;
    console.log("⬇️ Starting download for:", doc.id, fileName);

    try {
      // Step 1: Try to get S3 presigned URL from document metadata
      try {
        const detailRes = await documentService.getDocument(doc.id);
        const docDetail =
          detailRes.data?.document ||
          detailRes.data?.data ||
          (detailRes.data?.id || detailRes.data?.document_id ? detailRes.data : null);

        const s3Url = docDetail?.file_url || docDetail?.fileUrl || docDetail?.s3_url || docDetail?.download_url;
        if (s3Url && s3Url.startsWith("http")) {
          console.log("✅ Downloading via S3 presigned URL:", s3Url);
          const link = document.createElement("a");
          link.href = s3Url;
          link.setAttribute("download", fileName);
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          link.remove();
          showToast("Download started!");
          return;
        }
      } catch (e) {
        console.warn("⚠️ Could not fetch S3 URL, trying direct download...");
      }

      // Step 2: Try primary endpoint /documents/{id}/download
      try {
        console.log("⬇️ Trying primary endpoint: /documents/" + doc.id + "/download");
        const res = await documentService.downloadFile(doc.id);
        triggerBlobDownload(res.data, res.headers?.["content-type"], fileName);
        showToast("Download started!");
        return;
      } catch (e: any) {
        const status = e?.response?.status;
        console.warn(`⚠️ Primary download endpoint returned ${status}, trying fallback...`);
        if (status !== 404 && status !== 405) throw e; // only fallback on 404/405
      }

      // Step 3: Final fallback — /documents/download/{id}
      console.log("⬇️ Trying fallback endpoint: /documents/download/" + doc.id);
      const res = await documentService.downloadFileAlt(doc.id);
      triggerBlobDownload(res.data, res.headers?.["content-type"], fileName);
      showToast("Download started!");

    } catch (e: any) {
      console.error("❌ All download strategies failed:", e);
      showToast(`Download failed: ${e?.response?.data?.detail || e?.message || "Unknown error"}`, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      showToast("Cannot delete: document ID is missing", "error");
      return;
    }
    setDeletingId(id);
    try {
      console.log("🗑️ Deleting document:", id);
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast("Document deleted successfully!");
    } catch (e: any) {
      console.error("❌ Delete failed:", e);
      showToast(`Delete failed: ${e?.response?.data?.detail || e?.message || "Unknown error"}`, "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filtered = documents.filter((d) =>
    d.file_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="absolute left-full top-0 h-full bg-gradient-to-br from-gray-900 to-black border-r border-gray-800 shadow-2xl flex flex-col z-[60]"
        style={{ width: "720px" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-100 text-sm">My Documents</h3>
                <p className="text-[10px] text-gray-500">{documents.length} file{documents.length !== 1 ? "s" : ""} uploaded</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDocuments}
                title="Refresh"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, vendors..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-500 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading documents...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-600">
              <FileText className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                {search ? "No documents match your search" : "No documents uploaded yet"}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-10">#</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">File Name</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-28">Vendor</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-20">Size</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-24">Uploaded</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-20">Status</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-800/40 transition-colors group"
                  >
                    {/* SR No */}
                    <td className="px-3 py-3 text-gray-600 font-mono">
                      {idx + 1}
                    </td>

                    {/* File Name */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(doc.file_type, doc.file_name)}
                        <span className="text-gray-200 font-medium truncate max-w-[160px]" title={doc.file_name}>
                          {doc.file_name || `Document ${idx + 1}`}
                        </span>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="px-3 py-3">
                      <span className="text-gray-400 truncate block max-w-[100px]" title={doc.vendor_name}>
                        {doc.vendor_name || "-"}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="px-3 py-3 text-gray-500 font-mono">
                      {formatBytes(doc.file_size)}
                    </td>

                    {/* Upload Date */}
                    <td className="px-3 py-3 text-gray-400">
                      {formatDate(doc.uploaded_at)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(doc.status)}`}>
                        {doc.status || "ready"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Download */}
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download Original"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Parsed Data */}
                        <button
                          onClick={() => handleViewParsed(doc)}
                          title="View & Edit Parsed Data"
                          disabled={loadingPreviewId === doc.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-50"
                        >
                          {loadingPreviewId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          title="Delete"
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-800 flex-shrink-0">
          <p className="text-[10px] text-gray-600">
            Showing {filtered.length} of {documents.length} documents
          </p>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg shadow-2xl w-80 p-6 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center border-2 border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-100 mb-1">Delete Document?</h3>
                <p className="text-xs text-gray-400">
                  This will permanently delete the file from storage and S3. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium border border-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={!!deletingId}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-medium shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deletingId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Data Modal */}
      {previewData && (
        <DocumentPreviewModal
          previewData={previewData}
          onClose={() => setPreviewData(null)}
          onRefresh={async () => {
            if (previewData?.id) {
              const res = await documentService.getDocument(previewData.id);
              if (res.data.status === "success") setPreviewData(res.data.document);
            }
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-sm font-medium text-white animate-in slide-in-from-bottom-4 ${
            toast.type === "error"
              ? "bg-red-700 border-red-600"
              : "bg-gray-800 border-gray-700"
          }`}>
            {toast.type === "error"
              ? <AlertTriangle className="w-4 h-4 text-red-300" />
              : <CheckCircle className="w-4 h-4 text-emerald-400" />
            }
            {toast.msg}
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
      `}</style>
    </>
  );
};
