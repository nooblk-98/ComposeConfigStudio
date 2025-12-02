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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/apps', { cache: 'no-store' })
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

  const handleSelectApp = async (app: AppDefinition) => {
    setLoadingAppId(app.id);

    try {
      const response = await fetch(`/api/apps/${app.id}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const loadedApp = data.app || app;
        
        // If app has variants, don't select it yet - show variant selector
        if (loadedApp.multiDbVariant && loadedApp.variants && loadedApp.variants.length > 0) {
          setSelectedApp(loadedApp);
          setSelectedVariant(null); // Show variant selector
        } else {
          setSelectedApp(loadedApp);
          setSelectedVariant(null);
        }
        return;
      }
    } catch (error) {
      console.error('Error loading app config:', error);
    } finally {
      setLoadingAppId(null);
    }

    // Fallback to the basic app data if detailed config isn't available
    setSelectedApp(app);
  };

  const handleBackToList = () => {
    setSelectedApp(null);
    setSelectedVariant(null);
  };

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariant(variantId);
  };

  const handleBackToVariants = () => {
    setSelectedVariant(null);
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

  if (loadingAppId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading configuration...</div>
        </div>
      </div>
    );
  }

  // Show app list if no app is selected
  if (!selectedApp) {
    return <AppList apps={apps} onSelectApp={handleSelectApp} />;
  }

  // Show variant selector if app has variants but none selected
  if (selectedApp.multiDbVariant && selectedApp.variants && selectedApp.variants.length > 0 && !selectedVariant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToList}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to apps
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedApp.logo} alt={selectedApp.name} className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{selectedApp.name}</h1>
                <p className="text-slate-600 mt-1">{selectedApp.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Choose Database Configuration</h2>
              <p className="text-slate-600 mb-6">Select the database type for your deployment</p>

              <div className="grid gap-4">
                {selectedApp.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleSelectVariant(variant.id)}
                    className="flex items-center justify-between p-5 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-700">
                        {variant.label}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{variant.config.description}</p>
                    </div>
                    <svg
                      className="w-6 h-6 text-slate-400 group-hover:text-purple-600 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the actual app config to display
  let appToDisplay = selectedApp;
  if (selectedApp.multiDbVariant && selectedApp.variants && selectedVariant) {
    const variant = selectedApp.variants.find(v => v.id === selectedVariant);
    if (variant) {
      appToDisplay = variant.config;
    }
  }

  // Show configuration UI for selected app
  // Use SimpleConfigPanel if app has services defined, otherwise use legacy ConfigPanel
  if (appToDisplay.services && appToDisplay.services.length > 0) {
    return (
      <SimpleConfigPanel
        app={appToDisplay}
        onBack={selectedApp.multiDbVariant && selectedVariant ? handleBackToVariants : handleBackToList}
      />
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar app={appToDisplay} onBack={handleBackToList} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConfigPanel app={appToDisplay} />
      </div>
    </div>
  );
}
