import { Edge } from 'reactflow';

export type NodeType = 
  | 'trigger' 
  | 'email' 
  | 'export' 
  | 'delay' 
  | 'condition' 
  | 'loop' 
  | 'approval' 
  | 'code'
  | 'parser'
  | 'validator'
  | 'matcher'
  | 'duplicate'
  | 'exception'
  | 'billing'
  | 'allocator'
  | 'aging'
  | 'recon'
  | 'variance'
  | 'erpsync'
  | 'logger'
  | 'apreporting'
  | 'arreporting'
  | 'reconreporting'
  | 'auditreporting'
  | 'orchestrator'
  | 'codeagent'
  | 'vizagent'
  | 'sandbox'
  | 'livecode'
  | 'insight'
  | 'datagrid'
  | 'guardrails'
  | 'memory';

export interface NodeConfig {
  name: string;
  description?: string;
  
  // Email node
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  
  // Delay node
  delayAmount?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
  
  // Export node
  exportFormat?: 'CSV' | 'JSON' | 'PDF';
  
  // Condition node
  condition?: string;
  
  // Code node
  code?: string;
  
  // Trigger node
  triggerType?: 'manual' | 'scheduled' | 'webhook' | 'file_upload';
  schedule?: string;
  uploadedFiles?: Array<{
    name: string;
    size: number;
    type: string;
    data?: string;
    uploadedAt?: string;
  }>;
  acceptedFileTypes?: string;
  
  // Parser Agent (FR-01)
  emailInbox?: string;
  apiEndpoint?: string;
  ocrEnabled?: boolean;
  
  // Validator Agent (FR-02)
  masterDataSource?: string;
  validationRules?: string;
  arithmeticCheck?: boolean;
  
  // Matcher Agent (FR-03)
  quantityField?: string;
  priceField?: string;
  tolerancePercentage?: number;
  autoApprove?: boolean;
  
  // Duplicate Detection (FR-04)
  vendorIdField?: string;
  invoiceNoField?: string;
  duplicateAction?: 'flag' | 'reject' | 'merge';
  
  // Exception Agent (FR-05)
  exceptionTypes?: string[];
  reviewQueueUrl?: string;
  notifyEmail?: string;
  
  // Billing Agent (FR-06)
  invoiceTemplate?: string;
  customerEmailField?: string;
  triggerEvent?: string;
  
  // Allocator Agent (FR-07)
  bankCreditField?: string;
  invoiceRefField?: string;
  allocationMethod?: 'exact' | 'fifo' | 'manual';
  
  // Aging & DSO Calc Agent (FR-08)
  agingBuckets?: string;
  dsoFormula?: string;
  calculationPeriod?: 'daily' | 'weekly' | 'monthly';
  
  // Recon Agent (FR-09)
  bankStatementSource?: string;
  erpLedgerSource?: string;
  matchingRules?: string;
  toleranceAmount?: number;
  
  // Variance Categorization (FR-10)
  varianceCategories?: string[];
  autoCategorizationRules?: string;
  
  // ERP Sync Agent (FR-11)
  erpSystem?: 'SAP' | 'Tally' | 'Oracle' | 'Custom';
  erpEndpoint?: string;
  dataFormat?: 'JSON' | 'XML';
  syncFrequency?: string;
  
  // Logger Agent (FR-12)
  logLevel?: 'info' | 'warning' | 'error' | 'debug';
  logDestination?: string;
  includeTimestamp?: boolean;
  includeSeverity?: boolean;
  
  // AP Reporting Pack (FR-13)
  reportTypes?: string[];
  outputFormat?: 'PDF' | 'Excel' | 'CSV';
  scheduleReport?: string;
  
  // AR Reporting Pack (FR-14)
  arReportTypes?: string[];
  arOutputFormat?: 'PDF' | 'Excel' | 'CSV';
  arScheduleReport?: string;
  
  // Recon Reporting Pack (FR-15)
  reconReportTypes?: string[];
  reconOutputFormat?: 'PDF' | 'Excel' | 'CSV';
  reconSchedule?: string;
  reconDataSource?: string;
  
  // System Audit Reporting (FR-16)
  auditReportTypes?: string[];
  auditOutputFormat?: 'PDF' | 'Excel' | 'CSV';
  auditSchedule?: string;
  logSourceTable?: string;
  auditPeriod?: string;
  
  // Orchestrator Agent (FR-2.01)
  vectorDbEndpoint?: string;
  semanticLayerTables?: string[];
  intentParsingModel?: string;
  
  // Code Agent (FR-2.02)
  databaseType?: 'PostgreSQL' | 'MySQL' | 'SQLite' | 'MongoDB';
  schemaSource?: string;
  autoAggregation?: boolean;
  respectForeignKeys?: boolean;
  
  // Viz Agent (FR-2.03)
  vizLibrary?: 'D3.js' | 'Chart.js' | 'Plotly' | 'Recharts';
  chartType?: string;
  d3ConfigFormat?: 'JSON' | 'Function';
  
  // Sandbox Agent (FR-2.04)
  sandboxType?: 'Docker' | 'WASM' | 'VM';
  executionTimeout?: number;
  memoryLimit?: string;
  securityLevel?: 'strict' | 'moderate' | 'permissive';
  
  // Live Code Editor (FR-2.05)
  editorTheme?: 'vs-dark' | 'vs-light' | 'monokai';
  autoSave?: boolean;
  syntaxHighlighting?: boolean;
  
  // Insight Agent (FR-2.06)
  analysisTypes?: string[];
  narrativeStyle?: 'technical' | 'business' | 'executive';
  includeRecommendations?: boolean;
  
  // Data Grid (FR-2.07)
  gridLibrary?: 'ag-Grid' | 'React Table' | 'Material Table';
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableExport?: boolean;
  
  // Guardrails (FR-2.08)
  blockedKeywords?: string[];
  allowedOperations?: string[];
  securityMode?: 'strict' | 'moderate';
  
  // Memory Agent (FR-2.09)
  conversationHistoryLimit?: number;
  contextRetention?: 'session' | 'persistent';
  datasetCacheEnabled?: boolean;
}

export interface NodeData {
  label: string;
  nodeType: NodeType;
  config: NodeConfig;
  name?: string;
  description?: string; 
  params?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowConfig {
  name: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  lastModified: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  defaultConfig?: Partial<NodeConfig>;
}