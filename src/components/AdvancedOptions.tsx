'use client';
import React from 'react';
import { AppConfig } from '@/types/app';

interface AdvancedOptionsProps {
  config: AppConfig;
  updateConfig: (c: Partial<AppConfig>) => void;
}

export default function AdvancedOptions({ config, updateConfig }: AdvancedOptionsProps) {
  const updateEnvItem = (index: number, key: string, value: string) => {
    const next = [...config.customEnv];
    next[index] = { key, value };
    updateConfig({ customEnv: next });
  };
  const addEnv = () => updateConfig({ customEnv: [...config.customEnv, { key: '', value: '' }] });
  const removeEnv = (i: number) => updateConfig({ customEnv: config.customEnv.filter((_, idx) => idx !== i) });

  const updatePortItem = (index: number, host: number, container: number) => {
    const next = [...config.customPorts];
    next[index] = { host, container };
    updateConfig({ customPorts: next });
  };
  const addPort = () => updateConfig({ customPorts: [...config.customPorts, { host: 0, container: 0 }] });
  const removePort = (i: number) => updateConfig({ customPorts: config.customPorts.filter((_, idx) => idx !== i) });

  const updateVolumeItem = (index: number, name: string, hostPath: string, containerPath: string) => {
    const next = [...config.customVolumes];
    next[index] = { name, hostPath, containerPath };
    updateConfig({ customVolumes: next });
  };
  const addVolume = () => updateConfig({ customVolumes: [...config.customVolumes, { name: '', hostPath: '', containerPath: '' }] });
  const removeVolume = (i: number) => updateConfig({ customVolumes: config.customVolumes.filter((_, idx) => idx !== i) });

  const updateLabelItem = (index: number, key: string, value: string) => {
    const next = [...config.labels];
    next[index] = { key, value };
    updateConfig({ labels: next });
  };
  const addLabel = () => updateConfig({ labels: [...config.labels, { key: '', value: '' }] });
  const removeLabel = (i: number) => updateConfig({ labels: config.labels.filter((_, idx) => idx !== i) });

  const updateNetwork = (index: number, value: string) => {
    const next = [...config.networks];
    next[index] = value;
    updateConfig({ networks: next });
  };
  const addNetwork = () => updateConfig({ networks: [...config.networks, ''] });
  const removeNetwork = (i: number) => updateConfig({ networks: config.networks.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-8">
      {/* Restart Policy */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Restart policy</h3>
        <select
          value={config.restartPolicy}
          onChange={(e) => updateConfig({ restartPolicy: e.target.value })}
          className="bg-gray-800 text-gray-100 border border-gray-700 rounded px-3 py-2 text-sm"
        >
          {['no','always','on-failure','unless-stopped'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Custom Environment */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Custom environment variables</h3>
        <div className="space-y-3">
          {config.customEnv.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="KEY"
                value={item.key}
                onChange={(e) => updateEnvItem(i, e.target.value, item.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <input
                placeholder="value"
                value={item.value}
                onChange={(e) => updateEnvItem(i, item.key, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => removeEnv(i)} className="px-2 text-red-400 hover:text-red-300">✕</button>
            </div>
          ))}
          <button onClick={addEnv} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700">Add ENV</button>
        </div>
      </div>

      {/* Custom Ports */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Additional ports</h3>
        <div className="space-y-3">
          {config.customPorts.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="number"
                placeholder="Host"
                value={p.host || ''}
                onChange={(e) => updatePortItem(i, parseInt(e.target.value)||0, p.container)}
                className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400 self-center">:</span>
              <input
                type="number"
                placeholder="Container"
                value={p.container || ''}
                onChange={(e) => updatePortItem(i, p.host, parseInt(e.target.value)||0)}
                className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => removePort(i)} className="px-2 text-red-400 hover:text-red-300">✕</button>
            </div>
          ))}
          <button onClick={addPort} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700">Add Port</button>
        </div>
      </div>

      {/* Custom Volumes */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Extra volumes</h3>
        <div className="space-y-3">
          {config.customVolumes.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                placeholder="Name"
                value={v.name}
                onChange={(e) => updateVolumeItem(i, e.target.value, v.hostPath, v.containerPath)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <input
                placeholder="Host path (optional)"
                value={v.hostPath}
                onChange={(e) => updateVolumeItem(i, v.name, e.target.value, v.containerPath)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm col-span-1"
              />
              <input
                placeholder="Container path"
                value={v.containerPath}
                onChange={(e) => updateVolumeItem(i, v.name, v.hostPath, e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm col-span-1"
              />
              <button onClick={() => removeVolume(i)} className="px-2 text-red-400 hover:text-red-300">✕</button>
            </div>
          ))}
          <button onClick={addVolume} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700">Add Volume</button>
        </div>
      </div>

      {/* Labels */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Labels</h3>
        <div className="space-y-3">
          {config.labels.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="label.key"
                value={l.key}
                onChange={(e) => updateLabelItem(i, e.target.value, l.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <input
                placeholder="value"
                value={l.value}
                onChange={(e) => updateLabelItem(i, l.key, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => removeLabel(i)} className="px-2 text-red-400 hover:text-red-300">✕</button>
            </div>
          ))}
          <button onClick={addLabel} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700">Add Label</button>
        </div>
      </div>

      {/* Networks */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Networks</h3>
        <div className="space-y-3">
          {config.networks.map((n, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="network name"
                value={n}
                onChange={(e) => updateNetwork(i, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => removeNetwork(i)} className="px-2 text-red-400 hover:text-red-300">✕</button>
            </div>
          ))}
          <button onClick={addNetwork} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700">Add Network</button>
        </div>
      </div>
    </div>
  );
}
