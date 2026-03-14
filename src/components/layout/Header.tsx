import React, { useState } from "react";
import { useTheme } from "@store/ThemeContext";
import { User, LogOut, Settings } from "lucide-react";

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get user info from session storage
  const userEmail = sessionStorage.getItem("user_email") || "";
  const companyName = sessionStorage.getItem("user_name") || "";
  // Display name: company name if available, else the part before @ in email
  const userName =
    companyName || (userEmail ? userEmail.split("@")[0] : "User");
  // Display email: show actual email, fallback to empty
  const displayEmail = userEmail;

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_name");
    window.location.href = "/login";
  };

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
    <header className="theme-panel border-b px-4 py-1.5 flex items-center justify-between shadow-md backdrop-blur-sm relative z-[200]">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="Finixy Logo"
          className={`w-24 h-8 object-contain ${theme === "light" ? "invert" : ""}`}
        />
      </div>

      {/* CENTER: Sliding Tab Selector */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="relative theme-panel border rounded p-0.5 flex gap-0.5 shadow-md">
          {/* Animated background slider */}
          <div
            className="absolute top-0.5 bottom-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded transition-all duration-300 ease-out shadow-md"
            style={{ left: getSliderPosition(), width: getSliderWidth() }}
          />

          {/* Tab Buttons */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative z-10 px-6 py-1.5 rounded text-xs font-medium transition-all duration-300 ${
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

      {/* RIGHT: Theme Toggle & Profile */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Toggle theme"
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? (
            /* Sun icon – shown in dark mode to switch to light */
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            /* Moon icon – shown in light mode to switch to dark */
            <svg
              className="w-5 h-5 text-theme-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
            title={userName}
            id="profile-button"
          >
            {userName.charAt(0).toUpperCase()}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowProfileMenu(false)}
              />

              {/* Menu - Fixed positioning */}
              <div
                className="fixed top-12 right-6 w-64 theme-panel border rounded shadow-2xl z-[9999] overflow-hidden"
                style={{
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                {/* User Info */}
                <div className="p-4 border-b border-theme-primary bg-gradient-to-br from-blue-500/10 to-indigo-600/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-theme-primary truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-theme-tertiary truncate">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Add settings navigation here
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary transition-all text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
