import React, { useRef, useState } from "react";
import { Send, Plus, ChevronDown } from "lucide-react";

interface ChatInputProps {
  input: string;
  loading: boolean;
  uploading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  companies?: string[];
  selectedCompany?: string;
  onCompanyChange?: (company: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  loading,
  uploading,
  onInputChange,
  onSend,
  onFileUpload,
  companies = [],
  selectedCompany = "all",
  onCompanyChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="p-2 border-t border-theme-primary bg-theme-secondary theme-transition">
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          className="hidden"
          accept=".pdf,.csv,.xlsx"
        />

        {/* Text Input - Textarea for multi-line */}
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Describe your workflow..."
          className="w-full pl-4 pr-24 pt-2 pb-4 theme-input border rounded-md text-base shadow-sm resize-none min-h-[120px]"
          disabled={loading || uploading}
          rows={4}
        />

        {/* Action Buttons Container - Bottom Right */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {/* Company Dropdown - Opens Upward */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={loading || uploading}
              className="flex-shrink-0 h-7 px-3 bg-theme-tertiary hover:bg-theme-primary text-theme-primary text-xs rounded-sm border border-theme-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
            >
              <span className="whitespace-nowrap">
                {selectedCompany === "all" ? "All Companies" : selectedCompany}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu - Opens Upward */}
            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown List */}
                <div className="absolute bottom-full right-0 mb-1 w-48 bg-theme-secondary border border-theme-primary rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => {
                      onCompanyChange?.("all");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-theme-tertiary transition-colors ${
                      selectedCompany === "all"
                        ? "bg-theme-tertiary text-blue-400"
                        : "text-theme-secondary"
                    }`}
                  >
                    All Companies
                  </button>
                  {companies.map((company) => (
                    <button
                      key={company}
                      onClick={() => {
                        onCompanyChange?.(company);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-theme-tertiary transition-colors ${
                        selectedCompany === company
                          ? "bg-theme-tertiary text-blue-400"
                          : "text-theme-secondary"
                      }`}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* File Upload Button - Plus Icon */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            title="Upload Invoice"
            className="flex-shrink-0 w-7 h-7 bg-theme-tertiary hover:bg-theme-primary text-theme-primary border border-theme-primary rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Send Button - Send Icon */}
          <button
            onClick={onSend}
            disabled={!input.trim() || loading || uploading}
            title="Send Message"
            className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
