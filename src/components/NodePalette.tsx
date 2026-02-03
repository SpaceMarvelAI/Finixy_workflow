// import React, { useState } from 'react';
// import { 
//   Workflow, Clock, Mail, Database, GitBranch, Code, Pause, Repeat, 
//   ChevronDown, ChevronUp, FileText, CheckCircle, GitCompare, Copy, 
//   AlertTriangle, Receipt, DollarSign, Calendar, Scale, Tags,
//   RefreshCw, ScrollText, BarChart3, TrendingUp, FileSpreadsheet, Shield
// } from 'lucide-react';
// import { NodeTemplate, NodeType } from '@/types/index';

// const NODE_TEMPLATES: NodeTemplate[] = [
//   // Original nodes
//   { type: 'trigger', label: 'Trigger', icon: <Workflow className="w-5 h-5" /> },
//   { type: 'email', label: 'Send Email', icon: <Mail className="w-5 h-5" /> },
//   { type: 'delay', label: 'Wait', icon: <Clock className="w-5 h-5" /> },
//   { type: 'export', label: 'Export Data', icon: <Database className="w-5 h-5" /> },
//   { type: 'condition', label: 'If/Else', icon: <GitBranch className="w-5 h-5" /> },
//   { type: 'loop', label: 'Loop', icon: <Repeat className="w-5 h-5" /> },
//   { type: 'approval', label: 'Approval', icon: <Pause className="w-5 h-5" /> },
//   { type: 'code', label: 'Code', icon: <Code className="w-5 h-5" /> },
  
//   // Part One agents (FR-01 to FR-06)
//   { type: 'parser', label: 'Parser Agent', icon: <FileText className="w-5 h-5" /> },
//   { type: 'validator', label: 'Validator Agent', icon: <CheckCircle className="w-5 h-5" /> },
//   { type: 'matcher', label: 'Matcher Agent', icon: <GitCompare className="w-5 h-5" /> },
//   { type: 'duplicate', label: 'Duplicate Detection', icon: <Copy className="w-5 h-5" /> },
//   { type: 'exception', label: 'Exception Agent', icon: <AlertTriangle className="w-5 h-5" /> },
//   { type: 'billing', label: 'Billing Agent', icon: <Receipt className="w-5 h-5" /> },
  
//   // Part Two agents (FR-07 to FR-14)
//   { type: 'allocator', label: 'Allocator Agent', icon: <DollarSign className="w-5 h-5" /> },
//   { type: 'aging', label: 'Aging & DSO Calc', icon: <Calendar className="w-5 h-5" /> },
//   { type: 'recon', label: 'Recon Agent', icon: <Scale className="w-5 h-5" /> },
//   { type: 'variance', label: 'Variance Categorization', icon: <Tags className="w-5 h-5" /> },
//   { type: 'erpsync', label: 'ERP Sync', icon: <RefreshCw className="w-5 h-5" /> },
//   { type: 'logger', label: 'SIEM Logger', icon: <ScrollText className="w-5 h-5" /> },
//   { type: 'apreporting', label: 'AP Reporting', icon: <BarChart3 className="w-5 h-5" /> },
//   { type: 'arreporting', label: 'AR Reporting', icon: <TrendingUp className="w-5 h-5" /> },
  
//   // Part Three agents (FR-15 to FR-16)
//   { type: 'reconreporting', label: 'Recon Reporting', icon: <FileSpreadsheet className="w-5 h-5" /> },
//   { type: 'auditreporting', label: 'Audit Reporting', icon: <Shield className="w-5 h-5" /> },
// ];

// export const NodePalette: React.FC = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string) => {
//     event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label }));
//     event.dataTransfer.effectAllowed = 'move';
    
//     // Auto-close the dropdown after drag starts (small delay to ensure drag registers)
//     setTimeout(() => {
//       setIsOpen(false);
//     }, 100);
//   };

//   return (
//     <div className="p-3 bg-gray-50 border-b relative">
//       {/* Dropdown Toggle Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//       >
//         <span className="text-sm font-semibold text-gray-700">Add Nodes (Drag & Drop)</span>
//         {isOpen ? (
//           <ChevronUp className="w-4 h-4 text-gray-600" />
//         ) : (
//           <ChevronDown className="w-4 h-4 text-gray-600" />
//         )}
//       </button>

//       {/* Dropdown Menu - Absolutely Positioned */}
//       {isOpen && (
//         <div className="absolute left-3 right-3 mt-2 grid grid-cols-4 gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
//           {NODE_TEMPLATES.map((template) => (
//             <div
//               key={template.type}
//               draggable
//               onDragStart={(e) => onDragStart(e, template.type, template.label)}
//               className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-all text-sm cursor-move"
//             >
//               {template.icon}
//               <span>{template.label}</span>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useState } from 'react';
import { 
  Workflow, Clock, Mail, Database, GitBranch, Code, Pause, Repeat, 
  ChevronDown, ChevronUp, FileText, CheckCircle, GitCompare, Copy, 
  AlertTriangle, Receipt, DollarSign, Calendar, Scale, Tags,
  RefreshCw, ScrollText, BarChart3, TrendingUp, FileSpreadsheet, Shield,
  Brain, Terminal, BarChart, Container, Play, Lightbulb, Table, Lock, Archive
} from 'lucide-react';
import { NodeTemplate, NodeType } from '@/types/index';

