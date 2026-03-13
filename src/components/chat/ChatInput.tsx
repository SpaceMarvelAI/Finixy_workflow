import React, { useRef } from "react";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  input: string;
  loading: boolean;
  uploading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  loading,
  uploading,
  onInputChange,
  onSend,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-3 border-t border-theme-primary bg-theme-secondary theme-transition">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Type your query here..."
          className="w-full px-4 py-3 theme-input border rounded-lg text-sm shadow-sm"
          disabled={loading || uploading}
        />
        <div className="flex gap-3 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            className="hidden"
            accept=".pdf,.csv,.xlsx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Paperclip className="w-4 h-4" />
            Upload Invoice
          </button>
          <button
            onClick={onSend}
            disabled={!input.trim() || loading || uploading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "Processing..." : "Send Query"}
          </button>
        </div>
      </div>
    </div>
  );
};
