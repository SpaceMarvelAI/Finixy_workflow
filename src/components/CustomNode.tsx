import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Workflow, Clock, Mail, Database, GitBranch, Code, Pause, Repeat,
  FileText, CheckCircle, GitCompare, Copy, AlertTriangle, Receipt,
  DollarSign, Calendar, Scale, Tags, RefreshCw, ScrollText, BarChart3, 
  TrendingUp, FileSpreadsheet, Shield, Brain, Terminal, BarChart, 
  Container, Play, Lightbulb, Table, Lock, Archive, Settings
} from 'lucide-react';
import { NodeData } from '@/types/index';
import { NODE_COLORS } from '@utils/constants';
import { useWorkflow } from '@store/WorkflowContext';

interface CustomNodeProps {
  data: NodeData;
  id: string;
}

// Default icon for fallback
const DEFAULT_ICON = <Settings className="w-4 h-4" />;

const NODE_ICONS: Record<string, React.ReactNode> = {
  trigger: <Workflow className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  export: <Database className="w-4 h-4" />,
  delay: <Clock className="w-4 h-4" />,
  condition: <GitBranch className="w-4 h-4" />,
  loop: <Repeat className="w-4 h-4" />,
  approval: <Pause className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  
  // Part One agents
  parser: <FileText className="w-4 h-4" />,
  validator: <CheckCircle className="w-4 h-4" />,
  matcher: <GitCompare className="w-4 h-4" />,
  duplicate: <Copy className="w-4 h-4" />,
  exception: <AlertTriangle className="w-4 h-4" />,
  billing: <Receipt className="w-4 h-4" />,
  
  // Part Two agents
  allocator: <DollarSign className="w-4 h-4" />,
  aging: <Calendar className="w-4 h-4" />,
  recon: <Scale className="w-4 h-4" />,
  variance: <Tags className="w-4 h-4" />,
  erpsync: <RefreshCw className="w-4 h-4" />,
  logger: <ScrollText className="w-4 h-4" />,
  apreporting: <BarChart3 className="w-4 h-4" />,
  arreporting: <TrendingUp className="w-4 h-4" />,
  
  // Part Three agents
  reconreporting: <FileSpreadsheet className="w-4 h-4" />,
  auditreporting: <Shield className="w-4 h-4" />,
  
  // Part Four agents
  orchestrator: <Brain className="w-4 h-4" />,
  codeagent: <Terminal className="w-4 h-4" />,
  vizagent: <BarChart className="w-4 h-4" />,
  sandbox: <Container className="w-4 h-4" />,
  livecode: <Play className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
  datagrid: <Table className="w-4 h-4" />,
  guardrails: <Lock className="w-4 h-4" />,
  memory: <Archive className="w-4 h-4" />,
};

// Define the component logic separately
const CustomNodeComponent: React.FC<CustomNodeProps> = ({ data, id }) => {
  const { setSelectedNode } = useWorkflow();

  // --- SAFETY CHECKS ---
  const safeData = data || {} as NodeData;
  const config = safeData.config || {};

  // 1. Determine Node Type safely
  const rawType = safeData.nodeType || 'code';
  const nodeType = NODE_ICONS[rawType] ? rawType : 'code';

  // 2. Determine Display Text
  const label = safeData.label || safeData.name || config.name || 'Node';
  const name = config.name || safeData.name || label;
  const description = config.description || safeData.description || '';

  // 3. Determine Styling
  const colorClass = NODE_COLORS?.[nodeType] || 'bg-gray-500';
  const icon = NODE_ICONS[nodeType] || DEFAULT_ICON;

  const isConditionNode = nodeType === 'condition';

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer min-w-[200px]"
      onClick={() => setSelectedNode(id)}
    >
      {nodeType !== 'trigger' && (
        <Handle type="target" position={Position.Top} className="w-3 h-3" />
      )}
      
      <div className={`${colorClass} text-white px-4 py-2 rounded-t-md flex items-center gap-2`}>
        {icon}
        <span className="font-semibold text-sm capitalize">{label}</span>
      </div>
      
      <div className="px-4 py-3 text-sm text-gray-700">
        <div className="font-medium">{name}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-1 truncate max-w-[180px]" title={description}>
            {description}
          </div>
        )}
      </div>
      
      {isConditionNode ? (
        <>
          <div className="absolute bottom-0 left-8 transform translate-y-1/2 flex flex-col items-center">
            <Handle 
              type="source" position={Position.Bottom} id="if"
              className="w-3 h-3 bg-green-500"
              style={{ position: 'relative', left: 0, bottom: 0, transform: 'none' }}
            />
            <span className="text-xs font-semibold text-green-600 bg-white px-2 py-1 rounded shadow-sm mt-1 whitespace-nowrap">IF</span>
          </div>
          
          <div className="absolute bottom-0 right-8 transform translate-y-1/2 flex flex-col items-center">
            <Handle 
              type="source" position={Position.Bottom} id="else"
              className="w-3 h-3 bg-red-500"
              style={{ position: 'relative', right: 0, bottom: 0, transform: 'none' }}
            />
            <span className="text-xs font-semibold text-red-600 bg-white px-2 py-1 rounded shadow-sm mt-1 whitespace-nowrap">ELSE</span>
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      )}
    </div>
  );
};

// --- FIX: Export as a Named Export wrapped in memo ---
export const CustomNode = memo(CustomNodeComponent);