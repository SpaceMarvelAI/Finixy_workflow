import { useState } from "react";
import { chatService } from "../../../services/api";
import { ExtendedChatMessage } from "../types";
import {
  mapBackendNodesToFrontend,
  mapBackendEdgesToFrontend,
} from "../../../utils/workflowMapper";

export const useChatQuery = (
  currentChatId: string | null,
  setCurrentChatId: (id: string) => void,
  refreshSidebar: () => void,
  setMessages: React.Dispatch<React.SetStateAction<ExtendedChatMessage[]>>,
  config: any,
  updateConfig: (config: any) => void,
  onSwitchToReport?: (reportUrl: string, fileName: string) => void,
) => {
  const [loading, setLoading] = useState(false);

  const handleSend = async (query: string) => {
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const response = await chatService.sendQuery(query, currentChatId || undefined);
      const { workflow, report, chat_id } = response.data;

      if (chat_id && chat_id !== currentChatId) {
        setCurrentChatId(chat_id);
        if (!currentChatId) setTimeout(() => refreshSidebar(), 500);
      }

      let reportId = null;
      let reportDownloadUrl = null;
      let reportFilePath = null;

      if (report) {
        reportId = report.report_id || report.id;
        reportDownloadUrl = report.download_url || report.downloadUrl;
        reportFilePath = report.file_path || report.filePath;
      }
      if (!reportDownloadUrl && workflow?.output_file_path) {
        reportFilePath = workflow.output_file_path;
        const fileName = reportFilePath.split("/").pop();
        reportDownloadUrl = `http://localhost:8000/api/v1/reports/download/${fileName}`;
      }
      const reportFileName = reportFilePath ? reportFilePath.split("/").pop() : "report.xlsx";

      if (workflow) {
        let rawNodes = workflow.nodes || workflow.workflow_definition?.nodes || [];
        let rawEdges = workflow.edges || workflow.workflow_definition?.edges || [];
        if (rawNodes && rawNodes.length > 0) {
          const safeNodes = mapBackendNodesToFrontend(
            rawNodes,
            workflow.name || "",
            workflow.report_type || "",
          );
          const mappedEdges = mapBackendEdgesToFrontend(rawEdges || [], safeNodes);
          const safeEdges = mappedEdges.filter(
            (edge): edge is NonNullable<typeof edge> => edge !== null,
          );
          updateConfig({
            ...config,
            name: workflow.name || config.name,
            nodes: safeNodes,
            edges: safeEdges,
            reportId,
            reportUrl: reportDownloadUrl,
            reportFileName,
          });
        }
      }

      const hasReport = reportDownloadUrl && reportFilePath;
      let assistantMessage =
        "✅ **Workflow Created Successfully**\n\nYour workflow has been generated and is ready to execute.";
      if (hasReport) {
        assistantMessage = `✅ **Report Generated Successfully**\n\n📊 **Report** is ready for review.\n\nSwitch to the Report tab to view the interactive dashboard.`;
        setTimeout(() => {
          if (onSwitchToReport && reportDownloadUrl)
            onSwitchToReport(reportDownloadUrl, reportFileName);
        }, 1500);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage,
          reportUrl: reportDownloadUrl,
          reportFileName,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ System connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSend };
};
