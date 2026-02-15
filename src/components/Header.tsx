import React, { useState } from 'react';

type Tab = 'workflow' | 'analysis' | 'report';

export const Header: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('workflow');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'workflow', label: 'Workflow' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'report', label: 'Report' },
  ];

  return (
    <header className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 px-6 py-3 flex items-center justify-between shadow-xl backdrop-blur-sm">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <img 
          src="/logo.svg" 
          alt="Finixy Logo" 
          className="w-32 h-12 object-contain"
        />
      </div>

      {/* CENTER: Sliding Tab Selector */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-1 flex gap-1 shadow-lg">
          {/* Animated background slider */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-all duration-300 ease-out shadow-lg"
            style={{
              left: activeTab === 'workflow' ? '4px' : activeTab === 'analysis' ? 'calc(33.333% + 2px)' : 'calc(66.666% + 0px)',
              width: 'calc(33.333% - 4px)',
            }}
          />
          
          {/* Tab Buttons */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 px-8 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Empty for now */}
      <div className="w-10" />
    </header>
  );
};