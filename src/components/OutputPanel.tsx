'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
    <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('command')}
          className={`px-6 py-3 font-bold text-sm transition-colors ${
            activeTab === 'command'
              ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Docker command
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-6 py-3 font-bold text-sm transition-colors ${
            activeTab === 'compose'
              ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Docker Compose
        </button>
      </div>

      {/* Action Bar */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          {activeTab === 'compose' && (
            <>
              <button
                onClick={() => { setEditable(e => !e); setComposeDraft(dockerCompose); setParseError(null); }}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm shadow-sm transition-all"
              >
                {editable ? 'Cancel edit' : 'Edit YAML'}
              </button>
              {editable && (
                <button
                  onClick={handleSaveCompose}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm shadow-sm transition-all"
                >
                  Save YAML
                </button>
              )}
            </>
          )}
        </div>
        {parseError && <div className="text-red-500 text-xs font-medium bg-red-50 px-2 py-1 rounded border border-red-200">{parseError}</div>}
      </div>

      {/* Editor */}
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
    </div>
  );
}
