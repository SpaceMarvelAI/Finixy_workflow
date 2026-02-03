
export const REPORT_TEMPLATES: Record<string, any[]> = {
  'AP_AGING': [
    { title: "Fetch Purchase Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" },
    { title: "Calculate Aging Days", type: "aging" },
    { title: "Group by Bucket", type: "matcher" },
    { title: "Calculate Summary", type: "vizagent" },
    { title: "Export Excel", type: "export" }
  ],
  'AP_OVERDUE': [
    { title: "Fetch Purchase Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" },
    { title: "Check SLA Breaches", type: "condition" },
    { title: "Filter by Severity", type: "condition" },
    { title: "Sort by Overdue", type: "allocator" },
    { title: "Generate Report", type: "export" }
  ],
  'AP_DUPLICATE': [
    { title: "Fetch Purchase Invoices", type: "parser" },
    { title: "Detect Duplicates", type: "matcher" },
    { title: "Filter Confidence", type: "condition" },
    { title: "Generate Report", type: "export" }
  ],
  'AP_REGISTER': [
    { title: "Fetch All Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" },
    { title: "Filter Paid Status", type: "condition" },
    { title: "Format Data", type: "code" },
    { title: "Calculate Totals", type: "vizagent" },
    { title: "Export Register", type: "export" }
  ],
  'AR_AGING': [
    { title: "Fetch Sales Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" },
    { title: "Calculate Aging Days", type: "aging" },
    { title: "Group by Bucket", type: "matcher" },
    { title: "Calculate Summary", type: "vizagent" },
    { title: "Export Excel", type: "export" }
  ],
  'AR_REGISTER': [
    { title: "Fetch Sales Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" },
    { title: "Filter Paid Status", type: "condition" },
    { title: "Format Data", type: "code" },
    { title: "Calculate Totals", type: "vizagent" },
    { title: "Export Register", type: "export" }
  ],
  'AR_COLLECTION': [
    { title: "Fetch Sales Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" }
  ],
  'DSO': [
    { title: "Fetch Sales Invoices", type: "parser" },
    { title: "Calculate Outstanding", type: "allocator" },
    { title: "Calculate DSO", type: "aging" },
    { title: "Generate Report", type: "export" }
  ]
};

// Also support lowercase keys mapping
Object.keys(REPORT_TEMPLATES).forEach(key => {
  REPORT_TEMPLATES[key.toLowerCase()] = REPORT_TEMPLATES[key];
});

export const mapBackendNodesToFrontend = (backendNodes: any[], workflowName: string, reportType: string) => {
  console.log("\n=== MAPPING NODES (Shared Utility) ===");
  
  let template: any[] = [];

  // 1. Try match by reportType
  if (reportType && REPORT_TEMPLATES[reportType]) {
    template = REPORT_TEMPLATES[reportType];
  } 
  // 2. Try match by workflowName
  else if (workflowName) {
    const key = Object.keys(REPORT_TEMPLATES).find(k => 
      k.toLowerCase() === workflowName.toLowerCase() ||
      workflowName.toUpperCase().includes(k)
    );
    if (key) template = REPORT_TEMPLATES[key];
  }

  // If backendNodes is empty/null, use the template to generate nodes
  const nodesToProcess = (backendNodes && backendNodes.length > 0) ? backendNodes : template;

  return nodesToProcess.map((node: any, index: number) => {
    const nodeId = node.id || `step_${index + 1}`;
    const rawType = node.node_type || node.type || ""; 
    const templateNode = template[index] || {};

    // Determine Label
    const displayName = node.title || node.name || node.label || templateNode.title || `Step ${index + 1}`;

    // Determine Frontend Icon Type
    let frontendType = templateNode.type || 'code';
    
    // Heuristic fallback if type is missing
    if (!frontendType || frontendType === 'code' || frontendType === 'custom') {
        const nameCheck = displayName.toLowerCase();
        const rawTypeCheck = rawType.toLowerCase();
        
        if (nameCheck.includes('fetch') || rawTypeCheck.includes('fetch')) frontendType = 'parser';
        else if (nameCheck.includes('aging') || nameCheck.includes('dso')) frontendType = 'aging';
        else if (nameCheck.includes('excel') || nameCheck.includes('export') || nameCheck.includes('report')) frontendType = 'export';
        else if (nameCheck.includes('outstanding') || nameCheck.includes('calculate')) frontendType = 'allocator';
        else if (nameCheck.includes('sum') || nameCheck.includes('total')) frontendType = 'vizagent';
        else if (nameCheck.includes('filter') || nameCheck.includes('check')) frontendType = 'condition';
        else if (nameCheck.includes('sort') || nameCheck.includes('group') || nameCheck.includes('duplicate')) frontendType = 'matcher';
    }

    // Return structure for React Flow
    return {
      id: nodeId,
      type: "custom", // Forces CustomNode.tsx
      // Fixes the "reading 'x' of undefined" crash
      position: node.position || { x: 250, y: 50 + (index * 180) }, 
      data: {
        ...node.data,
        label: displayName,     
        nodeType: frontendType, 
        name: displayName,
        description: node.description || templateNode.title || "",
        params: node.params || {}
      }
    };
  });
};