import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { WorkflowProvider, useWorkflow } from "@store/WorkflowContext";
import { AuthProvider, useAuth } from "@store/AuthContext";
import { Header } from "@components/layout/Header";
import { Sidebar } from "@components/sidebar/Sidebar";
import { ChatPanel } from "@components/chat/ChatPanel";
import { WorkflowCanvas } from "@components/workflow/WorkflowCanvas";
import { ConfigPanel } from "@components/workflow/ConfigPanel";
import { NodePalette } from "@components/workflow/NodePalette";
import { ReportViewer } from "@components/report/ReportViewer";
import { AnalysisViewer } from "@components/analysis/AnalysisViewer";
import { Login } from "@components/auth/Login";

type Tab = "workflow" | "analysis" | "report";

// --- MAIN APP CONTENT ---
const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { selectedNode, config, currentChatId, setCurrentChatId } =
    useWorkflow();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId?: string }>();

  const [activeTab, setActiveTab] = useState<Tab>("workflow");
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentReportUrl, setCurrentReportUrl] = useState<string | null>(null);
  const [currentReportFileName, setCurrentReportFileName] =
    useState<string>("report.xlsx");
  const [isWorkflowMounted, setIsWorkflowMounted] = useState(false);
  const [reportChatId, setReportChatId] = useState<string | null>(null); // Track which chat the report belongs to

  // Mark workflow as mounted after first render
  useEffect(() => {
    setIsWorkflowMounted(true);
  }, []);

  // Clear report when switching to a different chat OR when starting new chat
  useEffect(() => {
    // Case 1: Switching to a different chat (both IDs exist but different)
    if (currentChatId && reportChatId && currentChatId !== reportChatId) {
      console.log("🔄 Switching chat - clearing old report");
      setCurrentReportId(null);
      setCurrentReportUrl(null);
      setCurrentReportFileName("report.xlsx");
      setReportChatId(null);
      // Switch back to workflow tab if we were viewing a report
      if (activeTab === "report") {
        setActiveTab("workflow");
      }
    }
    // Case 2: Starting new chat (currentChatId becomes null)
    else if (!currentChatId && reportChatId) {
      console.log("🆕 New chat - clearing old report");
      setCurrentReportId(null);
      setCurrentReportUrl(null);
      setCurrentReportFileName("report.xlsx");
      setReportChatId(null);
      // Switch back to workflow tab if we were viewing a report
      if (activeTab === "report") {
        setActiveTab("workflow");
      }
    }
  }, [currentChatId, reportChatId, activeTab]);

  // Sync URL with currentChatId
  useEffect(() => {
    if (currentChatId && currentChatId !== chatId) {
      console.log("🔗 Updating URL with chat ID:", currentChatId);
      navigate(`/chat/${currentChatId}`, { replace: true });
    } else if (!currentChatId && chatId) {
      console.log("🔗 Loading chat from URL:", chatId);
      setCurrentChatId(chatId);
    }
  }, [currentChatId, chatId, navigate, setCurrentChatId]);

  // Sync report from config if available AND we have a current chat
  useEffect(() => {
    if ((config.reportUrl || config.reportId) && currentChatId) {
      console.log("Config updated with report:", {
        reportId: config.reportId,
        reportUrl: config.reportUrl,
        reportFileName: config.reportFileName,
        chatId: currentChatId,
      });
      setCurrentReportId(config.reportId || null);
      setCurrentReportUrl(config.reportUrl || null);
      setCurrentReportFileName(config.reportFileName || "report.xlsx");
      // Link report to current chat
      setReportChatId(currentChatId);
    } else if (!currentChatId && (config.reportId || config.reportUrl)) {
      // If config has report but no current chat, clear it
      console.log("⚠️ Config has report but no current chat - clearing");
      setCurrentReportId(null);
      setCurrentReportUrl(null);
      setCurrentReportFileName("report.xlsx");
      setReportChatId(null);
    }
  }, [config.reportId, config.reportUrl, config.reportFileName, currentChatId]);

  const handleSwitchToReport = (reportUrl: string, fileName: string) => {
    console.log("Switching to report tab:", { reportUrl, fileName });
    setCurrentReportUrl(reportUrl);
    setCurrentReportFileName(fileName);
    setActiveTab("report");
  };

  const handleGoBackToWorkflow = () => {
    setActiveTab("workflow");
  };

  // Early return AFTER all hooks
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasReport={!!currentReportId || !!currentReportUrl}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isChatExpanded={isChatExpanded}
          onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        />

        {/* Chat Panel - Show on all tabs when expanded */}
        {isChatExpanded && (
          <div className="w-96 bg-black border-r border-gray-800 flex flex-col transition-all duration-300 flex-shrink-0">
            <ChatPanel
              isExpanded={isChatExpanded}
              onSwitchToReport={handleSwitchToReport}
            />
          </div>
        )}

        {/* Main Content Area - Switch based on active tab */}
        <div className="flex-1 flex flex-col transition-all duration-300 min-w-0">
          {/* Workflow Tab - Always render, control visibility after mount */}
          <div
            className="flex flex-col flex-1"
            style={{
              display:
                activeTab === "workflow" || !isWorkflowMounted
                  ? "flex"
                  : "none",
            }}
          >
            <NodePalette />
            <div className="flex-1">
              <WorkflowCanvas />
            </div>
          </div>

          {isWorkflowMounted && activeTab === "analysis" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <AnalysisViewer />
            </div>
          )}

          {isWorkflowMounted && activeTab === "report" && (
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <ReportViewer
                reportId={currentReportId}
                reportUrl={currentReportUrl}
                reportFileName={currentReportFileName}
                onGoBack={handleGoBackToWorkflow}
              />
            </div>
          )}
        </div>

        {/* Config Panel - Only show on Workflow tab when node is selected */}
        {activeTab === "workflow" && selectedNode && (
          <div className="w-80 bg-white border-l flex-shrink-0 transition-all duration-300">
            <ConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
};

// --- ROOT APP ---
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkflowProvider>
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/chat/:chatId" element={<MainLayout />} />
          </Routes>
        </WorkflowProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
