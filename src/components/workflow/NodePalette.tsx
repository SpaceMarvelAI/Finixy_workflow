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

const NODE_TEMPLATES: NodeTemplate[] = [
  { type: "trigger", label: "Trigger", icon: <Workflow className="w-5 h-5" /> },
  { type: "email", label: "Send Email", icon: <Mail className="w-5 h-5" /> },
  { type: "delay", label: "Wait", icon: <Clock className="w-5 h-5" /> },
  { type: "export", label: "Export Data", icon: <Database className="w-5 h-5" /> },
  { type: "condition", label: "If/Else", icon: <GitBranch className="w-5 h-5" /> },
  { type: "code", label: "Code", icon: <Code className="w-5 h-5" /> },
  { type: "parser", label: "Fetch Invoices", icon: <FileText className="w-5 h-5" /> },
  { type: "allocator", label: "Calculate Outstanding", icon: <DollarSign className="w-5 h-5" /> },
  { type: "aging", label: "Calculate Aging", icon: <Calendar className="w-5 h-5" /> },
  { type: "matcher", label: "Group/Filter", icon: <GitCompare className="w-5 h-5" /> },
  { type: "vizagent", label: "Calculate Summary", icon: <BarChart className="w-5 h-5" /> },
];

export const NodePalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ nodeType, label }));
    event.dataTransfer.effectAllowed = "move";
    setTimeout(() => setIsOpen(false), 100);
  };

  const nodeItemClass =
    "group flex items-center gap-2 px-3 py-2.5 bg-theme-tertiary border border-theme-primary rounded-lg hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm cursor-move theme-transition";

  const agentItemClass =
    "group flex items-center gap-2 px-3 py-2.5 bg-theme-tertiary border border-theme-primary rounded-lg hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm cursor-move theme-transition";

  return (
    <div className="p-3 bg-theme-secondary border-b border-theme-primary relative theme-transition">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-theme-tertiary border border-theme-primary rounded-lg hover:border-blue-500/50 transition-all shadow-md theme-transition"
      >
        <span className="text-sm font-semibold text-theme-primary tracking-wide">
          Add Nodes (Drag &amp; Drop)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-blue-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-theme-tertiary" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-3 right-3 mt-2 theme-modal border rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50 custom-scrollbar">
          {/* Basic Workflow */}
          <div className="p-4">
            <h4 className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-lg" />
              Basic Workflow
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {NODE_TEMPLATES.slice(0, 6).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type, template.label)}
                  className={nodeItemClass}
                >
                  <div className="text-theme-tertiary group-hover:text-blue-500 transition-colors">
                    {template.icon}
                  </div>
                  <span className="text-xs text-theme-secondary group-hover:text-theme-primary font-medium">
                    {template.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backend Agents */}
          <div className="p-4 border-t border-theme-primary">
            <h4 className="text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-lg" />
              Backend Agents
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TEMPLATES.slice(6).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type, template.label)}
                  className={agentItemClass}
                >
                  <div className="text-theme-tertiary group-hover:text-purple-500 transition-colors">
                    {template.icon}
                  </div>
                  <span className="text-xs text-theme-secondary group-hover:text-theme-primary font-medium">
                    {template.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Footer */}
          <div className="p-4 bg-blue-500/5 border-t border-theme-primary">
            <p className="text-xs text-theme-secondary flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">💡</span>
              <span>
                <strong className="text-theme-primary">Tip:</strong> Drag nodes onto the canvas to
                build your workflow. Backend agent nodes execute server-side logic.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
