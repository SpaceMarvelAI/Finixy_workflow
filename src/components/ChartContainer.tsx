import React, { useRef } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";

interface ChartContainerProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  chartName?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  icon,
  children,
  chartName = "chart",
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async (format: "png" | "jpg") => {
    if (!chartRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: format === "png" ? null : "#ffffff",
        scale: 2, // Higher quality
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${chartName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.${format}`;

      if (format === "png") {
        link.href = canvas.toDataURL("image/png");
      } else {
        link.href = canvas.toDataURL("image/jpeg", 0.95);
      }

      link.click();
    } catch (error) {
      console.error("Failed to download chart:", error);
      alert("Failed to download chart. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
      {/* Header with Download Options */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          {icon}
          {title}
        </h3>

        {/* Download Dropdown */}
        <div className="relative group">
          <button
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Downloading..." : "Download"}
          </button>

          {/* Dropdown Menu */}
          {!downloading && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => handleDownload("png")}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-t-lg flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Download as PNG
              </button>
              <button
                onClick={() => handleDownload("jpg")}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-b-lg flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Download as JPG
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div
        ref={chartRef}
        className="bg-gradient-to-br from-gray-800 to-gray-900"
      >
        {children}
      </div>
    </div>
  );
};
