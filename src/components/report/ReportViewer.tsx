import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Loader2,
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
  Edit2,
  Save,
  X,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { useWorkflow } from "../../store/WorkflowContext";
import { reportService, chatService } from "../../services/api";

interface ReportViewerProps {
  reportId?: string | null;
  reportUrl?: string | null;
  reportFileName?: string;
  onGoBack?: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportId: propReportId,
  reportUrl: propReportUrl,
  reportFileName: propReportFileName,
  onGoBack,
}) => {
  const { config, currentChatId, updateConfig } = useWorkflow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMeta, setReportMeta] = useState<any>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [savingRow, setSavingRow] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Row editing state
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<any>(null);

  const reportId = propReportId || config.reportId;
  const reportUrl = propReportUrl || config.reportUrl;
  const reportFileName =
    propReportFileName || config.reportFileName || "report.xlsx";

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (reportId) {
      loadReportData(reportId as string);
    } else if (currentChatId) {
      fetchLatestReportForChat(currentChatId);
    }
  }, [reportId, currentChatId]);

  const fetchLatestReportForChat = async (chatId: string) => {
    setLoading(true);
    try {
      const response = await chatService.getChatDetails(chatId);
      const chat = response.data;

      if (chat.final_report_ids && chat.final_report_ids.length > 0) {
        const latestReportId =
          chat.final_report_ids[chat.final_report_ids.length - 1];
        const repResponse = await reportService.getReport(latestReportId);
        const report =
          repResponse.data.report ||
          (repResponse.data.report_id ? repResponse.data : null);

        if (report) {
          updateConfig({
            ...config,
            reportId: latestReportId,
            reportUrl:
              report.download_url ||
              report.report_url ||
              `http://localhost:8000/api/v1/reports/download/${latestReportId}`,
            reportFileName: report.report_title
              ? `${report.report_title}.xlsx`
              : "report.xlsx",
          });
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch chat reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async (specificReportId?: string) => {
    const idToLoad = specificReportId || reportId;
    if (!idToLoad) return;

    setLoading(true);
    setError(null);

    try {
      const response = await reportService.getReport(idToLoad);
      const report =
        response.data.report ||
        (response.data.report_id ? response.data : null);

      if (report) {
        setReportMeta({
          report_id: report.report_id,
          report_type: report.report_type,
          report_title:
            report.report_title || report.name || "Financial Report",
          generated_at: report.generated_at || report.created_at,
          status: report.status,
        });

        let finalReportData = null;
        if (report.report_data?.final_report) {
          finalReportData = report.report_data.final_report;
        } else if (report.report_data) {
          finalReportData = report.report_data;
        } else if (report.final_report) {
          finalReportData = report.final_report;
        }

        if (finalReportData) {
          setReportData(finalReportData);
        } else {
          setError("Report data not available");
        }
      } else {
        setError("Invalid report response");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Failed to load report",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!reportId || !newTitle.trim()) return;
    setLoading(true);
    try {
      await reportService.updateReport(reportId as string, {
        report_title: newTitle.trim(),
      });
      setReportMeta((prev: any) => ({
        ...prev,
        report_title: newTitle.trim(),
      }));
      setIsRenaming(false);
      showToast("Report renamed successfully!");
    } catch (err: any) {
      showToast(
        err.response?.data?.detail || "Failed to rename report",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (reportUrl) {
      window.open(reportUrl, "_blank");
      return;
    }

    if (reportData) {
      try {
        const items = getItems();
        if (Array.isArray(items) && items.length > 0) {
          const { generateExcelFromReportData } =
            await import("../../utils/excelGenerator");
          const columns = Object.keys(items[0]).map((key) => ({
            key,
            label: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          }));
          await generateExcelFromReportData(
            reportMeta?.report_title || "Report",
            items,
            columns,
          );
        } else {
          alert("No tabular data available to export.");
        }
      } catch (err) {
        console.error("Excel generation failed:", err);
        alert("Failed to generate Excel file.");
      }
    }
  };

  /** Helper to extract the array of items from reportData */
  const getItems = (): any[] => {
    if (!reportData) return [];
    if (Array.isArray(reportData)) return reportData;
    if (reportData.invoices) return reportData.invoices;
    if (reportData.data) return reportData.data;
    if (reportData.records) return reportData.records;
    const arrayKey = Object.keys(reportData).find((k) =>
      Array.isArray(reportData[k]),
    );
    if (arrayKey) return reportData[arrayKey];
    return [];
  };

  /** Build updated full reportData with the new items array */
  const buildUpdatedReportData = (newItems: any[]): any => {
    if (Array.isArray(reportData)) return newItems;
    if (reportData.invoices) return { ...reportData, invoices: newItems };
    if (reportData.data) return { ...reportData, data: newItems };
    if (reportData.records) return { ...reportData, records: newItems };
    const arrayKey = Object.keys(reportData).find((k) =>
      Array.isArray(reportData[k]),
    );
    if (arrayKey) return { ...reportData, [arrayKey]: newItems };
    return newItems;
  };

  /** Save updated items to backend via PATCH */
  const saveUpdatedItems = async (newItems: any[]) => {
    if (!reportId) return;
    setSavingRow(true);
    try {
      const updatedData = buildUpdatedReportData(newItems);
      await reportService.updateReport(reportId as string, {
        report_data: updatedData,
      });
      setReportData(updatedData);
      showToast("Changes saved successfully!");
    } catch (err: any) {
      console.error("❌ Failed to update report data:", err);
      showToast(
        err.response?.data?.detail || "Failed to save changes",
        "error",
      );
    } finally {
      setSavingRow(false);
    }
  };

  /** Start editing a row */
  const startEditRow = (rowIdx: number, row: any) => {
    setEditingRowIdx(rowIdx);
    setEditingRowData({ ...row });
  };

  /** Cancel row editing */
  const cancelEditRow = () => {
    setEditingRowIdx(null);
    setEditingRowData(null);
  };

  /** Save the edited row */
  const saveEditRow = async () => {
    if (editingRowIdx === null || !editingRowData) return;
    const items = getItems();
    const newItems = [...items];
    newItems[editingRowIdx] = editingRowData;
    await saveUpdatedItems(newItems);
    setEditingRowIdx(null);
    setEditingRowData(null);
  };

  /** Delete a row */
  const deleteRow = async (rowIdx: number) => {
    const items = getItems();
    const newItems = [...items];
    newItems.splice(rowIdx, 1);
    await saveUpdatedItems(newItems);
  };

  /** Update a field in the currently editing row */
  const updateEditField = (col: string, value: string) => {
    if (!editingRowData) return;

    const colLower = col.toLowerCase();
    let sanitizedValue = value;

    // 1. Character limit validation (50 characters max)
    if (sanitizedValue.length > 50) {
      console.warn("⚠️ [VALIDATION] Value exceeds 50 characters, truncating");
      sanitizedValue = sanitizedValue.substring(0, 50);
      showToast("Maximum 50 characters allowed", "error");
    }

    // 2. Check if this is an amount/currency/rate field (must be positive)
    const isAmountField =
      colLower.includes("amount") ||
      colLower.includes("total") ||
      colLower.includes("paid") ||
      colLower.includes("outstanding") ||
      colLower.includes("price") ||
      colLower.includes("cost") ||
      colLower.includes("rate") ||
      colLower.includes("exchange");

    // 3. Check if this is a name/text field
    const isNameField =
      colLower.includes("name") ||
      colLower.includes("vendor") ||
      colLower.includes("customer") ||
      colLower.includes("description");

    // Try to preserve number types
    const originalValue = editingRowData[col];
    let parsedValue: any = sanitizedValue;

    if (typeof originalValue === "number" || isAmountField) {
      // Handle numeric fields

      // Allow empty string (user deleted everything)
      if (sanitizedValue === "") {
        parsedValue = ""; // Keep as empty string, not 0
      } else {
        const num = Number(sanitizedValue);

        if (!isNaN(num)) {
          // Validate: no negative amounts/rates
          if (num < 0) {
            console.warn(
              "⚠️ [VALIDATION] Negative value not allowed for:",
              col,
            );
            showToast("Negative values not allowed", "error");
            return; // Don't update
          }

          // Validate: max amount 10 Crore (for amount fields, not rates)
          if (
            !colLower.includes("rate") &&
            !colLower.includes("exchange") &&
            num > 100000000
          ) {
            console.warn("⚠️ [VALIDATION] Amount exceeds ₹10 Crore");
            showToast("Amount cannot exceed ₹10 Crore", "error");
            return; // Don't update
          }

          parsedValue = num;
        }
      }
    } else if (isNameField) {
      // For name fields: remove special characters, allow only letters, numbers, and spaces
      const cleaned = sanitizedValue.replace(/[^a-zA-Z0-9\s]/g, "");
      if (cleaned !== sanitizedValue) {
        console.warn(
          "⚠️ [VALIDATION] Special characters removed from name field",
        );
        showToast("Special characters not allowed", "error");
        sanitizedValue = cleaned;
        parsedValue = cleaned;
      } else {
        parsedValue = sanitizedValue;
      }
    } else {
      // For other text fields: remove special characters except common punctuation
      const cleaned = sanitizedValue.replace(/[^a-zA-Z0-9\s.,\-/()]/g, "");
      if (cleaned !== sanitizedValue) {
        console.warn("⚠️ [VALIDATION] Invalid special characters removed");
        sanitizedValue = cleaned;
        parsedValue = cleaned;
      } else {
        parsedValue = sanitizedValue;
      }
    }

    setEditingRowData({ ...editingRowData, [col]: parsedValue });
  };

  const renderDashboard = () => {
    if (!reportData) {
      return (
        <div className="theme-panel border rounded-lg p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 text-theme-tertiary mx-auto mb-4" />
          <p className="text-theme-secondary">No report data available</p>
        </div>
      );
    }

    const items = getItems();

    if (!Array.isArray(items) || items.length === 0) {
      return (
        <div className="theme-panel border rounded-lg p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 text-theme-tertiary mx-auto mb-4" />
          <p className="text-theme-secondary">
            Report data has no tabular records to display
          </p>
        </div>
      );
    }

    const columns = Object.keys(items[0]).filter((col) => {
      const colLower = col.toLowerCase();
      // Filter out any ID columns (trans_id, vendor_id, customer_id, user_id, company_id, etc.)
      return !colLower.endsWith("_id") && colLower !== "id";
    });

    return (
      <div className="space-y-6">
        {/* Summary Bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-theme-secondary">
            Showing{" "}
            <span className="font-semibold text-theme-primary">
              {items.length}
            </span>{" "}
            records
          </p>
        </div>

        {/* Rename UI */}
        {isRenaming && (
          <div className="flex items-center gap-2 p-3 bg-theme-tertiary rounded-lg border border-theme-primary">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-theme-primary text-theme-primary border border-theme-primary rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              placeholder="Enter new report title..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
            />
            <button
              onClick={handleRename}
              className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRenaming(false)}
              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="theme-panel border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-theme-tertiary border-b border-theme-primary">
                  {/* Edit column header - show when in maintenance mode */}
                  {isMaintenanceMode && (
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-theme-secondary w-20 sticky left-0 bg-theme-tertiary z-10">
                      Edit
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-theme-secondary"
                    >
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                  {/* Delete column - only in maintenance mode */}
                  {isMaintenanceMode && (
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-theme-secondary w-16">
                      Del
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-primary">
                {items.map((row: any, rowIdx: number) => {
                  const isEditing = editingRowIdx === rowIdx;

                  return (
                    <tr
                      key={rowIdx}
                      className={`transition-colors ${
                        isEditing
                          ? "bg-blue-500/5 ring-1 ring-blue-500/20"
                          : "hover:bg-theme-tertiary/50"
                      }`}
                    >
                      {/* Edit icon column */}
                      {isMaintenanceMode && (
                        <td className="px-2 py-3 text-center sticky left-0 bg-theme-primary z-10">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={saveEditRow}
                                disabled={savingRow}
                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition-all disabled:opacity-50"
                                title="Save changes"
                              >
                                {savingRow ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={cancelEditRow}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditRow(rowIdx, row)}
                              className="p-1 text-theme-tertiary hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                              title="Edit this row"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}

                      {/* Data columns */}
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 text-theme-primary whitespace-nowrap"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={
                                editingRowData[col] !== null &&
                                editingRowData[col] !== undefined
                                  ? String(editingRowData[col])
                                  : ""
                              }
                              onChange={(e) =>
                                updateEditField(col, e.target.value)
                              }
                              className="w-full bg-theme-tertiary text-theme-primary border border-blue-500/30 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 min-w-[80px]"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditRow();
                                if (e.key === "Escape") cancelEditRow();
                              }}
                            />
                          ) : typeof row[col] === "number" ? (
                            row[col].toLocaleString()
                          ) : row[col] !== null && row[col] !== undefined ? (
                            String(row[col])
                          ) : (
                            "-"
                          )}
                        </td>
                      ))}

                      {/* Delete button column */}
                      {isMaintenanceMode && (
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => deleteRow(rowIdx)}
                            disabled={savingRow}
                            className="p-1 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded transition-all disabled:opacity-30"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (!reportId && !reportUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-primary theme-transition">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg flex items-center justify-center border border-theme-primary shadow-xl">
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-theme-primary">
              No Report Generated Yet
            </h3>
            <p className="text-theme-secondary text-sm leading-relaxed">
              Run a workflow query to generate a report.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-primary theme-transition">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-primary theme-transition">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-theme-secondary">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-blue-500 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-theme-primary overflow-hidden theme-transition">
      <div className="bg-theme-secondary border-b border-theme-primary p-6 z-20 flex-shrink-0 theme-transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 rounded-lg text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary transition-all"
              >
                ←
              </button>
            )}
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-theme-primary">
                  {reportMeta?.report_title || "Report Dashboard"}
                </h2>
                <button
                  onClick={() => {
                    setNewTitle(reportMeta?.report_title || "");
                    setIsRenaming(!isRenaming);
                  }}
                  className="p-1 text-theme-tertiary hover:text-blue-500 transition-all"
                  title="Rename report"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-theme-secondary mt-1">
                {reportMeta?.generated_at
                  ? new Date(reportMeta.generated_at).toLocaleString()
                  : reportFileName}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsMaintenanceMode(!isMaintenanceMode);
                // Cancel any active row editing when toggling off
                if (isMaintenanceMode) {
                  cancelEditRow();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium text-sm border ${
                isMaintenanceMode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-theme-tertiary text-theme-primary border-theme-primary"
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {isMaintenanceMode ? "Done" : "Edit"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg transition-all font-medium text-sm shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar pb-32 min-h-0">
        <div className="max-w-7xl mx-auto space-y-8 min-w-[1000px]">
          {renderDashboard()}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[95]">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-sm font-medium text-white ${
              toast.type === "error"
                ? "bg-red-700 border-red-600"
                : "bg-emerald-700 border-emerald-600"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-300" />
            ) : (
              <Check className="w-4 h-4 text-emerald-300" />
            )}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
};
