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
  Search,
} from "lucide-react";
import { NodeTemplate, NodeType } from "@/types/index";

const NODE_TEMPLATES: NodeTemplate[] = [
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
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    setTimeout(() => setIsOpen(false), 100);
  };

  return (
    <div className="p-1 bg-theme-secondary border-b border-theme-primary relative theme-transition">
      {/* Toggle Buttons - 50/50 split */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between px-3 py-2 bg-theme-tertiary border border-theme-primary rounded hover:border-blue-500/50 transition-all theme-transition"
        >
          <span className="text-xs font-medium text-theme-primary">
            Add Nodes (Drag &amp; Drop)
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-theme-tertiary" />
          )}
        </button>

        <button
          onClick={() => setIsCompanyOpen(!isCompanyOpen)}
          className="flex-1 flex items-center justify-between px-3 py-2 bg-theme-tertiary border border-theme-primary rounded hover:border-blue-500/50 transition-all theme-transition"
        >
          <span className="text-xs font-medium text-theme-primary">
            All Company
          </span>
          {isCompanyOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-theme-tertiary" />
          )}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-3 mt-2 theme-modal border rounded shadow-xl max-h-96 overflow-hidden z-50"
          style={{ width: "calc(50% - 16px)" }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-theme-primary">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full pl-7 pr-2 py-1 text-xs theme-input border rounded"
              />
            </div>
          </div>

          {/* Node List */}
          <div
            className="p-1 grid grid-cols-2 gap-1 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: "320px" }}
          >
            {NODE_TEMPLATES.filter((template) =>
              template.label.toLowerCase().includes(searchQuery.toLowerCase()),
            ).map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) =>
                  onDragStart(e, template.type, template.label)
                }
                className="px-2 py-1 text-xs text-theme-primary bg-theme-tertiary border border-theme-primary hover:border-blue-500/50 rounded transition-colors cursor-move"
              >
                {template.label}
              </div>
            ))}
            {NODE_TEMPLATES.filter((template) =>
              template.label.toLowerCase().includes(searchQuery.toLowerCase()),
            ).length === 0 && (
              <div className="col-span-2 text-center py-4 text-xs text-theme-tertiary">
                No nodes found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
