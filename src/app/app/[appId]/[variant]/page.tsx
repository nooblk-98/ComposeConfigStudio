'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppDefinition } from '@/types/app';
import SimpleConfigPanel from '@/components/SimpleConfigPanel';
import ConfigPanel from '@/components/ConfigPanel';
import AppSidebar from '@/components/AppSidebar';

export default function AppVariantPage({ params }: { params: { appId: string; variant: string } }) {
  const router = useRouter();
  const [app, setApp] = useState<AppDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${params.appId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const loadedApp = data.app;
        
        // If app has variants, find the selected variant
        if (loadedApp.multiDbVariant && loadedApp.variants) {
          const variant = loadedApp.variants.find((v: any) => v.id === params.variant);
          if (variant) {
            setApp(variant.config);
          } else {
            // Variant not found, redirect to app page
            router.push(`/app/${params.appId}`);
          }
        } else {
          // No variants, use the app directly
          setApp(loadedApp);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading app:', err);
        setLoading(false);
      });
  }, [params.appId, params.variant, router]);

  const handleBack = () => {
    // Check if we should go back to variant selector or home
    fetch(`/api/apps/${params.appId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.app?.multiDbVariant && data.app?.variants) {
          router.push(`/app/${params.appId}`);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading configuration...</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="text-xl text-gray-700">Configuration not found</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Apps
          </button>
        </div>
      </div>
    );
  }

  // Show configuration UI for selected app
  // Use SimpleConfigPanel if app has services defined, otherwise use legacy ConfigPanel
  if (app.services && app.services.length > 0) {
    return <SimpleConfigPanel app={app} onBack={handleBack} />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar app={app} onBack={handleBack} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConfigPanel app={app} />
      </div>
    </div>
  );
}
