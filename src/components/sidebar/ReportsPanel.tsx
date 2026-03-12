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

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ onClose, onViewReport }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleRename = async (id: string) => {
    if (!editValue.trim()) return;
    try {
      await reportService.updateReport(id, { report_title: editValue.trim() });
      setReports((prev) =>
        prev.map((r) => (r.report_id === id ? { ...r, report_title: editValue.trim() } : r))
      );
      setEditingId(null);
      showToast("Report renamed successfully!");
    } catch {
      showToast("Failed to rename report", "error");
    }
  };


  const filtered = reports.filter(
    (r) =>
      r.report_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.report_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div
        className="absolute left-full top-0 h-full theme-slide-panel border-r shadow-2xl flex flex-col z-[60]"
        style={{ width: "650px" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-theme-primary flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-theme-tertiary text-theme-primary rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-theme-primary text-sm">Finixy Reports</h3>
                <p className="text-[10px] text-theme-tertiary">
                  {reports.length} report{reports.length !== 1 ? "s" : ""} generated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchReports}
                title="Refresh"
                className="p-1.5 rounded-lg text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
                {search ? "No reports match your search" : "No reports generated yet"}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 theme-table-head border-b z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Report Title</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-24">Type</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-32">Generated</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-primary">
                {filtered.map((report) => (
                  <tr key={report.report_id} className="theme-table-row transition-colors group">
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
                              if (e.key === "Enter") handleRename(report.report_id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button onClick={() => handleRename(report.report_id)} className="text-emerald-500">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-red-500">
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
                            onClick={() => { setEditingId(report.report_id); setEditValue(report.report_title); }}
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
                          onClick={() => report.download_url && window.open(report.download_url, "_blank")}
                          title="Download Excel"
                          disabled={!report.download_url}
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-30"
                        >
                          <Download className="w-3.5 h-3.5" />
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
              toast.type === "error" ? "bg-red-700 border-red-600" : "bg-theme-secondary border-theme-primary"
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
