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

// Helper function to check if description is meaningful
const isDescriptionMeaningful = (description: string, name: string): boolean => {
  if (!description || !description.trim()) return false;
  
  const cleanDesc = description.trim().toLowerCase();
  const cleanName = name.trim().toLowerCase();
  
  // Filter out empty or very short descriptions
  if (cleanDesc.length < 5) return false;
  
  // Filter out if description is exactly the same as name
  if (cleanDesc === cleanName) return false;
  
  // Filter out if description is just name with different case/spacing
  if (cleanDesc.replace(/\s+/g, '') === cleanName.replace(/\s+/g, '')) return false;
  
  // Filter out if name fully contains description or vice versa
  if (cleanName.includes(cleanDesc) || cleanDesc.includes(cleanName)) return false;
  
  // Common action verbs that indicate a task/node name rather than description
  const actionVerbs = [
    'calculate', 'check', 'generate', 'create', 'fetch', 'send', 'export',
    'import', 'process', 'validate', 'parse', 'match', 'filter', 'sort',
    'group', 'aggregate', 'transform', 'convert', 'update', 'delete',
    'retrieve', 'store', 'save', 'load', 'execute', 'run', 'trigger',
    'monitor', 'track', 'log', 'record', 'analyze', 'report', 'notify',
    'alert', 'schedule', 'queue', 'batch', 'sync', 'merge', 'split'
  ];
  
  // Check if description starts with an action verb (indicates it's a task name, not a description)
  const descFirstWord = cleanDesc.split(/\s+/)[0];
  if (actionVerbs.includes(descFirstWord)) {
    // If description looks like a task name (verb + noun), filter it out
    const descWords = cleanDesc.split(/\s+/);
    if (descWords.length <= 4) return false;
  }
  
  // Normalize by removing common words and checking similarity
  const removeCommonWords = (text: string) => {
    const common = ['by', 'the', 'a', 'an', 'and', 'or', 'to', 'in', 'on', 'at', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been'];
    return text.split(/\s+/).filter(word => !common.includes(word)).join('');
  };
  
  const normalizedDesc = removeCommonWords(cleanDesc);
  const normalizedName = removeCommonWords(cleanName);
  
  // If after removing common words they're too similar, filter out
  if (normalizedDesc === normalizedName) return false;
  if (normalizedName.includes(normalizedDesc) || normalizedDesc.includes(normalizedName)) return false;
  
  // Get significant words (more than 3 chars) from both
  const descWords = cleanDesc.split(/\s+/).filter(w => w.length > 3);
  const nameWords = cleanName.split(/\s+/).filter(w => w.length > 3);
  
  // Check word overlap - if more than 60% of words overlap, it's redundant
  const descWordSet = new Set(descWords);
  const nameWordSet = new Set(nameWords);
  const intersection = new Set([...descWordSet].filter(word => nameWordSet.has(word)));
  const overlapRatio = intersection.size / Math.min(descWordSet.size, nameWordSet.size);
  if (overlapRatio > 0.6) return false;
  
  // Check for partial word matches (e.g., "Calculate" in "Calculate Outstanding")
  let partialMatches = 0;
  for (const descWord of descWords) {
    for (const nameWord of nameWords) {
      if (descWord === nameWord || 
          nameWord.includes(descWord) || 
          descWord.includes(nameWord) ||
          descWord.substring(0, 4) === nameWord.substring(0, 4)) {
        partialMatches++;
        break;
      }
    }
  }
  
  // If most words partially match, filter out
  if (descWords.length > 0 && partialMatches / descWords.length > 0.6) return false;
  
  // Filter out common placeholder/default descriptions
  const placeholders = ['node', 'description', 'add description', 'no description', 'n/a', 'na', 'none', '-', '...'];
  if (placeholders.includes(cleanDesc)) return false;
  
  // Filter out if description is just a shortened version of name
  const descNoSpaces = cleanDesc.replace(/\s+/g, '');
  const nameNoSpaces = cleanName.replace(/\s+/g, '');
  if (descNoSpaces.length >= 3 && nameNoSpaces.includes(descNoSpaces)) return false;
  if (nameNoSpaces.length >= 3 && descNoSpaces.includes(nameNoSpaces)) return false;
  
  // Filter out short descriptions (1-2 words) that share any key word with name
  if (descWords.length <= 2) {
    const hasSharedWord = descWords.some(descWord => 
      nameWords.some(nameWord => 
        descWord === nameWord || 
        nameWord.includes(descWord) || 
        descWord.includes(nameWord)
      )
    );
    
    if (hasSharedWord) return false;
  }
  
  // Additional check: if description is 3 words or less and 2+ words match name, filter
  if (descWords.length <= 3 && partialMatches >= 2) return false;
  
  return true;
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
  const rawDescription = config.description || safeData.description || '';
  
  // Only use description if it's genuinely meaningful and different from name
  const description = isDescriptionMeaningful(rawDescription, name) ? rawDescription : '';

  // 3. Determine Styling
  const colorClass = NODE_COLORS?.[nodeType] || 'bg-gray-500';
  const icon = NODE_ICONS[nodeType] || DEFAULT_ICON;

  const isConditionNode = nodeType === 'condition';

  return (
    <div 
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all cursor-pointer min-w-[280px] backdrop-blur-sm"
      onClick={() => setSelectedNode(id)}
      style={{
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
    >
      {nodeType !== 'trigger' && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3 !bg-blue-500 border-2 border-gray-900" 
        />
      )}
      
      {/* Header with glass effect - ONLY show name here */}
      <div 
        className={`${colorClass} text-white px-4 py-3 ${!description ? 'rounded-xl' : 'rounded-t-xl'} flex items-center gap-2 backdrop-blur-md bg-opacity-90`}
        style={{
          background: `linear-gradient(135deg, ${colorClass.includes('purple') ? '#7c3aed' : 
                       colorClass.includes('blue') ? '#3b82f6' : 
                       colorClass.includes('green') ? '#10b981' : 
                       colorClass.includes('yellow') ? '#f59e0b' : 
                       colorClass.includes('orange') ? '#f97316' : 
                       colorClass.includes('pink') ? '#ec4899' : 
                       colorClass.includes('red') ? '#ef4444' : 
                       colorClass.includes('amber') ? '#f59e0b' : 
                       colorClass.includes('teal') ? '#14b8a6' : 
                       colorClass.includes('indigo') ? '#6366f1' : 
                       colorClass.includes('rose') ? '#f43f5e' : 
                       colorClass.includes('cyan') ? '#06b6d4' : 
                       colorClass.includes('lime') ? '#84cc16' : 
                       colorClass.includes('emerald') ? '#10b981' : 
                       colorClass.includes('sky') ? '#0ea5e9' : 
                       colorClass.includes('violet') ? '#8b5cf6' : 
                       colorClass.includes('fuchsia') ? '#d946ef' : 
                       colorClass.includes('slate') ? '#64748b' : '#6b7280'} 20%, rgba(0, 0, 0, 0.3) 100%)`,
        }}
      >
        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
        <span className="font-semibold text-sm capitalize tracking-wide">{name}</span>
      </div>
      
      {/* Content with glass effect - ONLY show if description exists AND is meaningful */}
      {description && (
        <>
          <div className="px-4 py-4 text-sm bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-md">
            <div 
              className="text-xs text-gray-400 line-clamp-3 max-w-[240px]" 
              title={description}
            >
              {description}
            </div>
          </div>
          
          {/* Bottom gradient accent - only when description exists */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-xl opacity-60"></div>
        </>
      )}
      
      {isConditionNode ? (
        <>
          <div className="absolute bottom-0 left-8 transform translate-y-1/2 flex flex-col items-center">
            <Handle 
              type="source" position={Position.Bottom} id="if"
              className="w-3 h-3 !bg-green-500 border-2 border-gray-900 shadow-lg"
              style={{ position: 'relative', left: 0, bottom: 0, transform: 'none' }}
            />
            <span className="text-xs font-semibold text-green-400 bg-gray-900 px-2 py-1 rounded shadow-lg mt-1 whitespace-nowrap border border-green-500/30">
              IF
            </span>
          </div>
          
          <div className="absolute bottom-0 right-8 transform translate-y-1/2 flex flex-col items-center">
            <Handle 
              type="source" position={Position.Bottom} id="else"
              className="w-3 h-3 !bg-red-500 border-2 border-gray-900 shadow-lg"
              style={{ position: 'relative', right: 0, bottom: 0, transform: 'none' }}
            />
            <span className="text-xs font-semibold text-red-400 bg-gray-900 px-2 py-1 rounded shadow-lg mt-1 whitespace-nowrap border border-red-500/30">
              ELSE
            </span>
          </div>
        </>
      ) : (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 !bg-blue-500 border-2 border-gray-900 shadow-lg" 
        />
      )}
    </div>
  );
};

// --- FIX: Export as a Named Export wrapped in memo ---
export const CustomNode = memo(CustomNodeComponent);