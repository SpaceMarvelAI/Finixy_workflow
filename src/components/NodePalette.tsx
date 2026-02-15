import React, { useState } from "react";
import {
  Workflow,
  Clock,
  Mail,
  Database,
  GitBranch,
  Code,
  FileText,
  GitCompare,
  DollarSign,
  Calendar,
  BarChart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { NodeTemplate, NodeType } from "@/types/index";

// Only include nodes that are actually functional
const NODE_TEMPLATES: NodeTemplate[] = [
  // Basic Workflow Nodes
  { type: "trigger", label: "Trigger", icon: <Workflow className="w-5 h-5" /> },
  { type: "email", label: "Send Email", icon: <Mail className="w-5 h-5" /> },
  { type: "delay", label: "Wait", icon: <Clock className="w-5 h-5" /> },
  {
    type: "export",
    label: "Export Data",
    icon: <Database className="w-5 h-5" />,
  },
  {
    type: "condition",
    label: "If/Else",
    icon: <GitBranch className="w-5 h-5" />,
  },
  { type: "code", label: "Code", icon: <Code className="w-5 h-5" /> },

  // Backend Agent Nodes (Working in your system)
  {
    type: "parser",
    label: "Fetch Invoices",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    type: "allocator",
    label: "Calculate Outstanding",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    type: "aging",
    label: "Calculate Aging",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    type: "matcher",
    label: "Group/Filter",
    icon: <GitCompare className="w-5 h-5" />,
  },
  {
    type: "vizagent",
    label: "Calculate Summary",
    icon: <BarChart className="w-5 h-5" />,
  },
];

export const NodePalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onDragStart = (
    event: React.DragEvent,
    nodeType: NodeType,
    label: string,
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ nodeType, label }),
    );
    event.dataTransfer.effectAllowed = "move";

    // Auto-close the dropdown after drag starts
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  return (
    <div className="p-3 bg-black border-b border-gray-800 relative">
      {/* Dropdown Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all shadow-lg backdrop-blur-sm"
      >
        <span className="text-sm font-semibold text-gray-100 tracking-wide">
          Add Nodes (Drag & Drop)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-blue-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-3 right-3 mt-2 bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50 backdrop-blur-md">
          {/* Basic Workflow Section */}
          <div className="p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Basic Workflow
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {NODE_TEMPLATES.slice(0, 6).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) =>
                    onDragStart(e, template.type, template.label)
                  }
                  className="group flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm cursor-move backdrop-blur-sm"
                >
                  <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
                    {template.icon}
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-gray-100 font-medium">
                    {template.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backend Agents Section */}
          <div className="p-4 border-t border-gray-800">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
              Backend Agents
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TEMPLATES.slice(6).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) =>
                    onDragStart(e, template.type, template.label)
                  }
                  className="group flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm cursor-move backdrop-blur-sm"
                >
                  <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
                    {template.icon}
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-gray-100 font-medium">
                    {template.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Footer */}
          <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-t border-gray-800 backdrop-blur-sm">
            <p className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">💡</span>
              <span>
                <strong className="text-gray-300">Tip:</strong> Drag nodes onto
                the canvas to build your workflow. Backend agent nodes execute
                server-side logic.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
