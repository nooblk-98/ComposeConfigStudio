'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppDefinition } from '@/types/app';

export default function AppDetailPage({ params }: { params: Promise<{ appId: string }> }) {
  const router = useRouter();
  const { appId } = use(params);
  const [app, setApp] = useState<AppDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${appId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const loadedApp = data.app;
        setApp(loadedApp);
        
        // If app has variants, stay on this page to show selector
        // If app has no variants, redirect to config page
        if (loadedApp && (!loadedApp.multiDbVariant || !loadedApp.variants || loadedApp.variants.length === 0)) {
          router.push(`/app/${appId}/config`);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading app:', err);
        setLoading(false);
      });
  }, [appId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-xl text-foreground">Loading configuration...</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="text-xl text-foreground">App not found</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Apps
          </button>
        </div>
      </div>
    );
  }

  // Show variant selector
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to apps
        </button>

        <div className="bg-card rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={app.logo} alt={app.name} className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">{app.name}</h1>
              <p className="text-muted-foreground mt-1">{app.description}</p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Choose Configuration</h2>
            <p className="text-muted-foreground mb-6">Select the setup for your deployment</p>

            <div className="grid gap-4">
              {app.variants?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => router.push(`/app/${appId}/${encodeURIComponent(variant.id)}`)}
                  className="flex items-center justify-between p-5 border-2 border-border rounded-xl hover:border-primary hover:bg-accent transition-all text-left group"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary">
                      {variant.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{variant.config.description}</p>
                  </div>
                  <svg
                    className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors"
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
