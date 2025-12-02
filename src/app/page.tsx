'use client';

import React, { useState, useEffect } from 'react';
import { AppDefinition } from '@/types/app';
import AppList from '@/components/AppList';
import AppSidebar from '@/components/AppSidebar';
import ConfigPanel from '@/components/ConfigPanel';
import SimpleConfigPanel from '@/components/SimpleConfigPanel';

export default function Home() {
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apps')
      .then(res => res.json())
      .then(data => {
        setApps(data.apps);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading apps:', err);
        setLoading(false);
      });
  }, []);

  const handleSelectApp = (app: AppDefinition) => {
    setSelectedApp(app);
  };

  const handleBackToList = () => {
    setSelectedApp(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading applications...</div>
        </div>
      </div>
    );
  }

  // Show app list if no app is selected
  if (!selectedApp) {
    return <AppList apps={apps} onSelectApp={handleSelectApp} />;
  }

  // Show configuration UI for selected app
  // Use SimpleConfigPanel if app has services defined, otherwise use legacy ConfigPanel
  if (selectedApp.services && selectedApp.services.length > 0) {
    return <SimpleConfigPanel app={selectedApp} />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar app={selectedApp} onBack={handleBackToList} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConfigPanel app={selectedApp} />
      </div>
    </div>
  );
}
