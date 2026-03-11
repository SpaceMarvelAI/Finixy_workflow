import React from "react";

type Tab = "workflow" | "analysis" | "report";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  hasReport?: boolean; // New prop to control Report tab visibility
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  hasReport = false,
}) => {
  const allTabs: { id: Tab; label: string }[] = [
    { id: "workflow", label: "Workflow" },
    { id: "analysis", label: "Analysis" },
    { id: "report", label: "Report" },
  ];

  // Only show Report tab if there's a report available
  // Analysis tab is always visible
  const tabs = hasReport
    ? allTabs
    : allTabs.filter((tab) => tab.id !== "report");

  // Calculate slider position based on visible tabs
  const getSliderPosition = () => {
    if (!hasReport && activeTab === "report") {
      // If report tab is hidden but somehow active, default to workflow
      return "4px";
    }

    const tabIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (tabIndex === -1) return "4px";

    const percentage = (100 / tabs.length) * tabIndex;
    return `calc(${percentage}% + ${tabIndex * 2 + 4}px)`;
  };

  const getSliderWidth = () => {
    return `calc(${100 / tabs.length}% - 4px)`;
  };

  return (
    <header className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 px-6 py-3 flex items-center justify-between shadow-xl backdrop-blur-sm">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="Finixy Logo"
          className="w-32 h-12 object-contain"
        />
      </div>

      {/* CENTER: Sliding Tab Selector */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="relative bg-gray-800 border border-gray-700 rounded-lg p-1 flex gap-1 shadow-lg">
          {/* Animated background slider */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-all duration-300 ease-out shadow-lg"
            style={{
              left: getSliderPosition(),
              width: getSliderWidth(),
            }}
          />

          {/* Tab Buttons */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative z-10 px-8 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Empty for now */}
      <div className="w-10" />
    </header>
  );
};
