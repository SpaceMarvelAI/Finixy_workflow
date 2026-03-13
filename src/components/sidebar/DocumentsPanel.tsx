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
  ChevronDown,
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
  customer_name?: string;
  company_name?: string;
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
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  if (
    fileType?.includes("image") ||
    ["jpg", "jpeg", "png", "webp"].includes(ext)
  )
    return <FileImage className="w-4 h-4 text-blue-500" />;
  if (fileType?.includes("pdf") || ext === "pdf")
    return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-theme-tertiary" />;
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
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "processing":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "failed":
    case "error":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ onClose }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const normalizeDoc = (raw: any): DocumentItem => {
    const id =
      raw.id || raw.document_id || raw.doc_id || raw._id || raw.uuid || "";
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
    const file_size = raw.file_size || raw.fileSize || raw.size || 0;
    const uploaded_at =
      raw.uploaded_at ||
      raw.upload_date ||
      raw.created_at ||
      raw.createdAt ||
      raw.date ||
      "";
    const status =
      raw.status || raw.processing_status || raw.document_status || "ready";
    const canonical = raw.canonical_data || {};
    const vendor_name =
      raw.vendor_name ||
      raw.vendor ||
      canonical.vendor?.name ||
      canonical.extracted_fields?.vendor_name ||
      "";
    const customer_name =
      raw.customer_name ||
      raw.customer ||
      canonical.customer?.name ||
      canonical.extracted_fields?.customer_name ||
      "";
    const company_name =
      raw.company_name ||
      raw.company ||
      canonical.company?.name ||
      canonical.extracted_fields?.company_name ||
      "";
    const category = raw.category || raw.document_type || raw.doc_type || "";
    return {
      id,
      file_name,
      file_type,
      file_size,
      uploaded_at,
      status,
      vendor_name,
      customer_name,
      company_name,
      category,
      canonical_data: raw.canonical_data,
    };
  };

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentService.getAllDocuments();
      const data = res.data;
      const rawDocs: any[] = Array.isArray(data)
        ? data
        : data.documents || data.data || data.items || data.results || [];
      setDocuments(rawDocs.map(normalizeDoc));
    } catch {
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
      return;
    }
    setLoadingPreviewId(doc.id);
    try {
      const res = await documentService.getDocument(doc.id);
      const docObj =
        res.data?.document ||
        res.data?.data ||
        (res.data?.id || res.data?.document_id ? res.data : null);
      if (docObj) {
        setPreviewData({
          ...docObj,
          id: docObj.id || docObj.document_id || doc.id,
        });
      } else {
        showToast("Could not load parsed data", "error");
      }
    } catch (e: any) {
      showToast(
        `Error: ${e?.response?.data?.detail || e?.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const triggerBlobDownload = (
    data: any,
    contentType: string,
    fileName: string,
  ) => {
    const blob = new Blob([data], {
      type: contentType || "application/octet-stream",
    });
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
    try {
      try {
        const detailRes = await documentService.getDocument(doc.id);
        const docDetail =
          detailRes.data?.document ||
          detailRes.data?.data ||
          (detailRes.data?.id || detailRes.data?.document_id
            ? detailRes.data
            : null);
        const s3Url =
          docDetail?.file_url ||
          docDetail?.fileUrl ||
          docDetail?.s3_url ||
          docDetail?.download_url;
        if (s3Url && s3Url.startsWith("http")) {
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
      } catch {
        /* fall through */
      }

      try {
        const res = await documentService.downloadFile(doc.id);
        triggerBlobDownload(res.data, res.headers?.["content-type"], fileName);
        showToast("Download started!");
        return;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status !== 404 && status !== 405) throw e;
      }

      const res = await documentService.downloadFileAlt(doc.id);
      triggerBlobDownload(res.data, res.headers?.["content-type"], fileName);
      showToast("Download started!");
    } catch (e: any) {
      showToast(
        `Download failed: ${e?.response?.data?.detail || e?.message || "Unknown error"}`,
        "error",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      showToast("Cannot delete: document ID is missing", "error");
      return;
    }
    setDeletingId(id);
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast("Document deleted successfully!");
    } catch (e: any) {
      showToast(
        `Delete failed: ${e?.response?.data?.detail || e?.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.category?.toLowerCase().includes(search.toLowerCase());

    const matchesCompany =
      selectedCompany === "all" ||
      d.company_name?.toLowerCase() === selectedCompany.toLowerCase();

    const matchesType =
      selectedType === "all" ||
      d.category?.toLowerCase().includes(selectedType.toLowerCase());

    return matchesSearch && matchesCompany && matchesType;
  });

  // Get unique company names for dropdown
  const companies = Array.from(
    new Set(
      documents
        .map((d) => d.company_name)
        .filter((name) => name && name.trim() !== ""),
    ),
  ).sort();

  return (
    <>
      <div
        className="absolute left-full top-0 h-full theme-slide-panel border-r shadow-2xl flex flex-col z-[40]"
        style={{ width: "70vw" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-theme-primary flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-theme-tertiary text-theme-primary rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="w-4 h-4 text-theme-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-theme-primary text-sm">
                  My Documents
                </h3>
                <p className="text-[10px] text-theme-tertiary">
                  {documents.length} file{documents.length !== 1 ? "s" : ""}{" "}
                  uploaded
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Company Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 theme-input border rounded-lg text-xs font-medium text-theme-primary cursor-pointer hover:border-blue-500 transition-all"
                >
                  <option value="all">All Companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-tertiary pointer-events-none" />
              </div>
              {/* Type Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 theme-input border rounded-lg text-xs font-medium text-theme-primary cursor-pointer hover:border-blue-500 transition-all"
                >
                  <option value="all">All</option>
                  <option value="sales">Sales</option>
                  <option value="purchase">Purchase</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-tertiary pointer-events-none" />
              </div>
              <button
                onClick={fetchDocuments}
                title="Refresh"
                className="p-1.5 rounded-lg text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary transition-all"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, vendors..."
              className="w-full pl-9 pr-3 py-2 theme-input border rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-theme-tertiary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading documents...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-theme-tertiary">
              <FileText className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                {search
                  ? "No documents match your search"
                  : "No documents uploaded yet"}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 theme-table-head border-b z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[5%]">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[30%]">
                    File Name
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[20%]">
                    Category
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[15%]">
                    Uploaded
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[10%]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest w-[20%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-primary">
                {filtered.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className="theme-table-row transition-colors group"
                  >
                    <td className="px-3 py-3 text-theme-tertiary font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(doc.file_type, doc.file_name)}
                        <span
                          className="text-theme-primary font-medium truncate max-w-[200px]"
                          title={doc.file_name}
                        >
                          {doc.file_name || `Document ${idx + 1}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="text-theme-secondary truncate block max-w-[150px] capitalize"
                        title={doc.category}
                      >
                        {doc.category || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-theme-secondary">
                      {formatDate(doc.uploaded_at)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(doc.status)}`}
                      >
                        {doc.status || "ready"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download Original"
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleViewParsed(doc)}
                          title="View & Edit Parsed Data"
                          disabled={loadingPreviewId === doc.id}
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-purple-500 hover:bg-purple-500/10 transition-all disabled:opacity-50"
                        >
                          {loadingPreviewId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          title="Delete"
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
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
        <div className="px-4 py-2.5 border-t border-theme-primary flex-shrink-0">
          <p className="text-[10px] text-theme-tertiary">
            Showing {filtered.length} of {documents.length} documents
          </p>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
          <div className="theme-modal border rounded-lg shadow-2xl w-80 p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center border-2 border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-primary mb-1">
                  Delete Document?
                </h3>
                <p className="text-xs text-theme-secondary">
                  This will permanently delete the file. This action cannot be
                  undone.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-lg text-sm font-medium border border-theme-primary transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={!!deletingId}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-medium shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
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
              if (res.data.status === "success")
                setPreviewData(res.data.document);
            }
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[95]">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-sm font-medium text-white ${
              toast.type === "error"
                ? "bg-red-700 border-red-600"
                : "bg-theme-secondary border-theme-primary"
            }`}
          >
            {toast.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-red-300" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
};
