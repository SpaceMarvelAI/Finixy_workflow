import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Database,
  Code,
  Brush,
} from "lucide-react";
import { reportService } from "../../services/api";

interface ReportDataEditorModalProps {
  reportId: string;
  initialData: any;
  onClose: () => void;
  onSave: (updatedData: any) => void;
}

export const ReportDataEditorModal: React.FC<ReportDataEditorModalProps> = ({
  reportId,
  initialData,
  onClose,
  onSave,
}) => {
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Stringify with indentation
    try {
      setJsonString(JSON.stringify(initialData, null, 2));
    } catch (e) {
      setError("Failed to serialize report data");
    }
  }, [initialData]);

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(jsonString);
      setJsonString(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSuccess(false);

    try {
      // 1. Validate JSON
      const updatedData = JSON.parse(jsonString);

      // 2. Determine which field to update
      // Backends usually have report_data or metadata
      // Since we extracted it in ReportViewer, we'll try to update both to be safe or just use a generic update
      // Based on common patterns, we update 'report_data'
      await reportService.updateReport(reportId, {
        report_data: updatedData,
      });

      setSuccess(true);
      onSave(updatedData);

      // Close after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e: any) {
      console.error("❌ Failed to save report data:", e);
      if (e instanceof SyntaxError) {
        setError(`Invalid JSON format: ${e.message}`);
      } else {
        setError(
          e.response?.data?.detail || e.message || "Failed to save data",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center theme-modal-overlay backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="theme-modal border border-theme-primary rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative theme-transition">
        {/* Top Decorative Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />

        {/* Header */}
        <div className="p-5 border-b border-theme-primary flex items-center justify-between bg-theme-secondary/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-theme-primary">
                Maintain Report Data
              </h3>
              <p className="text-xs text-theme-tertiary mt-0.5 font-medium tracking-wide uppercase">
                Direct JSON Maintenance Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrettify}
              className="px-3 py-1.5 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-lg text-xs font-semibold border border-theme-primary flex items-center gap-2 transition-all"
              title="Prettify JSON"
            >
              <Brush className="w-3.5 h-3.5 text-blue-400" />
              Format JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden relative bg-[#0f172a] group">
          <div className="absolute left-0 top-0 w-12 h-full bg-[#1e293b]/30 border-r border-[#1e293b] flex flex-col items-center pt-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <Code className="w-4 h-4 text-blue-400 mb-2" />
            <div className="w-px h-full bg-[#1e293b]" />
          </div>
          <textarea
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            spellCheck={false}
            className="w-full h-full pl-16 pr-6 py-4 bg-transparent text-[#e2e8f0] font-mono text-sm resize-none focus:outline-none custom-scrollbar selection:bg-blue-500/30 line-height-[1.6]"
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-theme-primary bg-theme-secondary/50 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="flex-1 w-full md:w-auto">
            {error ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm animate-in slide-in-from-left-2 duration-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">{error}</span>
              </div>
            ) : success ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-500 text-sm animate-in slide-in-from-left-2 duration-300">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Data updated successfully!</span>
              </div>
            ) : (
              <div className="text-theme-tertiary text-xs bg-theme-tertiary/30 px-3 py-2 rounded-lg border border-theme-primary inline-flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/70" />
                <span>
                  Modifying JSON will directly affect report dashboards and
                  exports. Use caution.
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={onClose}
              className="flex-1 md:px-6 py-2.5 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-lg text-sm font-bold border border-theme-primary transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !!success}
              className="flex-1 md:px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Custom Styles for Textarea */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 10px;
            border: 2px solid #0f172a;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        `}</style>
      </div>
    </div>
  );
};
