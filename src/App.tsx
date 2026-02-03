import React, { useState, useEffect } from 'react';
import { WorkflowProvider, useWorkflow } from '@store/WorkflowContext';
import { Header } from '@components/Header';
import { Sidebar } from '@components/Sidebar';
import { ChatPanel } from '@components/ChatPanel';
import { WorkflowCanvas } from '@components/WorkflowCanvas';
import { ConfigPanel } from '@components/ConfigPanel';
import { NodePalette } from '@components/NodePalette';
import { authService } from '@/services/api'; // Import auth service

// --- LOGIN COMPONENT ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("admin@metaspace.ai");
  const [password, setPassword] = useState("SecurePass123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.login(email, password);
      onLogin();
    } catch (err) {
      setError("Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Metaspace Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
  const { selectedNode } = useWorkflow();

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) setIsAuthenticated(true);
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  );
};

export default App;