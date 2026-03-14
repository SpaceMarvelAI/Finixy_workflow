import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  ChevronDown,
  Landmark,
  Download,
  Trash2,
} from "lucide-react";

interface BankStatementItem {
  id: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  company_name?: string;
  bank_name?: string;
  period?: string;
}

interface BankStatementsPanelProps {
  onClose: () => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSize = (bytes: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const years = Array.from({ length: 2050 - 1995 + 1 }, (_, i) =>
  (2050 - i).toString(),
);

export const BankStatementsPanel: React.FC<BankStatementsPanelProps> = ({
  onClose,
}) => {
  const [statements, setStatements] = useState<BankStatementItem[]>([]);
  const [loading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".pdf", ".csv", ".xlsx", ".xls"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      showToast("Only PDF, CSV, XLSX, XLS files are allowed", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    // Simulate upload — replace with real API call when backend is ready
    await new Promise((res) => setTimeout(res, 1200));
    const newItem: BankStatementItem = {
      id: `bs-${Date.now()}`,
      file_name: file.name,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
      company_name: "",
      bank_name: "",
      period: "",
    };
    setStatements((prev) => [newItem, ...prev]);
    showToast(`"${file.name}" uploaded successfully`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    // Simulate delete — replace with real API call when backend is ready
    await new Promise((res) => setTimeout(res, 600));
    setStatements((prev) => prev.filter((s) => s.id !== id));
    showToast("Statement deleted");
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const companies = Array.from(
    new Set(statements.map((s) => s.company_name).filter(Boolean)),
  ).sort() as string[];

  const filtered = statements.filter((s) => {
    const matchSearch =
      s.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.bank_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.company_name?.toLowerCase().includes(search.toLowerCase());

    const matchCompany =
      selectedCompany === "all" ||
      s.company_name?.toLowerCase() === selectedCompany.toLowerCase();

    let matchDate = true;
    if (s.uploaded_at) {
      const d = new Date(s.uploaded_at);
      if (selectedYear !== "all" && d.getFullYear().toString() !== selectedYear)
        matchDate = false;
      else if (
        selectedMonth !== "all" &&
        (d.getMonth() + 1).toString() !== selectedMonth
      )
        matchDate = false;
    }

    return matchSearch && matchCompany && matchDate;
  });

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
              <div className="w-8 h-8 bg-theme-tertiary rounded-lg flex items-center justify-center shadow-lg">
                <Landmark className="w-4 h-4 text-theme-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-theme-primary text-sm">
                  Bank Statements
                </h3>
                <p className="text-[10px] text-theme-tertiary">
                  {statements.length} file{statements.length !== 1 ? "s" : ""}{" "}
                  uploaded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.csv,.xlsx,.xls"
              />

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || loading}
                title="Upload Bank Statement"
                className="p-1.5 rounded-lg text-theme-tertiary hover:text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>

              {/* Company filter */}
              <div className="relative">
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 theme-input border rounded text-xs font-medium text-theme-primary cursor-pointer hover:border-blue-500 transition-all"
                >
                  <option value="all">All Companies</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-tertiary pointer-events-none" />
              </div>

              {/* Year filter */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedMonth("all");
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 theme-input border rounded text-xs font-medium text-theme-primary cursor-pointer hover:border-blue-500 transition-all [&::-webkit-scrollbar]:hidden"
                  style={
                    {
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    } as React.CSSProperties
                  }
                >
                  <option value="all">Years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-tertiary pointer-events-none" />
              </div>

              {/* Month filter */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={selectedYear === "all"}
                  className="appearance-none pl-3 pr-8 py-1.5 theme-input border rounded text-xs font-medium text-theme-primary cursor-pointer hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">Months</option>
                  {monthNames.map((m, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-tertiary pointer-events-none" />
              </div>

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
              placeholder="Search by file name, bank, company..."
              className="w-full pl-9 pr-3 py-2 theme-input border rounded text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-theme-tertiary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading statements...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-theme-tertiary">
              <Landmark className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                {search
                  ? "No statements match your search"
                  : "No bank statements uploaded yet"}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Statement
              </button>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 theme-table-head border-b z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[5%]">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[35%]">
                    File Name
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[20%]">
                    Company
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[15%]">
                    Size
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[15%]">
                    Uploaded
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest w-[10%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-primary">
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="theme-table-row transition-colors group"
                  >
                    <td className="px-3 py-3 text-theme-tertiary font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span
                          className="text-theme-primary font-medium truncate max-w-[220px]"
                          title={s.file_name}
                        >
                          {s.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-theme-secondary">
                      {s.company_name || "-"}
                    </td>
                    <td className="px-3 py-3 text-theme-secondary">
                      {formatSize(s.file_size)}
                    </td>
                    <td className="px-3 py-3 text-theme-secondary">
                      {formatDate(s.uploaded_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Download"
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(s.id)}
                          title="Delete"
                          disabled={deletingId === s.id}
                          className="p-1.5 rounded-lg text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          {deletingId === s.id ? (
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
            Showing {filtered.length} of {statements.length} statements
          </p>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
          <div className="theme-modal border rounded shadow-2xl w-80 p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center border-2 border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-primary mb-1">
                  Delete Statement?
                </h3>
                <p className="text-xs text-theme-secondary">
                  This will permanently delete the file. This action cannot be
                  undone.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded text-sm font-medium border border-theme-primary transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={!!deletingId}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[95]">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded shadow-2xl border text-sm font-medium text-white ${toast.type === "error" ? "bg-red-700 border-red-600" : "bg-theme-secondary border-theme-primary"}`}
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
