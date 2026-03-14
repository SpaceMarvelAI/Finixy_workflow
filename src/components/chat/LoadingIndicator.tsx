import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  loading: boolean;
  uploading: boolean;
  loadingPreview: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loading,
  uploading,
  loadingPreview,
}) => {
  if (!loading && !uploading && !loadingPreview) return null;

  return (
    <div className="flex justify-start animate-pulse">
      <div className="theme-bubble-assistant border p-4 rounded-lg flex items-center gap-3 shadow-md">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-sm font-medium text-theme-secondary">
          {uploading
            ? "Uploading..."
            : loading
              ? "Generating workflow..."
              : "Loading..."}
        </span>
      </div>
    </div>
  );
};
