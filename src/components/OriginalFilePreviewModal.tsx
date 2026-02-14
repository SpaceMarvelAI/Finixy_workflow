import React from "react";
import { X, FileText, Download } from "lucide-react";

interface OriginalFilePreviewModalProps {
  fileData: { url: string; type: string } | null;
  onClose: () => void;
}

export const OriginalFilePreviewModal: React.FC<OriginalFilePreviewModalProps> = ({ 
  fileData, 
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

  if (!fileData) return null;

  const isPDF = fileData.type === 'application/pdf' || fileData.url.endsWith('.pdf');
  const isImage = fileData.type.startsWith('image/');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData.url;
    link.download = 'document';
    link.click();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[85%] h-[85%] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Original Document Preview
              </h3>
              <p className="text-xs text-gray-500">
                Viewing uploaded file in original format
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
              title="Download File"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* File Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 relative">
          {isPDF && (
            <iframe 
              src={`${fileData.url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          )}
          
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-8 bg-gray-900">
              <img 
                src={fileData.url} 
                alt="Document Preview" 
                className="max-w-full max-h-full object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          )}
          
          {!isPDF && !isImage && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-md">
                <div className="p-8 bg-white rounded-3xl shadow-xl inline-block">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto" />
                </div>
                <div>
                  <p className="text-xl text-gray-700 font-bold mb-2">
                    Preview Not Available
                  </p>
                  <p className="text-sm text-gray-500">
                    This file type cannot be previewed in the browser
                  </p>
                  <p className="text-xs text-gray-400 mt-3 font-mono bg-gray-100 px-3 py-1 rounded inline-block">
                    {fileData.type}
                  </p>
                </div>
                <button 
                  onClick={handleDownload}
                  className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold shadow-lg flex items-center gap-3 mx-auto"
                >
                  <Download className="w-5 h-5" /> Download to View
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-2.5 bg-gray-50 border-t flex justify-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">ESC</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};