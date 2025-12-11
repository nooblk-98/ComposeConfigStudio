'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Alert, Button, Card, Space, Tabs, message } from 'antd';
import { CopyOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { AppDefinition, AppConfig } from '@/types/app';
import { generateDockerCompose, generateDockerRun } from '@/utils/dockerGenerator';
import { parseComposePartial } from '../utils/composeParser';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface OutputPanelProps {
  app: AppDefinition;
  config: AppConfig;
  updateConfig: (c: Partial<AppConfig>) => void;
}

export default function OutputPanel({ app, config, updateConfig }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'command' | 'compose'>('compose');
  const [copied, setCopied] = useState(false);
  const [editable, setEditable] = useState(false);
  const [composeDraft, setComposeDraft] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const dockerCompose = useMemo(() => {
    const generated = generateDockerCompose(app, config);
    if (!editable) setComposeDraft(generated); // keep draft in sync when not editing
    return generated;
  }, [app, config, editable]);

  const dockerCommand = useMemo(() => {
    return generateDockerRun(app, config);
  }, [app, config]);

  const copyToClipboard = () => {
    const text = activeTab === 'compose' ? dockerCompose : dockerCommand;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      messageApi.success('Copied to clipboard');
    });
  };

  const handleSaveCompose = () => {
    try {
      const result = parseComposePartial(composeDraft);
      // map back to config fields
      const updates: Partial<AppConfig> = {};
      if (result.environment) {
        updates.env = { ...config.env };
        Object.entries(result.environment).forEach(([k,v]) => {
          if (typeof v === 'string') updates.env![k] = v;
        });
      }
      if (result.ports) {
        // Reset customPorts based on difference from primary port mapping
        const custom: { host: number; container: number }[] = [];
        result.ports.forEach(p => {
          const [hostStr, containerStr] = p.split(':');
          const host = parseInt(hostStr);
            const container = parseInt(containerStr);
          if (host !== config.port || container !== (app.defaultPort)) {
            if (!isNaN(host) && !isNaN(container)) custom.push({ host, container });
          }
        });
        updates.customPorts = custom;
      }
      if (result.volumes) {
        // Only add as custom volumes if not matching existing named ones
        const existingPaths = Object.values(app.volumes ?? {}).map(v => v.path);
        const customVols: { name: string; hostPath: string; containerPath: string }[] = [];
        result.volumes.forEach(v => {
          // format host:container
          const parts = v.split(':');
          if (parts.length >= 2) {
            const host = parts[0];
            const containerPath = parts.slice(1).join(':');
            const matchesExisting = existingPaths.includes(containerPath);
            if (!matchesExisting) {
              customVols.push({ name: host, hostPath: host.includes('/') ? host : '', containerPath });
            }
          }
        });
        updates.customVolumes = customVols;
      }
      if (result.labels) {
        updates.labels = result.labels.map(l => {
          const [k,...rest] = l.split('=');
          return { key: k, value: rest.join('=') };
        });
      }
      if (result.networks) {
        updates.networks = result.networks;
      }
      updateConfig(updates);
      setParseError(null);
      setEditable(false);
    } catch (e:any) {
      setParseError(e.message || 'Failed to parse');
    }
  };

  return (
    <Card
      className="w-1/2 flex flex-col"
      bodyStyle={{ padding: 0, height: '100%' }}
      style={{ borderLeft: '1px solid #f0f0f0' }}
    >
      {contextHolder}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'command' | 'compose')}
        items={[
          { key: 'compose', label: 'Docker Compose' },
          { key: 'command', label: 'Docker command' },
        ]}
      />

      <div style={{ padding: 12, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <Space wrap>
          <Button type="primary" icon={<CopyOutlined />} onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {activeTab === 'compose' && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => { setEditable(e => !e); setComposeDraft(dockerCompose); setParseError(null); }}
              >
                {editable ? 'Cancel edit' : 'Edit YAML'}
              </Button>
              {editable && (
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveCompose}>
                  Save YAML
                </Button>
              )}
            </>
          )}
        </Space>
        {parseError && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="Failed to parse YAML"
            description={parseError}
          />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'compose' ? (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={editable ? composeDraft : dockerCompose}
            onChange={(val) => editable && val !== undefined && setComposeDraft(val)}
            theme="light"
            options={{
              readOnly: !editable,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on'
            }}
          />
        ) : (
          <Editor
            height="100%"
            defaultLanguage="shell"
            value={dockerCommand}
            theme="light"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        )}
      </div>
    </Card>
  );
}
