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
import { Header } from "@components/Header";
import { Sidebar } from "@components/Sidebar";
import { ChatPanel } from "@components/ChatPanel";
import { WorkflowCanvas } from "@components/WorkflowCanvas";
import { ConfigPanel } from "@components/ConfigPanel";
import { NodePalette } from "@components/NodePalette";
import { ReportViewer } from "@components/ReportViewer";
import { Login } from "@components/Login";

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

  // Mark workflow as mounted after first render
  useEffect(() => {
    setIsWorkflowMounted(true);
  }, []);

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

  // Sync report from config if available
  useEffect(() => {
    if (config.reportUrl || config.reportId) {
      console.log("Config updated with report:", {
        reportId: config.reportId,
        reportUrl: config.reportUrl,
        reportFileName: config.reportFileName,
      });
      setCurrentReportId(config.reportId || null);
      setCurrentReportUrl(config.reportUrl || null);
      setCurrentReportFileName(config.reportFileName || "report.xlsx");
    }
  }, [config.reportId, config.reportUrl, config.reportFileName]);

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
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isChatExpanded={isChatExpanded}
          onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        />

        {/* Chat Panel - Show on all tabs when expanded */}
        {isChatExpanded && (
          <div className="w-96 bg-black border-r border-gray-800 flex flex-col transition-all duration-300">
            <ChatPanel
              isExpanded={isChatExpanded}
              onSwitchToReport={handleSwitchToReport}
            />
          </div>
        )}

        {/* Main Content Area - Switch based on active tab */}
        <div className="flex-1 flex flex-col transition-all duration-300">
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
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-100">
                  Analysis Dashboard
                </h2>
                <p className="text-gray-400">Coming Soon</p>
              </div>
            </div>
          )}

          {isWorkflowMounted && activeTab === "report" && (
            <div className="flex-1 flex flex-col overflow-hidden">
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
