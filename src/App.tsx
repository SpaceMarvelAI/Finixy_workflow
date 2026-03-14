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
import { ThemeProvider } from "@store/ThemeContext";
import { Header } from "@components/layout/Header";
import { Sidebar } from "@components/sidebar/Sidebar";
import { ChatPanel } from "@components/chat/ChatPanel";
import { WorkflowCanvas } from "@components/workflow/WorkflowCanvas";
import { ConfigPanel } from "@components/workflow/ConfigPanel";
import { NodePalette } from "@components/workflow/NodePalette";
import { ReportViewer } from "@components/report/ReportViewer";
import { AnalysisViewer } from "@components/analysis/AnalysisViewer";
import { Login } from "@components/auth/Login";
import { DocumentPreviewModal } from "@components/modals/DocumentPreviewModal";

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
  const [reportChatId, setReportChatId] = useState<string | null>(null);
  const [parsedDocumentData, setParsedDocumentData] = useState<any>(null);

  useEffect(() => {
    setIsWorkflowMounted(true);
  }, []);

  useEffect(() => {
    if (currentChatId && reportChatId && currentChatId !== reportChatId) {
      console.log("🔄 Switching chat - clearing old report");
      setCurrentReportId(null);
      setCurrentReportUrl(null);
      setCurrentReportFileName("report.xlsx");
      setReportChatId(null);
      if (activeTab === "report") setActiveTab("workflow");
    } else if (!currentChatId && reportChatId) {
      console.log("🆕 New chat - clearing old report");
      setCurrentReportId(null);
      setCurrentReportUrl(null);
      setCurrentReportFileName("report.xlsx");
      setReportChatId(null);
      if (activeTab === "report") setActiveTab("workflow");
    }
  }, [currentChatId, reportChatId, activeTab]);

  useEffect(() => {
    if (currentChatId && currentChatId !== chatId) {
      navigate(`/chat/${currentChatId}`, { replace: true });
    } else if (!currentChatId && chatId) {
      setCurrentChatId(chatId);
    }
  }, [currentChatId, chatId, navigate, setCurrentChatId]);

  useEffect(() => {
    if (config.reportUrl || config.reportId) {
      setCurrentReportId(config.reportId || null);
      setCurrentReportUrl(config.reportUrl || null);
      setCurrentReportFileName(config.reportFileName || "report.xlsx");
      if (currentChatId) setReportChatId(currentChatId);
    } else if (!currentChatId && (config.reportId || config.reportUrl)) {
      setCurrentReportId(null);
      setCurrentReportUrl(null);
      setCurrentReportFileName("report.xlsx");
      setReportChatId(null);
    }
  }, [config.reportId, config.reportUrl, config.reportFileName, currentChatId]);

  const handleSwitchToReport = (reportUrl: string, fileName: string) => {
    setCurrentReportUrl(reportUrl);
    setCurrentReportFileName(fileName);
    setActiveTab("report");
  };

  const handleGoBackToWorkflow = () => setActiveTab("workflow");

  if (!isAuthenticated) return <Login />;

  return (
    <div className="h-screen flex flex-col bg-theme-primary theme-transition">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasReport={
          !!currentReportId || !!currentReportUrl || !!parsedDocumentData
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isChatExpanded={isChatExpanded}
          onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
          onTabChange={setActiveTab}
          onViewParsedDocument={(data) => {
            setParsedDocumentData(data);
            setCurrentReportId(null);
            setCurrentReportUrl(null);
          }}
        />

        {/* Chat Panel */}
        {isChatExpanded && (
          <div className="w-96 bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 flex-shrink-0 theme-transition">
            <ChatPanel
              isExpanded={isChatExpanded}
              onSwitchToReport={handleSwitchToReport}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col transition-all duration-300 min-w-0 bg-theme-secondary theme-transition">
          {/* Workflow Tab */}
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
              {parsedDocumentData ? (
                <DocumentPreviewModal
                  previewData={parsedDocumentData}
                  onClose={() => {
                    setParsedDocumentData(null);
                    setActiveTab("workflow");
                  }}
                  onRefresh={async () => {
                    // re-fetch if needed
                  }}
                  inline
                />
              ) : (
                <ReportViewer
                  reportId={currentReportId}
                  reportUrl={currentReportUrl}
                  reportFileName={currentReportFileName}
                  onGoBack={handleGoBackToWorkflow}
                />
              )}
            </div>
          )}
        </div>

        {/* Config Panel */}
        {activeTab === "workflow" && selectedNode && (
          <div className="w-80 bg-theme-primary border-l border-theme-primary flex-shrink-0 transition-all duration-300 theme-transition">
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
      <ThemeProvider>
        <AuthProvider>
          <WorkflowProvider>
            <Routes>
              <Route path="/" element={<MainLayout />} />
              <Route path="/chat/:chatId" element={<MainLayout />} />
            </Routes>
          </WorkflowProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
