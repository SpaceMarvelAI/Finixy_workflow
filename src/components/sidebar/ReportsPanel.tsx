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
  Search,
  BarChart3,
  Edit2,
  Save,
} from "lucide-react";
import { reportService } from "../../services/api";

interface ReportItem {
  report_id: string;
  report_title: string;
  report_type: string;
  status: string;
  generated_at?: string;
  created_at?: string;
  download_url?: string;
}

interface ReportsPanelProps {
  onClose: () => void;
  onViewReport: (reportId: string) => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  onClose,
  onViewReport,
}) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.listReports(100, 0);
      setReports(res.data || []);
    } catch {
      showToast("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRename = async (id: string) => {
    if (!editValue.trim()) return;
    try {
      await reportService.updateReport(id, { report_title: editValue.trim() });
      setReports((prev) =>
        prev.map((r) =>
          r.report_id === id ? { ...r, report_title: editValue.trim() } : r,
        ),
      );
      setEditingId(null);
      showToast("Report renamed successfully!");
    } catch {
      showToast("Failed to rename report", "error");
    }
  };

  const handleDelete = async (id: string) => {
    console.log("🗑️ [DELETE] Starting delete for report:", id);
    setDeleting(true);
    try {
      await reportService.deleteReport(id);
      console.log("✅ [DELETE] Report deleted successfully:", id);
      setReports((prev) => prev.filter((r) => r.report_id !== id));
      setDeleteConfirm(null);
      showToast("Report deleted successfully!");
    } catch (error) {
      console.error("❌ [DELETE] Failed to delete report:", error);
      showToast("Failed to delete report", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadExcel = async (reportId: string, reportTitle: string) => {
    console.log("📥 [DOWNLOAD] Starting Excel download for report:", reportId);
    try {
      // Fetch full report data
      const response = await reportService.getReport(reportId);
      const reportData = response.data;

      console.log("📊 [DOWNLOAD] Full response:", response);
      console.log("📊 [DOWNLOAD] Report data:", reportData);
      console.log(
        "📊 [DOWNLOAD] Report data keys:",
        Object.keys(reportData || {}),
      );
      console.log("📊 [DOWNLOAD] report_data:", reportData?.report_data);
      console.log(
        "📊 [DOWNLOAD] report_data type:",
        typeof reportData?.report_data,
      );
      console.log(
        "📊 [DOWNLOAD] report_data keys:",
        reportData?.report_data ? Object.keys(reportData.report_data) : "N/A",
      );

      if (!reportData?.report_data) {
        console.error("❌ [DOWNLOAD] No report_data found");
        showToast("No data available for download", "error");
        return;
      }

      // Import the Excel generator
      const { generateExcelFromReportData } =
        await import("../../utils/excelGenerator");

      // Extract data and columns from report_data
      let items: any[] = [];
      let columns: any[] = [];

      // Handle different report data structures
      console.log(
        "🔍 [DOWNLOAD] Checking report_data.data:",
        reportData.report_data.data,
      );
      console.log(
        "🔍 [DOWNLOAD] Checking report_data.items:",
        reportData.report_data.items,
      );
      console.log(
        "🔍 [DOWNLOAD] Checking report_data.invoices:",
        reportData.report_data.invoices,
      );
      console.log(
        "🔍 [DOWNLOAD] Checking report_data.records:",
        reportData.report_data.records,
      );
      console.log(
        "🔍 [DOWNLOAD] Is report_data array?:",
        Array.isArray(reportData.report_data),
      );

      if (
        reportData.report_data.data &&
        Array.isArray(reportData.report_data.data)
      ) {
        items = reportData.report_data.data;
        console.log(
          "✅ [DOWNLOAD] Found data in report_data.data:",
          items.length,
        );
      } else if (
        reportData.report_data.items &&
        Array.isArray(reportData.report_data.items)
      ) {
        items = reportData.report_data.items;
        console.log(
          "✅ [DOWNLOAD] Found data in report_data.items:",
          items.length,
        );
      } else if (
        reportData.report_data.invoices &&
        Array.isArray(reportData.report_data.invoices)
      ) {
        items = reportData.report_data.invoices;
        console.log(
          "✅ [DOWNLOAD] Found data in report_data.invoices:",
          items.length,
        );
      } else if (
        reportData.report_data.records &&
        Array.isArray(reportData.report_data.records)
      ) {
        items = reportData.report_data.records;
        console.log(
          "✅ [DOWNLOAD] Found data in report_data.records:",
          items.length,
        );
      } else if (Array.isArray(reportData.report_data)) {
        items = reportData.report_data;
        console.log("✅ [DOWNLOAD] report_data is array:", items.length);
      } else {
        console.warn(
          "⚠️ [DOWNLOAD] Could not find array data, checking all keys...",
        );
        // Try to find any array in report_data
        for (const key of Object.keys(reportData.report_data)) {
          if (
            Array.isArray(reportData.report_data[key]) &&
            reportData.report_data[key].length > 0
          ) {
            items = reportData.report_data[key];
            console.log(
              `✅ [DOWNLOAD] Found data in report_data.${key}:`,
              items.length,
            );
            break;
          }
        }
      }

      if (items.length === 0) {
        console.error("❌ [DOWNLOAD] No items found in report data");
        showToast("No data rows found in report", "error");
        return;
      }

      console.log("📊 [DOWNLOAD] First item sample:", items[0]);

      // Generate columns from first item (filter out ID columns)
      if (items.length > 0) {
        columns = Object.keys(items[0])
          .filter((key) => {
            const keyLower = key.toLowerCase();
            // Filter out any ID columns
            return !keyLower.endsWith("_id") && keyLower !== "id";
          })
          .map((key) => ({
            key,
            label: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase()),
            format:
              key.toLowerCase().includes("amount") ||
              key.toLowerCase().includes("total") ||
              key.toLowerCase().includes("paid") ||
              key.toLowerCase().includes("outstanding")
                ? "currency"
                : key.toLowerCase().includes("date")
                  ? "date"
                  : undefined,
          }));
      }

      // Extract summary if available
      const summary =
        reportData.report_data.summary || reportData.report_meta?.summary;

      console.log("📊 [DOWNLOAD] Generating Excel with:", {
        items: items.length,
        columns: columns.length,
        columnNames: columns.map((c) => c.key),
        summary,
      });

      // Generate Excel
      await generateExcelFromReportData(
        reportTitle || "Report",
        items,
        columns,
        summary,
      );

      console.log("✅ [DOWNLOAD] Excel generated successfully");
      showToast("Excel downloaded successfully!");
    } catch (error) {
      console.error("❌ [DOWNLOAD] Failed to download Excel:", error);
      showToast("Failed to download Excel", "error");
    }
  };

  const filtered = reports.filter(
    (r) =>
      r.report_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.report_type?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div
        className="absolute left-full top-0 h-full theme-slide-panel border-r shadow-2xl flex flex-col z-[60]"
        style={{ width: "70vw" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-theme-primary flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-theme-tertiary text-theme-primary rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-theme-primary text-sm">
                  Finixy Reports
                </h3>
                <p className="text-[10px] text-theme-tertiary">
                  {reports.length} report{reports.length !== 1 ? "s" : ""}{" "}
                  generated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchReports}
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
              placeholder="Search reports by title or type..."
              className="w-full pl-9 pr-3 py-2 theme-input border rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-theme-tertiary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading reports...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-theme-tertiary">
              <BarChart3 className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                {search
                  ? "No reports match your search"
                  : "No reports generated yet"}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 theme-table-head border-b z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[30%]">
                    Report Title
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[20%]">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[25%]">
                    Generated
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest w-[25%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-primary">
                {filtered.map((report) => (
                  <tr
                    key={report.report_id}
                    className="theme-table-row transition-colors group"
                  >
                    <td className="px-3 py-3">
                      {editingId === report.report_id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-theme-tertiary border border-blue-500 rounded px-2 py-1 outline-none text-xs w-full"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleRename(report.report_id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleRename(report.report_id)}
                            className="text-emerald-500"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="text-theme-primary font-medium truncate max-w-[200px]"
                            title={report.report_title}
                          >
                            {report.report_title || "Untitled Report"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(report.report_id);
                              setEditValue(report.report_title);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-theme-tertiary hover:text-blue-500 transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-theme-secondary uppercase text-[10px] font-semibold">
                        {report.report_type || "GENERIC"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-theme-secondary">
                      {formatDate(report.generated_at || report.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewReport(report.report_id)}
                          title="View Dashboard"
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadExcel(
                              report.report_id,
                              report.report_title,
                            )
                          }
                          title="Download Excel"
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(report.report_id)}
                          title="Delete Report"
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            Showing {filtered.length} of {reports.length} reports
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300]">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[400]">
          <div className="theme-card border rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-theme-primary mb-1">
                  Delete Report?
                </h3>
                <p className="text-sm text-theme-tertiary">
                  This action cannot be undone. The report will be permanently
                  deleted from the system.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-theme-primary hover:bg-theme-tertiary transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
