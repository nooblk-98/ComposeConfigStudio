'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDefinition } from '@/types/app';
import AppList from '@/components/AppList';

export default function Home() {
  const router = useRouter();
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Navigate to the app's detail page
    router.push(`/app/${app.id}`);
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

  return <AppList apps={apps} onSelectApp={handleSelectApp} />;
}
