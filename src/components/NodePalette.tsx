import React, { useState } from 'react';
import { 
  Workflow, Clock, Mail, Database, GitBranch, Code,
  FileText, GitCompare, DollarSign, Calendar, BarChart,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { NodeTemplate, NodeType } from '@/types/index';

// Only include nodes that are actually functional
const NODE_TEMPLATES: NodeTemplate[] = [
  // Basic Workflow Nodes
  { type: 'trigger', label: 'Trigger', icon: <Workflow className="w-5 h-5" /> },
  { type: 'email', label: 'Send Email', icon: <Mail className="w-5 h-5" /> },
  { type: 'delay', label: 'Wait', icon: <Clock className="w-5 h-5" /> },
  { type: 'export', label: 'Export Data', icon: <Database className="w-5 h-5" /> },
  { type: 'condition', label: 'If/Else', icon: <GitBranch className="w-5 h-5" /> },
  { type: 'code', label: 'Code', icon: <Code className="w-5 h-5" /> },
  
  // Backend Agent Nodes (Working in your system)
  { type: 'parser', label: 'Fetch Invoices', icon: <FileText className="w-5 h-5" /> },
  { type: 'allocator', label: 'Calculate Outstanding', icon: <DollarSign className="w-5 h-5" /> },
  { type: 'aging', label: 'Calculate Aging', icon: <Calendar className="w-5 h-5" /> },
  { type: 'matcher', label: 'Group/Filter', icon: <GitCompare className="w-5 h-5" /> },
  { type: 'vizagent', label: 'Calculate Summary', icon: <BarChart className="w-5 h-5" /> },
];

export const NodePalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
    
    // Auto-close the dropdown after drag starts
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  return (
    <div className="p-3 bg-gray-50 border-b relative">
      {/* Dropdown Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">
          Add Nodes (Drag & Drop)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-3 right-3 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {/* Basic Workflow Section */}
          <div className="p-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Basic Workflow
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {NODE_TEMPLATES.slice(0, 6).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type, template.label)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-all text-sm cursor-move"
                >
                  {template.icon}
                  <span className="text-xs">{template.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Backend Agents Section */}
          <div className="p-3 border-t">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Backend Agents
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TEMPLATES.slice(6).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type, template.label)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-all text-sm cursor-move"
                >
                  {template.icon}
                  <span className="text-xs">{template.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Footer */}
          <div className="p-3 bg-blue-50 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> Drag nodes onto the canvas to build your workflow. 
              Backend agent nodes execute server-side logic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};