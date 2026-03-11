import React, { useState, useEffect } from "react";
import {
  X,
  Table,
  DollarSign,
  FileText,
  Calendar,
  Building,
  Users,
  Activity,
  Hash,
  FileCheck,
  Edit2,
  Save,
  RotateCcw,
  Check,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { documentService } from "../../services/api";

interface DocumentPreviewModalProps {
  previewData: any;
  onClose: () => void;
  onRefresh?: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  previewData,
  onClose,
  onRefresh,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize editedData when previewData changes or when starting edit
  useEffect(() => {
    if (previewData && !isEditing) {
      setEditedData(JSON.parse(JSON.stringify(previewData)));
    }
  }, [previewData, isEditing]);

  // Add ESC key listener
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isEditing]);

  // --- Formatting Helpers ---
  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num)
      ? "-"
      : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const formatOriginalCurrency = (val: any, currency?: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "-";
    const currencySymbol = currency === "INR" || currency === "₹" ? "₹" : "$";
    const locale = currency === "INR" || currency === "₹" ? "en-IN" : "en-US";
    return `${currencySymbol}${num.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "-";

  const formatBytes = (bytes: number | null) =>
    bytes ? `${(bytes / 1024).toFixed(2)} KB` : "-";

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "pending";
    const badges: Record<string, { bg: string; text: string; border: string }> =
      {
        paid: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
        pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
        overdue: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
        cancelled: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
        draft: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
      };
    const badge = badges[statusLower] || badges["pending"];
    return (
      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${badge.bg} ${badge.text} border ${badge.border}`}>
        {status || "PENDING"}
      </span>
    );
  };

  const getDisplayValue = (field: string) => {
    const d = isEditing ? editedData : previewData;
    if (!d) return null;

    const canonical = d.canonical_data || {};
    
    // We prioritize canonical fields because they are what we successfully save to the backend
    switch (field) {
      case "grand_total": return canonical.totals?.grand_total ?? d.grand_total;
      case "tax_total": return canonical.totals?.tax_total ?? d.tax_total;
      case "paid_amount": return canonical.totals?.amount_paid ?? d.paid_amount;
      case "outstanding": return canonical.totals?.balance_due ?? d.outstanding;
      case "vendor_name": return canonical.vendor?.name ?? d.vendor_name;
      case "customer_name": return canonical.customer?.name ?? d.customer_name;
      case "document_number": return canonical.document_metadata?.document_number ?? (d.document_number || d.document_metadata?.document_number);
      default: return d[field];
    }
  };

  const handleInputChange = (field: string, value: any, isNested: boolean = false) => {
    setEditedData((prev: any) => {
      const next = { ...prev };
      let sanitizedValue = value;

      // Sanitize names to allow only letters and spaces
      if (field === "vendor_name" || field === "customer_name" || field === "description") {
        if (/[^a-zA-Z\s]/.test(value)) {
          setValidationError("Special characters & numbers are not allowed in this field.");
          setTimeout(() => setValidationError(null), 3000);
        }
        sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
      }

      if (isNested) {
        const parts = field.split(".");
        let current = next;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = sanitizedValue;
      } else {
        next[field] = sanitizedValue;
      }
      return next;
    });
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    setEditedData((prev: any) => {
      if (!prev) return prev;
      
      const canonical_data = prev.canonical_data || {};
      const line_items = [...(canonical_data.line_items || canonical_data.extracted_fields?.line_items || [])];
      
      if (line_items[index]) {
        let finalValue = value;
        
        // Sanitize Description (Letters and spaces only)
        if (field === "description") {
          if (/[^a-zA-Z\s]/.test(value)) {
            setValidationError("Special characters & numbers are not allowed in item names.");
            setTimeout(() => setValidationError(null), 3000);
          }
          finalValue = value.replace(/[^a-zA-Z\s]/g, "");
        }
        // Clamp numeric values to 0
        else if (field === "quantity" || field === "unit_price" || field === "amount") {
          finalValue = Math.max(0, parseFloat(value) || 0);
        }
        
        line_items[index] = { ...line_items[index], [field]: finalValue };
      }
      
      const newCanonical = { ...canonical_data, line_items };
      // Also update legacy location if it existed
      if (newCanonical.extracted_fields) {
        newCanonical.extracted_fields = { ...newCanonical.extracted_fields, line_items };
      }
      
      return {
        ...prev,
        canonical_data: newCanonical
      };
    });
  };

  const addLineItem = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setEditedData((prev: any) => {
      if (!prev) return prev;
      
      const canonical_data = prev.canonical_data || {};
      const extracted_fields = canonical_data.extracted_fields || {};
      const line_items = [...(extracted_fields.line_items || [])];
      
      return {
        ...prev,
        canonical_data: {
          ...canonical_data,
          extracted_fields: {
            ...extracted_fields,
            line_items: [
              ...line_items,
              { description: "", quantity: 1, unit_price: 0, amount: 0 }
            ]
          }
        }
      };
    });
  };

  const removeLineItem = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setEditedData((prev: any) => {
      if (!prev) return prev;
      
      const canonical_data = prev.canonical_data || {};
      const extracted_fields = canonical_data.extracted_fields || {};
      const line_items = (extracted_fields.line_items || []).filter((_: any, i: number) => i !== index);
      
      return {
        ...prev,
        canonical_data: {
          ...canonical_data,
          extracted_fields: {
            ...extracted_fields,
            line_items
          }
        }
      };
    });
  };

  const validateInputs = () => {
    const MAX_AMOUNT = 1000000000; // 100 Crore
    const nameRegex = /^[a-zA-Z\s]*$/;

    // Check Entity Names
    if (editedData.vendor_name && !nameRegex.test(editedData.vendor_name)) {
      return "Vendor name should only contain letters and spaces (no numbers or special characters allowed).";
    }
    if (editedData.customer_name && !nameRegex.test(editedData.customer_name)) {
      return "Customer name should only contain letters and spaces (no numbers or special characters allowed).";
    }

    // Check Financial Amounts
    const financialFields = [
      { name: "Grand Total", val: editedData.grand_total },
      { name: "Tax Total", val: editedData.tax_total },
      { name: "Paid Amount", val: editedData.paid_amount },
      { name: "Outstanding", val: editedData.outstanding }
    ];

    for (const field of financialFields) {
      const num = parseFloat(field.val);
      if (num < 0) return `${field.name} cannot be negative.`;
      if (num > MAX_AMOUNT) return `${field.name} cannot exceed 100 Crore (₹100,00,00,000).`;
    }

    // Check Line Items
    const lineItems = editedData.canonical_data?.extracted_fields?.line_items || [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const amount = parseFloat(item.amount);

      if (quantity < 0 || unitPrice < 0 || amount < 0) {
        return `Line item ${i + 1} has negative values. All amounts must be positive.`;
      }
      if (amount > MAX_AMOUNT || unitPrice > MAX_AMOUNT) {
        return `Line item ${i + 1} amount/rate exceeds 100 Crore limit.`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!previewData?.id) return;
    
    const error = validateInputs();
    if (error) {
      setValidationError(error);
      setTimeout(() => setValidationError(null), 5000); // Clear after 5s
      return;
    }

    setValidationError(null);
    setSaving(true);
    try {
      // Map frontend fields back to CanonicalFinancialDocument schema
      const canonical = editedData.canonical_data || {};
      
      const dataToSave: any = {
        ...canonical,
        document_metadata: {
          ...(canonical.document_metadata || {}),
          document_number: editedData.document_number,
          currency: editedData.currency || "INR",
        },
        totals: {
          ...(canonical.totals || {}),
          grand_total: parseFloat(editedData.grand_total) || 0,
          tax_total: parseFloat(editedData.tax_total) || 0,
          amount_paid: parseFloat(editedData.paid_amount) || 0,
          balance_due: parseFloat(editedData.outstanding) || 0,
        },
        vendor: {
          ...(canonical.vendor || {}),
          name: editedData.vendor_name,
        },
        customer: {
          ...(canonical.customer || {}),
          name: editedData.customer_name,
        },
        line_items: (canonical.extracted_fields?.line_items || canonical.line_items || []).map((item: any) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          line_total: parseFloat(item.amount || item.line_total) || 0,
          tax_amount: parseFloat(item.tax_amount) || 0,
        }))
      };

      // Clean up legacy fields if they exist to avoid confusion
      delete dataToSave.extracted_fields;

      const response = await documentService.updateDocumentData(previewData.id, dataToSave);
      
      if (response.data.document_id) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditing(false);
          if (onRefresh) onRefresh();
        }, 1500);
      }
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save changes. Please check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const renderLineItems = (canonicalData: any, isEditMode: boolean) => {
    if (!canonicalData) {
      return (
        <div className="p-8 text-center text-gray-500 italic">
          No records found.
        </div>
      );
    }

    const items = canonicalData.line_items || canonicalData.extracted_fields?.line_items || [];

    if (items.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500 italic">
          No itemized records detected.
        </div>
      );
    }

    return (
      <div className="overflow-hidden border border-gray-700 rounded-lg bg-gray-800 shadow-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Description
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">
                Rate
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">
                Amount
              </th>
              {isEditMode && <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest w-16"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {items.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-200">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) => handleLineItemChange(i, "description", e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    item.description || "N/A"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-300">
                  {isEditMode ? (
                    <input
                      type="number"
                      min="0"
                      value={item.quantity || "0"}
                      onChange={(e) => handleLineItemChange(i, "quantity", e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    item.quantity || "1"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">
                  {isEditMode ? (
                    <input
                      type="number"
                      min="0"
                      value={item.unit_price || "0"}
                      onChange={(e) => handleLineItemChange(i, "unit_price", e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    formatOriginalCurrency(item.unit_price, item.currency || previewData.currency)
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-100 font-bold font-mono">
                  {isEditMode ? (
                    <input
                      type="number"
                      min="0"
                      value={item.amount || item.line_total || "0"}
                      onChange={(e) => handleLineItemChange(i, "amount", e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    formatOriginalCurrency(item.amount || item.line_total, item.currency || previewData.currency)
                  )}
                </td>
                {isEditMode && (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => removeLineItem(i, e)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {isEditMode && (
              <tr>
                <td colSpan={5} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => addLineItem(e)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  if (!previewData) return null;

  const data = isEditing ? editedData : previewData;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
      onClick={() => !isEditing && onClose()}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-100 tracking-tight">
                {data.file_name || "Document Preview"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isEditing ? "EDITING" : "VERIFIED"}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3" /> Upload Date:{" "}
                  {formatDate(data.uploaded_at)}
                </span>
              </div>
            </div>
          </div>
          
          {validationError && (
            <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-400">{validationError}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                <Edit2 className="w-4 h-4" /> Edit Data
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 ${saveSuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm font-bold rounded-lg transition-all shadow-lg disabled:opacity-50`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saveSuccess ? "Saved!" : saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-lg transition-all border border-gray-700"
                >
                  <RotateCcw className="w-4 h-4" /> Cancel
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-gray-950 space-y-8 custom-scrollbar">
          {/* 1. Financial Overview Cards */}
          <div>
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Financial Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Grand Total", field: "grand_total", color: "blue" },
                { label: "Tax Total", field: "tax_total", color: "purple" },
                { label: "Paid Amount", field: "paid_amount", color: "emerald" },
                { label: "Outstanding", field: "outstanding", color: "amber" }
              ].map((item) => (
                <div 
                  key={item.field}
                  className={`bg-gray-900 p-5 rounded-lg border-l-4 border-l-${item.color}-500 shadow-lg border border-gray-800 transition-all`}
                >
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-tighter">
                    {item.label}
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editedData[item.field] || 0}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        handleInputChange(item.field, val);
                      }}
                      className="w-full bg-gray-800 border-none text-xl font-black text-gray-100 outline-none p-0 focus:ring-0"
                    />
                  ) : (
                    <p className="text-2xl font-black text-gray-100">
                      {formatCurrency(getDisplayValue(item.field))}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Entity Details & System Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Entity Details Card */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" /> Entities & Details
              </h4>
              <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-lg divide-y divide-gray-800 overflow-hidden">
                {[
                  { label: "Vendor Name", field: "vendor_name", icon: <Building className="w-3.5 h-3.5" /> },
                  { label: "Customer Name", field: "customer_name", icon: <Users className="w-3.5 h-3.5" /> },
                  { label: "Document Number", field: "document_number", icon: <Hash className="w-3.5 h-3.5" />, mono: true },
                ].map((item) => (
                  <div key={item.field} className="p-4 flex justify-between items-center bg-gray-900 hover:bg-gray-800/50 transition-colors">
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                      {item.icon} {item.label}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData[item.field] || ""}
                        onChange={(e) => handleInputChange(item.field, e.target.value)}
                        className={`bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm font-bold text-gray-200 outline-none focus:ring-1 focus:ring-blue-500 text-right`}
                      />
                    ) : (
                      <span className={`text-sm font-bold ${item.mono ? 'font-mono text-blue-400' : 'text-gray-200'}`}>
                        {getDisplayValue(item.field) || "N/A"}
                      </span>
                    )}
                  </div>
                ))}
                <div className="p-4 flex justify-between items-center bg-gray-900 hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5" /> Status
                  </span>
                  <div>{getStatusBadge(data.status)}</div>
                </div>
              </div>
            </div>

            {/* System Analysis Card */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4" /> Technical Analysis
              </h4>
              <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-lg p-5 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      File Properties
                    </p>
                    <p className="text-sm font-bold text-gray-200 uppercase mt-1">
                      {data.file_type?.replace(".", "") || "PDF"} /{" "}
                      {formatBytes(data.file_size)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      AI Confidence
                    </p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      {data.confidence_score
                        ? `${(data.confidence_score * 100).toFixed(0)}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    Processing Result
                  </p>
                  <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-lg uppercase tracking-tighter border border-blue-500/30">
                    Itemized Records Extracted Successfully
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Itemized Records Table */}
          <div>
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Table className="w-4 h-4" /> Itemized Records
            </h4>
            {renderLineItems(data.canonical_data, isEditing)}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
