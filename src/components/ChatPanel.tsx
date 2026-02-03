import React, { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { ChatMessage } from "@/types/index";
import { useWorkflow } from "../store/WorkflowContext"; 
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
import { chatService, authService } from "../services/api";
import { mapBackendNodesToFrontend } from "../utils/workflowMapper";

export const ChatPanel: React.FC = () => {
  const { config, updateConfig,sessionId,chatHistory } = useWorkflow();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_CHAT_MESSAGE },
  ]); 

  // --- AUTO LOGIN LOGIC ---
  useEffect(() => {
    setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
    setInput("");
    setLoading(false);
  }, [sessionId]);

  // ✅ 2. NEW: Sync Chat History when Sidebar loads a workflow
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);
  
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) autoLogin();
  }, []);

  const autoLogin = async () => {
    try {
      const response = await authService.login("test@example.com", "password123");
      if (response.access_token) {
        localStorage.setItem("access_token", response.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-login failed:", error);
      return false;
    }
  };

  const retryWithNewToken = async () => {
    localStorage.removeItem("access_token");
    return await autoLogin();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Check token before sending
    if (!localStorage.getItem("access_token")) {
      const success = await autoLogin();
      if (!success) {
        setMessages((prev) => [...prev, { role: "assistant", content: "❌ Authentication required." }]);
        return;
      }
    }

    const originalInput = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: originalInput }]);
    setLoading(true);

    try {
      let response: any;
      try {
        response = await chatService.sendQuery(originalInput);
      } catch (error: any) {
        if (error.response?.status === 401) {
          const success = await retryWithNewToken();
          if (success) {
            response = await chatService.sendQuery(originalInput);
          } else {
            throw new Error("Authentication failed");
          }
        } else {
          throw error;
        }
      }

      const { workflow, report } = response.data;

      if (workflow && workflow.nodes) {
        const workflowName = workflow.name || "";
        const reportType = workflow.report_type || "";

        // ✅ USE SHARED MAPPER
        const safeNodes = mapBackendNodesToFrontend(workflow.nodes, workflowName, reportType);

        const safeEdges = safeNodes.slice(0, -1).map((node: any, i: number) => ({
          id: `e-${node.id}-${safeNodes[i + 1].id}`,
          source: node.id,
          target: safeNodes[i + 1].id,
          type: "custom",
          animated: true,
          style: { stroke: "#b1b1b7", strokeWidth: 2 },
        }));

        updateConfig({
          ...config,
          nodes: safeNodes,
          edges: safeEdges,
          lastModified: new Date().toISOString(),
        });
      }

      let aiResponseContent = `I've created the "${workflow.name || "Custom"}" workflow.`;
      if (report?.download_url) {
        aiResponseContent += `\n\nGenerated report: ${report.download_url}`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponseContent }]);

    } catch (error: any) {
      console.error("Chat Error:", error);
      let errorMsg = "Sorry, error connecting to server.";
      if (error.response?.status === 401) errorMsg = "Authentication failed.";
      else if (error.response?.status === 500) errorMsg = "Server error.";
      else if (error.message?.includes("Network")) errorMsg = "Network error. Check backend.";

      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <h2 className="text-lg font-bold">Finixy Workflow Assistant</h2>
        <p className="text-sm opacity-90">Connected to Metaspace AI</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">    
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={loading ? "Processing..." : "Describe your workflow..."}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </div>
      </div>
    </div>
  );
};