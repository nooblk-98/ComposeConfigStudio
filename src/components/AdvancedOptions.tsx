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

  const inputClass = "bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400";
  const buttonClass = "text-xs px-3 py-2 rounded-lg bg-purple-50 text-purple-600 font-medium border border-purple-200 hover:bg-purple-100 transition-colors";
  const removeButtonClass = "px-2 text-red-500 hover:text-red-700 transition-colors";

  return (
    <div className="space-y-8">
      {/* Restart Policy */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Restart policy</h3>
        <select
          value={config.restartPolicy}
          onChange={(e) => updateConfig({ restartPolicy: e.target.value })}
          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {['no','always','on-failure','unless-stopped'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Custom Environment */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Custom environment variables</h3>
        <div className="space-y-3">
          {config.customEnv.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="KEY"
                value={item.key}
                onChange={(e) => updateEnvItem(i, e.target.value, item.value)}
                className={`flex-1 ${inputClass}`}
              />
              <input
                placeholder="value"
                value={item.value}
                onChange={(e) => updateEnvItem(i, item.key, e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <button onClick={() => removeEnv(i)} className={removeButtonClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addEnv} className={buttonClass}>+ Add Variable</button>
        </div>
      </div>

      {/* Custom Ports */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Additional ports</h3>
        <div className="space-y-3">
          {config.customPorts.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Host"
                value={p.host || ''}
                onChange={(e) => updatePortItem(i, parseInt(e.target.value)||0, p.container)}
                className={`w-24 ${inputClass}`}
              />
              <span className="text-gray-400 font-medium">:</span>
              <input
                type="number"
                placeholder="Container"
                value={p.container || ''}
                onChange={(e) => updatePortItem(i, p.host, parseInt(e.target.value)||0)}
                className={`w-24 ${inputClass}`}
              />
              <button onClick={() => removePort(i)} className={removeButtonClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addPort} className={buttonClass}>+ Add Port</button>
        </div>
      </div>

      {/* Custom Volumes */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Extra volumes</h3>
        <div className="space-y-3">
          {config.customVolumes.map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <input
                  placeholder="Name"
                  value={v.name}
                  onChange={(e) => updateVolumeItem(i, e.target.value, v.hostPath, v.containerPath)}
                  className={`w-full ${inputClass}`}
                />
              </div>
              <div className="col-span-4">
                <input
                  placeholder="Host path"
                  value={v.hostPath}
                  onChange={(e) => updateVolumeItem(i, v.name, e.target.value, v.containerPath)}
                  className={`w-full ${inputClass}`}
                />
              </div>
              <div className="col-span-4">
                <input
                  placeholder="Container path"
                  value={v.containerPath}
                  onChange={(e) => updateVolumeItem(i, v.name, v.hostPath, e.target.value)}
                  className={`w-full ${inputClass}`}
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeVolume(i)} className={removeButtonClass}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
          <button onClick={addVolume} className={buttonClass}>+ Add Volume</button>
        </div>
      </div>

      {/* Labels */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Labels</h3>
        <div className="space-y-3">
          {config.labels.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="label.key"
                value={l.key}
                onChange={(e) => updateLabelItem(i, e.target.value, l.value)}
                className={`flex-1 ${inputClass}`}
              />
              <input
                placeholder="value"
                value={l.value}
                onChange={(e) => updateLabelItem(i, l.key, e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <button onClick={() => removeLabel(i)} className={removeButtonClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addLabel} className={buttonClass}>+ Add Label</button>
        </div>
      </div>

      {/* Networks */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Networks</h3>
        <div className="space-y-3">
          {config.networks.map((n, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="network name"
                value={n}
                onChange={(e) => updateNetwork(i, e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <button onClick={() => removeNetwork(i)} className={removeButtonClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addNetwork} className={buttonClass}>+ Add Network</button>
        </div>
      </div>
    </div>
  );
}
