'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Typography } from 'antd';
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
    router.push(`/app/${app.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spin size="large" />
          <Typography.Text type="secondary">Loading applications...</Typography.Text>
        </div>
      </div>
    );
  }

  return <AppList apps={apps} onSelectApp={handleSelectApp} />;
}
