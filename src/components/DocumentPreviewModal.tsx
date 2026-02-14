import React from "react";
import { 
  X, Table, DollarSign, FileText, Calendar, 
  Building, Users, Activity, Hash, FileCheck
} from "lucide-react";

interface DocumentPreviewModalProps {
  previewData: any;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ 
  previewData, 
  onClose 
}) => {
  // Add ESC key listener
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // --- Formatting Helpers ---
  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? "-" : `$${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string | null) => 
    dateStr ? new Date(dateStr).toLocaleDateString() : "-";
  
  const formatBytes = (bytes: number | null) => 
    bytes ? `${(bytes / 1024).toFixed(2)} KB` : "-";

  // Status badge color logic
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    const badges: Record<string, { bg: string; text: string; border: string }> = {
      'paid': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      'overdue': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
      'cancelled': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
      'draft': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    };
    const badge = badges[statusLower] || badges['pending'];
    return (
      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${badge.bg} ${badge.text} border ${badge.border}`}>
        {status || 'PENDING'}
      </span>
    );
  };

  // --- Professional Line Item Table Renderer ---
  const renderLineItems = (dataObj: any) => {
    const items = dataObj?.extracted_fields?.line_items || [];
    if (items.length > 0) {
      return (
        <div className="overflow-hidden border border-gray-700 rounded-xl bg-gray-800 shadow-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800">
              {items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">
                    {item.description || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-300">
                    {item.quantity || "1"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-100 font-bold font-mono">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div className="p-8 text-center text-gray-500 italic">
        No itemized records detected.
      </div>
    );
  };

  // CRITICAL: Don't render if no data
  if (!previewData) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-100 tracking-tight">
                {previewData.file_name || "Document Preview"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3"/> Upload Date: {formatDate(previewData.uploaded_at)}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 bg-gray-950 space-y-8">
          
          {/* 1. Financial Overview Cards */}
          <div>
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Financial Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-900 p-5 rounded-2xl border-l-4 border-l-blue-500 shadow-lg hover:shadow-blue-500/10 transition-shadow border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-tighter">
                  Grand Total
                </p>
                <p className="text-2xl font-black text-gray-100">
                  {formatCurrency(previewData.grand_total)}
                </p>
              </div>
              <div className="bg-gray-900 p-5 rounded-2xl border-l-4 border-l-purple-500 shadow-lg hover:shadow-purple-500/10 transition-shadow border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-tighter">
                  Tax Total
                </p>
                <p className="text-2xl font-black text-gray-100">
                  {formatCurrency(previewData.tax_total)}
                </p>
              </div>
              <div className="bg-gray-900 p-5 rounded-2xl border-l-4 border-l-emerald-500 shadow-lg hover:shadow-emerald-500/10 transition-shadow border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-tighter">
                  Paid Amount
                </p>
                <p className="text-2xl font-black text-gray-100">
                  {formatCurrency(previewData.paid_amount)}
                </p>
              </div>
              <div className="bg-gray-900 p-5 rounded-2xl border-l-4 border-l-amber-500 shadow-lg hover:shadow-amber-500/10 transition-shadow border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-tighter">
                  Outstanding
                </p>
                <p className="text-2xl font-black text-gray-100">
                  {formatCurrency(previewData.outstanding)}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Entity Details & System Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Entity Details Card */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" /> Entities & Details
              </h4>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg divide-y divide-gray-800 overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-gray-900 hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                    <Building className="w-3.5 h-3.5"/> Vendor Name
                  </span>
                  <span className="text-sm font-bold text-gray-200">
                    {previewData.vendor_name || "N/A"}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-900 hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                    <Users className="w-3.5 h-3.5"/> Customer Name
                  </span>
                  <span className="text-sm font-bold text-gray-200">
                    {previewData.customer_name || "N/A"}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-900 hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5"/> Document Number
                  </span>
                  <span className="text-sm font-mono font-bold text-blue-400">
                    {previewData.document_number || "N/A"}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-900 hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5"/> Status
                  </span>
                  <div>
                    {getStatusBadge(previewData.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* System Analysis Card */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4" /> Technical Analysis
              </h4>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-5 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      File Properties
                    </p>
                    <p className="text-sm font-bold text-gray-200 uppercase mt-1">
                      {previewData.file_type?.replace('.', '') || 'PDF'} / {formatBytes(previewData.file_size)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      AI Confidence
                    </p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      {previewData.confidence_score ? `${(previewData.confidence_score * 100).toFixed(0)}%` : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    Processing Result
                  </p>
                  <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-tighter border border-blue-500/30">
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
            {renderLineItems(previewData.canonical_data)}
          </div>

        </div>
      </div>
    </div>
  );
};