const NODE_TEMPLATES: NodeTemplate[] = [
  // Original nodes
  { type: 'trigger', label: 'Trigger', icon: <Workflow className="w-5 h-5" /> },
  { type: 'email', label: 'Send Email', icon: <Mail className="w-5 h-5" /> },
  { type: 'delay', label: 'Wait', icon: <Clock className="w-5 h-5" /> },
  { type: 'export', label: 'Export Data', icon: <Database className="w-5 h-5" /> },
  { type: 'condition', label: 'If/Else', icon: <GitBranch className="w-5 h-5" /> },
  { type: 'loop', label: 'Loop', icon: <Repeat className="w-5 h-5" /> },
  { type: 'approval', label: 'Approval', icon: <Pause className="w-5 h-5" /> },
  { type: 'code', label: 'Code', icon: <Code className="w-5 h-5" /> },
  
  // Part One agents (FR-01 to FR-06)
  { type: 'parser', label: 'Parser Agent', icon: <FileText className="w-5 h-5" /> },
  { type: 'validator', label: 'Validator Agent', icon: <CheckCircle className="w-5 h-5" /> },
  { type: 'matcher', label: 'Matcher Agent', icon: <GitCompare className="w-5 h-5" /> },
  { type: 'duplicate', label: 'Duplicate Detection', icon: <Copy className="w-5 h-5" /> },
  { type: 'exception', label: 'Exception Agent', icon: <AlertTriangle className="w-5 h-5" /> },
  { type: 'billing', label: 'Billing Agent', icon: <Receipt className="w-5 h-5" /> },
  
  // Part Two agents (FR-07 to FR-14)
  { type: 'allocator', label: 'Allocator Agent', icon: <DollarSign className="w-5 h-5" /> },
  { type: 'aging', label: 'Aging & DSO Calc', icon: <Calendar className="w-5 h-5" /> },
  { type: 'recon', label: 'Recon Agent', icon: <Scale className="w-5 h-5" /> },
  { type: 'variance', label: 'Variance Categorization', icon: <Tags className="w-5 h-5" /> },
  { type: 'erpsync', label: 'ERP Sync', icon: <RefreshCw className="w-5 h-5" /> },
  { type: 'logger', label: 'SIEM Logger', icon: <ScrollText className="w-5 h-5" /> },
  { type: 'apreporting', label: 'AP Reporting', icon: <BarChart3 className="w-5 h-5" /> },
  { type: 'arreporting', label: 'AR Reporting', icon: <TrendingUp className="w-5 h-5" /> },
  
  // Part Three agents (FR-15 to FR-16)
  { type: 'reconreporting', label: 'Recon Reporting', icon: <FileSpreadsheet className="w-5 h-5" /> },
  { type: 'auditreporting', label: 'Audit Reporting', icon: <Shield className="w-5 h-5" /> },
  
  // Part Four agents (FR-2.01 to FR-2.09) - Data Intelligence
  { type: 'orchestrator', label: 'Orchestrator Agent', icon: <Brain className="w-5 h-5" /> },
  { type: 'codeagent', label: 'Code Agent', icon: <Terminal className="w-5 h-5" /> },
  { type: 'vizagent', label: 'Viz Agent', icon: <BarChart className="w-5 h-5" /> },
  { type: 'sandbox', label: 'Sandbox', icon: <Container className="w-5 h-5" /> },
  { type: 'livecode', label: 'Live Code Editor', icon: <Play className="w-5 h-5" /> },
  { type: 'insight', label: 'Insight Agent', icon: <Lightbulb className="w-5 h-5" /> },
  { type: 'datagrid', label: 'Data Grid', icon: <Table className="w-5 h-5" /> },
  { type: 'guardrails', label: 'Guardrails', icon: <Lock className="w-5 h-5" /> },
  { type: 'memory', label: 'Memory Agent', icon: <Archive className="w-5 h-5" /> },
];

export const NodePalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
    
    // Auto-close the dropdown after drag starts (small delay to ensure drag registers)
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
        <span className="text-sm font-semibold text-gray-700">Add Nodes (Drag & Drop)</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu - Absolute positioned */}
      {isOpen && (
        <div className="absolute left-3 right-3 mt-2 grid grid-cols-4 gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {NODE_TEMPLATES.map((template) => (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => onDragStart(e, template.type, template.label)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-all text-sm cursor-move"
            >
              {template.icon}
              <span>{template.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};