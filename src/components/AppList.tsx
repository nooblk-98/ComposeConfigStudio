'use client';

import React, { useMemo, useState } from 'react';
import { AppDefinition } from '@/types/app';
import {
  Badge,
  Button,
  Card,
  Drawer,
  Grid,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  ArrowRightOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FilterOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

interface AppListProps {
  apps: AppDefinition[];
  onSelectApp: (app: AppDefinition) => void | Promise<void>;
}

export default function AppList({ apps, onSelectApp }: AppListProps) {
  const categories = useMemo(() => Array.from(new Set(apps.map(app => app.category))), [apps]);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortKey, setSortKey] = useState<'default' | 'name' | 'version' | 'port'>('default');
  const [showDetails, setShowDetails] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filteredApps = useMemo(() => {
    let list = apps;
    if (selectedCategory !== 'all') {
      list = list.filter(a => a.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tools.some(t => t.name.toLowerCase().includes(q))
      );
    }
    switch (sortKey) {
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'version':
        list = [...list].sort((a, b) => (a.version || '').localeCompare(b.version || ''));
        break;
      case 'port':
        list = [...list].sort((a, b) => (a.defaultPort || 0) - (b.defaultPort || 0));
        break;
      default:
        break;
    }
    return list;
  }, [apps, selectedCategory, query, sortKey]);

  const filterPanel = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Text strong>Search</Typography.Text>
        <Input.Search
          style={{ marginTop: 8 }}
          placeholder="Search apps..."
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div>
        <Typography.Text strong>Categories</Typography.Text>
        <Radio.Group
          style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <Radio value="all">All</Radio>
          {categories.map(cat => (
            <Radio key={cat} value={cat}>
              {cat}
            </Radio>
          ))}
        </Radio.Group>
      </div>

      <div>
        <Typography.Text strong>Sort</Typography.Text>
        <Select
          style={{ width: '100%', marginTop: 8 }}
          value={sortKey}
          onChange={(value) => setSortKey(value)}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'name', label: 'Name' },
            { value: 'version', label: 'Version' },
            { value: 'port', label: 'Port' },
          ]}
        />
      </div>

      <div>
        <Typography.Text strong>Options</Typography.Text>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch checked={showDetails} onChange={setShowDetails} />
          <Typography.Text>Show Details</Typography.Text>
        </div>
      </div>
    </Space>
  );

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Docker Apps
            </Typography.Title>
            <Typography.Text type="secondary">
              {filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}
            </Typography.Text>
          </Col>
          {isMobile && (
            <Col>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFiltersMobile(true)}
              >
                Filters
              </Button>
            </Col>
          )}
        </Row>

        <Drawer
          title="Filters"
          placement="right"
          open={isMobile && showFiltersMobile}
          onClose={() => setShowFiltersMobile(false)}
          width={320}
        >
          {filterPanel}
        </Drawer>

        <Row gutter={[16, 16]} align="top">
          {!isMobile && (
            <Col xs={24} lg={6}>
              <Card title="Filters" bordered>
                {filterPanel}
              </Card>
            </Col>
          )}

          <Col xs={24} lg={18}>
            {filteredApps.length === 0 ? (
              <Empty description="No applications match your filters" />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredApps.map(app => (
                  <Col key={app.id} xs={24} sm={12} xl={8}>
                    <Card
                      hoverable
                      onClick={() => onSelectApp(app)}
                      actions={[
                        <Space key="configure" size={4}>
                          <Typography.Text strong>Configure</Typography.Text>
                          <ArrowRightOutlined />
                        </Space>
                      ]}
                    >
                      <Space align="start" size="large">
                        <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {app.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={app.logo}
                              alt={app.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Typography.Title level={4} style={{ margin: 0 }}>
                              {app.name.charAt(0)}
                            </Typography.Title>
                          )}
                        </div>
                        <Space direction="vertical" size={4} style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                              {app.name}
                            </Typography.Title>
                            {app.version && <Tag color="blue">{app.version}</Tag>}
                            {app.defaultPort && (
                              <Tag icon={<ThunderboltOutlined />} color="purple">
                                Port {app.defaultPort}
                              </Tag>
                            )}
                            {app.databases && app.databases.length > 0 && (
                              <Tag icon={<DatabaseOutlined />} color="green">
                                {app.databases.length} DB
                              </Tag>
                            )}
                          </div>
                          {showDetails && (
                            <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                              {app.description}
                            </Typography.Paragraph>
                          )}
                          {app.tools && app.tools.length > 0 && (
                            <Space size={[4, 4]} wrap>
                              {app.tools.slice(0, 3).map(tool => (
                                <Badge key={tool.name} color="#d9d9d9" text={tool.name} />
                              ))}
                              {app.tools.length > 3 && (
                                <Typography.Text type="secondary">
                                  +{app.tools.length - 3} more
                                </Typography.Text>
                              )}
                            </Space>
                          )}
                          {app.services && app.services.length > 0 && (
                            <Space size={4} align="center">
                              <DeploymentUnitOutlined />
                              <Typography.Text type="secondary">
                                {app.services.length} service{app.services.length > 1 ? 's' : ''}
                              </Typography.Text>
                            </Space>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
