import React, { useState } from 'react';
import { WorkflowProvider, useWorkflow } from '@store/WorkflowContext';
import { AuthProvider, useAuth } from '@store/AuthContext';
import { Header } from '@components/Header';
import { Sidebar } from '@components/Sidebar';
import { ChatPanel } from '@components/ChatPanel';
import { WorkflowCanvas } from '@components/WorkflowCanvas';
import { ConfigPanel } from '@components/ConfigPanel';
import { NodePalette } from '@components/NodePalette';
import { Login } from '@components/Login';

// --- MAIN APP CONTENT ---
const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { selectedNode } = useWorkflow();
  
  // Chat panel collapse state
  const [isChatExpanded, setIsChatExpanded] = useState(true);

  // Route to login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render main application if authenticated
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isChatExpanded={isChatExpanded}
          onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        />
        
        {/* Chat Panel - Only render when expanded */}
        {isChatExpanded && (
          <div className="w-96 bg-black border-r border-gray-800 flex flex-col transition-all duration-300">
            <ChatPanel isExpanded={isChatExpanded} />
          </div>
        )}
        
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col transition-all duration-300">
          <NodePalette />
          <div className="flex-1">
            <WorkflowCanvas />
          </div>
        </div>
        
        {/* Config Panel (conditional) */}
        {selectedNode && (
          <div className="w-80 bg-white border-l flex-shrink-0 transition-all duration-300">
            <ConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
};

// --- ROOT APP ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <MainLayout />
      </WorkflowProvider>
    </AuthProvider>
  );
};

export default App;