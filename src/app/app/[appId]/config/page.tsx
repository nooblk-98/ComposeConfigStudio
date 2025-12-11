'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Result, Spin } from 'antd';
import { AppDefinition } from '@/types/app';
import SimpleConfigPanel from '@/components/SimpleConfigPanel';
import ConfigPanel from '@/components/ConfigPanel';
import AppSidebar from '@/components/AppSidebar';

export default function AppConfigPage({ params }: { params: { appId: string } }) {
  const router = useRouter();
  const [app, setApp] = useState<AppDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${params.appId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const loadedApp = data.app;
        
        // If app has variants, redirect to variant selector
        if (loadedApp.multiDbVariant && loadedApp.variants && loadedApp.variants.length > 0) {
          router.push(`/app/${params.appId}`);
        } else {
          setApp(loadedApp);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading app:', err);
        setLoading(false);
      });
  }, [params.appId, router]);

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Spin size="large" tip="Loading configuration..." />
      </div>
    );
  }

  if (!app) {
    return (
      <Result
        status="404"
        title="Configuration not found"
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            Back to Apps
          </Button>
        }
      />
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
