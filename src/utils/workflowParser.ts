import { Edge } from 'reactflow';
import { WorkflowNode } from '@/types/index';

export const parseWorkflowFromText = (text: string): { nodes: WorkflowNode[]; edges: Edge[] } => {
  const lower = text.toLowerCase();
  const newNodes: WorkflowNode[] = [];
  let yPos = 100;
  const xPos = 250;

  // Add trigger node
  newNodes.push({
    id: `node-${Date.now()}`,
    type: 'custom',
    position: { x: xPos, y: yPos },
    data: {
      label: 'Trigger',
      nodeType: 'trigger',
      config: {
        name: 'Start Workflow',
        triggerType: lower.includes('scheduled') ? 'scheduled' : 'manual',
      }
    }
  });
  yPos += 120;

  // Parse delay
  if (lower.includes('wait') || lower.includes('delay')) {
    const dayMatch = text.match(/(\d+)\s*days?/i);
    const hourMatch = text.match(/(\d+)\s*hours?/i);
    const minMatch = text.match(/(\d+)\s*minutes?/i);

    let amount = 1;
    let unit: 'days' | 'hours' | 'minutes' = 'days';

    if (dayMatch) {
      amount = parseInt(dayMatch[1]);
      unit = 'days';
    } else if (hourMatch) {
      amount = parseInt(hourMatch[1]);
      unit = 'hours';
    } else if (minMatch) {
      amount = parseInt(minMatch[1]);
      unit = 'minutes';
    }

    newNodes.push({
      id: `node-${Date.now()}-1`,
      type: 'custom',
      position: { x: xPos, y: yPos },
      data: {
        label: 'Delay',
        nodeType: 'delay',
        config: {
          name: `Wait ${amount} ${unit}`,
          delayAmount: amount,
          delayUnit: unit,
        }
      }
    });
    yPos += 120;
  }

  // Parse email
  if (lower.includes('email') || lower.includes('send')) {
    const subject = lower.includes('welcome') ? 'Welcome!' : 
                   lower.includes('reminder') ? 'Reminder' :
                   'Notification';

    newNodes.push({
      id: `node-${Date.now()}-2`,
      type: 'custom',
      position: { x: xPos, y: yPos },
      data: {
        label: 'Send Email',
        nodeType: 'email',
        config: {
          name: 'Send Email',
          emailSubject: subject,
        }
      }
    });
    yPos += 120;
  }

  // Parse export
  if (lower.includes('export') || lower.includes('csv') || lower.includes('json') || lower.includes('pdf')) {
    const format = lower.includes('json') ? 'JSON' : 
                   lower.includes('pdf') ? 'PDF' : 'CSV';
    
    newNodes.push({
      id: `node-${Date.now()}-3`,
      type: 'custom',
      position: { x: xPos, y: yPos },
      data: {
        label: 'Export Data',
        nodeType: 'export',
        config: {
          name: `Export as ${format}`,
          exportFormat: format,
        }
      }
    });
    yPos += 120;
  }

  // Parse condition
  if (lower.includes('if') || lower.includes('condition')) {
    newNodes.push({
      id: `node-${Date.now()}-4`,
      type: 'custom',
      position: { x: xPos, y: yPos },
      data: {
        label: 'If/Else',
        nodeType: 'condition',
        config: {
          name: 'Check Condition',
        }
      }
    });
    yPos += 120;
  }

  // Create edges connecting all nodes sequentially
  const newEdges: Edge[] = [];
  for (let i = 0; i < newNodes.length - 1; i++) {
    newEdges.push({
      id: `edge-${i}`,
      source: newNodes[i].id,
      target: newNodes[i + 1].id,
      type: 'custom',
    });
  }

  return { nodes: newNodes, edges: newEdges };
};