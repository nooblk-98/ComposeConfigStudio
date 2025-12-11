'use client';

import React from 'react';
import { ArrowLeftOutlined, ThunderboltOutlined, ToolOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Tag, Typography } from 'antd';
import { AppDefinition } from '@/types/app';

interface AppSidebarProps {
  app: AppDefinition;
  onBack?: () => void;
}

export default function AppSidebar({ app, onBack }: AppSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {onBack && (
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 12 }}>
            Back to Apps
          </Button>
        )}
        <Card
          bordered={false}
          style={{ marginBottom: 16, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}
          cover={
            <div
              style={{
                height: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg,#1677ff,#722ed1)',
                color: '#fff',
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              {app.name.charAt(0)}
            </div>
          }
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {app.name}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {app.description}
            </Typography.Paragraph>
            <Space wrap>
              {app.version && <Tag color="blue">{app.version}</Tag>}
              {app.defaultPort && (
                <Tag icon={<ThunderboltOutlined />} color="purple">
                  Port {app.defaultPort}
                </Tag>
              )}
            </Space>
          </Space>
        </Card>

        {app.tools && app.tools.length > 0 && (
          <Card size="small" title="Stack Components" bordered={false}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {app.tools.map((tool, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <Badge status="processing" />
                    <Typography.Text>{tool.name}</Typography.Text>
                  </Space>
                  {tool.version && (
                    <Tag icon={<ToolOutlined />} color="geekblue">
                      {tool.version}
                    </Tag>
                  )}
                </div>
              ))}
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}
