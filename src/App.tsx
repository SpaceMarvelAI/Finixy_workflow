import React from 'react';
import { WorkflowProvider, useWorkflow } from '@store/WorkflowContext';
import { AuthProvider, useAuth } from '@store/AuthContext'; // ✅ Import AuthContext
import { Header } from '@components/Header';
import { Sidebar } from '@components/Sidebar';
import { ChatPanel } from '@components/ChatPanel';
import { WorkflowCanvas } from '@components/WorkflowCanvas';
import { ConfigPanel } from '@components/ConfigPanel';
import { NodePalette } from '@components/NodePalette';
import { Login } from '@components/Login'; // ✅ Import your new Login component

// --- MAIN APP CONTENT ---
const MainLayout: React.FC = () => {
  // ✅ Consume global auth state
  const { isAuthenticated } = useAuth();
  const { selectedNode } = useWorkflow();

  // Route to login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render main application if authenticated
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="w-96 bg-white border-r flex flex-col">
          <ChatPanel />
        </div>
        <div className={`flex-1 flex flex-col transition-all duration-300`}>
          <NodePalette />
          <div className="flex-1">
            <WorkflowCanvas />
          </div>
        </div>
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
    // Wrap the entire app in AuthProvider first, then WorkflowProvider
    <AuthProvider>
      <WorkflowProvider>
        <MainLayout />
      </WorkflowProvider>
    </AuthProvider>
  );
};

export default App;