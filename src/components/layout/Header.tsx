import React from "react";
import { useTheme } from "@store/ThemeContext";

type Tab = "workflow" | "analysis" | "report";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  hasReport?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  hasReport = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const allTabs: { id: Tab; label: string }[] = [
    { id: "workflow", label: "Workflow" },
    { id: "analysis", label: "Analysis" },
    { id: "report", label: "Report" },
  ];

  const tabs = hasReport
    ? allTabs
    : allTabs.filter((tab) => tab.id !== "report");

  const getSliderPosition = () => {
    if (!hasReport && activeTab === "report") return "4px";
    const tabIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (tabIndex === -1) return "4px";
    const percentage = (100 / tabs.length) * tabIndex;
    return `calc(${percentage}% + ${tabIndex * 2 + 4}px)`;
  };

  const getSliderWidth = () => `calc(${100 / tabs.length}% - 4px)`;

  return (
    <header className="theme-panel border-b px-6 py-3 flex items-center justify-between shadow-xl backdrop-blur-sm">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="Finixy Logo"
          className={`w-32 h-12 object-contain ${theme === "light" ? "invert" : ""}`}
        />
      </div>

      {/* CENTER: Sliding Tab Selector */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="relative theme-panel border rounded-lg p-1 flex gap-1 shadow-lg">
          {/* Animated background slider */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-300 ease-out shadow-lg"
            style={{ left: getSliderPosition(), width: getSliderWidth() }}
          />

          {/* Tab Buttons */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative z-10 px-8 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-theme-secondary hover:text-theme-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Theme Toggle */}
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg theme-input hover:brightness-95 dark:hover:brightness-110 transition-all duration-200 border shadow-sm"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            /* Sun icon – shown in dark mode to switch to light */
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            /* Moon icon – shown in light mode to switch to dark */
            <svg className="w-5 h-5 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};
