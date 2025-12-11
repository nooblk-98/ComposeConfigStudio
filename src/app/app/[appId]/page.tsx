'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, List, Result, Space, Spin, Typography } from 'antd';
import { AppDefinition } from '@/types/app';

export default function AppDetailPage({ params }: { params: { appId: string } }) {
  const router = useRouter();
  const [app, setApp] = useState<AppDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${params.appId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const loadedApp = data.app;
        setApp(loadedApp);
        
        // If app has variants, stay on this page to show selector
        // If app has no variants, redirect to config page
        if (!loadedApp.multiDbVariant || !loadedApp.variants || loadedApp.variants.length === 0) {
          router.push(`/app/${params.appId}/config`);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading app:', err);
        setLoading(false);
      });
  }, [params.appId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Spin tip="Loading configuration..." size="large" />
      </div>
    );
  }

  if (!app) {
    return (
      <Result
        status="404"
        title="App not found"
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            Back to Apps
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          style={{ paddingLeft: 0 }}
        >
          Back to apps
        </Button>

        <Card
          style={{ marginTop: 16 }}
          title={
            <Space align="center" size="middle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={app.logo} alt={app.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
              <div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {app.name}
                </Typography.Title>
                <Typography.Text type="secondary">{app.description}</Typography.Text>
              </div>
            </Space>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Typography.Title level={4} style={{ marginBottom: 4 }}>
                Choose Configuration
              </Typography.Title>
              <Typography.Text type="secondary">Select the setup for your deployment</Typography.Text>
            </div>
            <List
              itemLayout="horizontal"
              dataSource={app.variants || []}
              renderItem={(variant) => (
                <List.Item
                  actions={[
                    <Button
                      key="configure"
                      type="primary"
                      icon={<RightOutlined />}
                      onClick={() => router.push(`/app/${params.appId}/${encodeURIComponent(variant.id)}`)}
                    >
                      Configure
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {variant.label}
                      </Typography.Title>
                    }
                    description={<Typography.Text type="secondary">{variant.config.description}</Typography.Text>}
                  />
                </List.Item>
              )}
            />
          </Space>
        </Card>
      </div>
    </div>
  );
}
