import { NodeType } from '@/types/index';

export const NODE_COLORS: Record<NodeType, string> = {
  // Original nodes
  trigger: 'bg-purple-500',
  email: 'bg-blue-500',
  export: 'bg-green-500',
  delay: 'bg-yellow-500',
  condition: 'bg-orange-500',
  loop: 'bg-pink-500',
  approval: 'bg-red-500',
  code: 'bg-gray-700',
  
  // Part One agents (FR-01 to FR-06)
  parser: 'bg-amber-600',
  validator: 'bg-teal-500',
  matcher: 'bg-indigo-500',
  duplicate: 'bg-rose-600',
  exception: 'bg-orange-600',
  billing: 'bg-cyan-500',
  
  // Part Two agents (FR-07 to FR-14)
  allocator: 'bg-lime-600',
  aging: 'bg-emerald-600',
  recon: 'bg-sky-600',
  variance: 'bg-violet-600',
  erpsync: 'bg-fuchsia-600',
  logger: 'bg-slate-600',
  apreporting: 'bg-blue-700',
  arreporting: 'bg-green-700',
  
  // Part Three agents (FR-15 to FR-16)
  reconreporting: 'bg-purple-700',
  auditreporting: 'bg-gray-800',
  
  // Part Four agents (FR-2.01 to FR-2.09) - Data Intelligence Agents
  orchestrator: 'bg-blue-600',
  codeagent: 'bg-green-600',
  vizagent: 'bg-purple-600',
  sandbox: 'bg-red-700',
  livecode: 'bg-yellow-600',
  insight: 'bg-pink-600',
  datagrid: 'bg-cyan-600',
  guardrails: 'bg-orange-700',
  memory: 'bg-indigo-700',
};

export const DEFAULT_NODE_POSITION = {
  x: 250,
  y: 100,
};

export const NODE_SPACING_Y = 120;

export const INITIAL_CHAT_MESSAGE = 
  'Hi! Describe your workflow in plain English and I\'ll help you build it. For example: "When a user signs up, wait 2 days, then send them a welcome email"';