import React from 'react';
import { Workflow } from 'lucide-react';
import { useWorkflow } from '@store/WorkflowContext';

export const Header: React.FC = () => {
  const { config } = useWorkflow();

  return (
    <header className="bg-white border-b px-6 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Workflow className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Finixy</h1>
          <p className="text-xs text-gray-500">Build workflows with no   code</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{config.nodes.length}</span> nodes
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
          Export Config
        </button>
      </div>
    </header>
  );
};