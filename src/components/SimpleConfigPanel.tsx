'use client';

import React, { useState } from 'react';
import { AppDefinition } from '@/types/app';

interface SimpleConfigPanelProps {
  app: AppDefinition;
  onBack: () => void;
}

interface ServiceConfig {
  enabled: boolean;
  selectedImage: string;
  containerName: string;
  environment: Record<string, string>;
  ports: string[];
  volumes: string[];
}

export default function SimpleConfigPanel({ app, onBack }: SimpleConfigPanelProps) {
  // Initialize service configs
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceConfig>>(() => {
    const configs: Record<string, ServiceConfig> = {};

    app.services?.forEach(service => {
      configs[service.name] = {
        enabled: service.mandatory,
        selectedImage: service.defaultImage,
        containerName: service.containerName,
        environment: { ...service.environment },
        ports: [...(service.ports || [])],
        volumes: [...(service.volumes || [])]
      };
    });

    return configs;
  });

  const updateServiceConfig = (serviceName: string, updates: Partial<ServiceConfig>) => {
    setServiceConfigs(prev => ({
      ...prev,
      [serviceName]: { ...prev[serviceName], ...updates }
    }));
  };

  const updateEnv = (serviceName: string, key: string, value: string) => {
    setServiceConfigs(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        environment: { ...prev[serviceName].environment, [key]: value }
      }
    }));
  };

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'command' | 'compose'>('command');

  // Network configuration
  const [networkConfig, setNetworkConfig] = useState({
    enabled: true,
    name: 'app_network',
    driver: 'bridge',
    ipam: {
      driver: 'default',
      subnet: '',
      gateway: ''
    },
    internal: false,
    attachable: true
  });

  const generateDockerCommand = () => {
    const enabledServices = app.services?.filter(s => serviceConfigs[s.name]?.enabled);
    if (!enabledServices || enabledServices.length === 0) return '';

    const parts: string[] = [];

    if (networkConfig.enabled) {
      parts.push(`# Create network once\ndocker network create ${networkConfig.name} || true`);
    }

    enabledServices.forEach(service => {
      const config = serviceConfigs[service.name];
      let cmd = `docker run -d --name ${config.containerName}`;

      if (networkConfig.enabled) {
        cmd += ` --network ${networkConfig.name}`;
      }

      config.ports.forEach(port => {
        const trimmed = port.trim();
        if (trimmed) {
          cmd += ` -p ${trimmed}`;
        }
      });

      Object.entries(config.environment).forEach(([key, value]) => {
        if (key) {
          cmd += ` -e ${key}=${value}`;
        }
      });

      config.volumes.forEach(vol => {
        const trimmed = vol.trim();
        if (trimmed) {
          cmd += ` -v ${trimmed}`;
        }
      });

      cmd += ` ${config.selectedImage}`;
      parts.push(cmd);
    });

    return parts.join('\n\n');
  };

  const generateDockerCompose = () => {
    const enabledServices = app.services?.filter(s => serviceConfigs[s.name]?.enabled);
    if (!enabledServices) return '';

    let yaml = 'version: "3.8"\n\nservices:\n';

    enabledServices.forEach(service => {
      const config = serviceConfigs[service.name];
      yaml += `  ${service.name}:\n`;
      yaml += `    image: ${config.selectedImage}\n`;
      yaml += `    container_name: ${config.containerName}\n`;
      if (service.restart) yaml += `    restart: ${service.restart}\n`;

      if (config.ports.length > 0) {
        yaml += `    ports:\n`;
        config.ports.forEach(port => yaml += `      - "${port}"\n`);
      }

      const envKeys = Object.keys(config.environment);
      if (envKeys.length > 0) {
        yaml += `    environment:\n`;
        envKeys.forEach(key => {
          yaml += `      ${key}: ${config.environment[key]}\n`;
        });
      }

      if (config.volumes.length > 0) {
        yaml += `    volumes:\n`;
        config.volumes.forEach(vol => yaml += `      - ${vol}\n`);
      }

      if (service.dependsOn && service.dependsOn.length > 0) {
        const enabledDeps = service.dependsOn.filter(dep =>
          serviceConfigs[dep]?.enabled
        );
        if (enabledDeps.length > 0) {
          yaml += `    depends_on:\n`;
          enabledDeps.forEach(dep => yaml += `      - ${dep}\n`);
        }
      }

      // Add network configuration
      if (networkConfig.enabled) {
        yaml += `    networks:\n`;
        yaml += `      - ${networkConfig.name}\n`;
      }

      yaml += '\n';
    });

    if (app.namedVolumes && app.namedVolumes.length > 0) {
      yaml += 'volumes:\n';
      app.namedVolumes.forEach(vol => yaml += `  ${vol}:\n`);
    }

    // Add network definition
    if (networkConfig.enabled) {
      yaml += '\nnetworks:\n';
      yaml += `  ${networkConfig.name}:\n`;
      yaml += `    driver: ${networkConfig.driver}\n`;

      if (networkConfig.ipam.subnet || networkConfig.ipam.gateway) {
        yaml += `    ipam:\n`;
        yaml += `      driver: ${networkConfig.ipam.driver}\n`;
        yaml += `      config:\n`;
        yaml += `        - subnet: ${networkConfig.ipam.subnet || '172.20.0.0/16'}\n`;
        if (networkConfig.ipam.gateway) {
          yaml += `          gateway: ${networkConfig.ipam.gateway}\n`;
        }
      }

      if (networkConfig.internal) {
        yaml += `    internal: true\n`;
      }
      if (networkConfig.attachable) {
        yaml += `    attachable: true\n`;
      }
    }

    return yaml;
  };

  return (
    <div className="min-h-screen bg-slate-950/60">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 opacity-90" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3 text-slate-200">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-white/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to apps
          </button>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Configure &amp; launch</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {app.logo && (
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/10 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={app.logo} alt={app.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-semibold text-white">{app.name}</h1>
                      <p className="text-sm text-slate-300">{app.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-200 border border-emerald-400/30">
                      {app.category}
                    </span>
                    <span className="rounded-full bg-blue-400/10 px-3 py-1 text-blue-200 border border-blue-400/30">v{app.version}</span>
                    {app.defaultPort && (
                      <span className="rounded-full bg-purple-400/10 px-3 py-1 text-purple-100 border border-purple-400/30">Default port {app.defaultPort}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-64">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-left">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Services</p>
                    <p className="text-xl font-semibold text-white">
                      {Object.values(serviceConfigs).filter(cfg => cfg.enabled).length}/{app.services?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-left">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Network</p>
                    <p className="text-sm font-medium text-white truncate">{networkConfig.enabled ? networkConfig.name : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {app.services?.map((service) => {
                const config = serviceConfigs[service.name];
                if (!config) return null;

                return (
                  <div key={service.name} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border border-white/10" />
                          <div>
                            <h2 className="text-lg font-semibold text-white capitalize">{service.displayName || service.name}</h2>
                            <p className="text-xs text-slate-300 font-mono">{service.containerName}</p>
                          </div>
                          {service.mandatory && (
                            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-100 border border-blue-400/30">
                              Required
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="mt-2 text-xs text-slate-300">{service.description}</p>
                        )}
                      </div>

                      {!service.mandatory && (
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => updateServiceConfig(service.name, { enabled: e.target.checked })}
                            className="peer sr-only"
                          />
                          <div className="h-7 w-14 rounded-full bg-white/10 border border-white/10 transition peer-checked:bg-purple-500 peer-focus:ring-2 peer-focus:ring-purple-300/50 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-lg after:transition peer-checked:after:translate-x-6" />
                        </label>
                      )}
                    </div>

                    {config.enabled && (
                      <div className="grid gap-5 px-5 py-5 lg:grid-cols-2">
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-white">Container name</label>
                          <input
                            type="text"
                            value={config.containerName}
                            onChange={(e) => updateServiceConfig(service.name, { containerName: e.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            placeholder={service.containerName}
                          />

                          <label className="block text-sm font-semibold text-white">Docker image</label>
                          <select
                            value={config.selectedImage}
                            onChange={(e) => updateServiceConfig(service.name, { selectedImage: e.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          >
                            {service.images.map(img => (
                              <option key={img} value={img} className="bg-slate-900 text-white">{img}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-4">
                          {Object.keys(config.environment).length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">Environment variables</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const index = Object.keys(config.environment).length + 1;
                                    updateServiceConfig(service.name, {
                                      environment: { ...config.environment, [`NEW_VAR_${index}`]: '' }
                                    });
                                  }}
                                  className="text-xs font-semibold text-purple-200 hover:text-white"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {Object.entries(config.environment).map(([key, value]) => (
                                  <div key={key} className="grid grid-cols-3 gap-3 items-center">
                                    <span className="truncate text-xs font-mono text-slate-200" title={key}>{key}</span>
                                    <input
                                      type={key.toLowerCase().includes('password') ? 'password' : 'text'}
                                      value={value}
                                      onChange={(e) => updateEnv(service.name, key, e.target.value)}
                                      className="col-span-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {config.ports.length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">Ports</span>
                                <button
                                  type="button"
                                  onClick={() => updateServiceConfig(service.name, { ports: [...config.ports, ''] })}
                                  className="text-xs font-semibold text-purple-200 hover:text-white"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {config.ports.map((port, idx) => {
                                  const [hostPort, containerPort] = port.split(':');
                                  return (
                                    <div key={idx} className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] text-slate-300 mb-1">Host port</label>
                                        <input
                                          type="text"
                                          value={hostPort || ''}
                                          onChange={(e) => {
                                            const newPorts = [...config.ports];
                                            newPorts[idx] = `${e.target.value}:${containerPort || '80'}`;
                                            updateServiceConfig(service.name, { ports: newPorts });
                                          }}
                                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="8080"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] text-slate-300 mb-1">Container port</label>
                                        <input
                                          type="text"
                                          value={containerPort || ''}
                                          onChange={(e) => {
                                            const newPorts = [...config.ports];
                                            newPorts[idx] = `${hostPort || '8080'}:${e.target.value}`;
                                            updateServiceConfig(service.name, { ports: newPorts });
                                          }}
                                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="80"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {config.volumes.length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">Volumes</span>
                                <button
                                  type="button"
                                  onClick={() => updateServiceConfig(service.name, { volumes: [...config.volumes, ''] })}
                                  className="text-xs font-semibold text-purple-200 hover:text-white"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {config.volumes.map((vol, idx) => {
                                  const [hostPath, containerPath] = vol.split(':');
                                  return (
                                    <div key={idx} className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] text-slate-300 mb-1">Host path</label>
                                        <input
                                          type="text"
                                          value={hostPath || ''}
                                          onChange={(e) => {
                                            const newVols = [...config.volumes];
                                            newVols[idx] = `${e.target.value}:${containerPath || '/data'}`;
                                            updateServiceConfig(service.name, { volumes: newVols });
                                          }}
                                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="./wordpress"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] text-slate-300 mb-1">Container path</label>
                                        <input
                                          type="text"
                                          value={containerPath || ''}
                                          onChange={(e) => {
                                            const newVols = [...config.volumes];
                                            newVols[idx] = `${hostPath || './data'}:${e.target.value}`;
                                            updateServiceConfig(service.name, { volumes: newVols });
                                          }}
                                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="/var/www/html"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Network</h3>
                  <p className="text-sm text-slate-300">Control how services communicate with each other.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={networkConfig.enabled}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="peer sr-only"
                  />
                  <div className="h-7 w-14 rounded-full bg-white/10 border border-white/10 transition peer-checked:bg-purple-500 peer-focus:ring-2 peer-focus:ring-purple-300/50 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-lg after:transition peer-checked:after:translate-x-6" />
                </label>
              </div>

              {networkConfig.enabled && (
                <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white">Network name</label>
                    <input
                      type="text"
                      value={networkConfig.name}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="app_network"
                    />

                    <label className="block text-sm font-semibold text-white">Driver</label>
                    <select
                      value={networkConfig.driver}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, driver: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      <option value="bridge" className="bg-slate-900 text-white">bridge</option>
                      <option value="host" className="bg-slate-900 text-white">host</option>
                      <option value="overlay" className="bg-slate-900 text-white">overlay</option>
                      <option value="macvlan" className="bg-slate-900 text-white">macvlan</option>
                      <option value="none" className="bg-slate-900 text-white">none</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white">Subnet</label>
                    <input
                      type="text"
                      value={networkConfig.ipam.subnet}
                      onChange={(e) => setNetworkConfig(prev => ({
                        ...prev,
                        ipam: { ...prev.ipam, subnet: e.target.value }
                      }))}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="172.20.0.0/16"
                    />

                    <label className="block text-sm font-semibold text-white">Gateway</label>
                    <input
                      type="text"
                      value={networkConfig.ipam.gateway}
                      onChange={(e) => setNetworkConfig(prev => ({
                        ...prev,
                        ipam: { ...prev.ipam, gateway: e.target.value }
                      }))}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="172.20.0.1"
                    />

                    <div className="flex flex-wrap gap-3 pt-1 text-sm text-slate-200">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={networkConfig.internal}
                          onChange={(e) => setNetworkConfig(prev => ({ ...prev, internal: e.target.checked }))}
                          className="h-4 w-4 rounded border-white/20 bg-black/40 text-purple-500 focus:ring-purple-500/50"
                        />
                        Internal
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={networkConfig.attachable}
                          onChange={(e) => setNetworkConfig(prev => ({ ...prev, attachable: e.target.checked }))}
                          className="h-4 w-4 rounded border-white/20 bg-black/40 text-purple-500 focus:ring-purple-500/50"
                        />
                        Attachable
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur">
                <div className="flex gap-2 p-3">
                  <button
                    onClick={() => setActiveTab('command')}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      activeTab === 'command'
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Docker command
                  </button>
                  <button
                    onClick={() => setActiveTab('compose')}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      activeTab === 'compose'
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Docker Compose
                  </button>
                </div>
                <div className="relative max-h-[70vh] overflow-auto border-t border-white/10 bg-gradient-to-b from-slate-900 via-black to-black px-4 py-5">
                  <button
                    onClick={() => {
                      const text = activeTab === 'command' ? generateDockerCommand() : generateDockerCompose();
                      if (text.trim().length > 0) {
                        navigator.clipboard.writeText(text).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        });
                      }
                    }}
                    className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/5 p-2 text-slate-100 hover:bg-white/10"
                    title="Copy to clipboard"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-emerald-200 pr-10">
                    {activeTab === 'command' ? generateDockerCommand() : generateDockerCompose()}
                  </pre>
                  {copied && (
                    <div className="absolute right-4 top-14 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-100 border border-emerald-400/30">
                      Copied
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur">
                <h4 className="mb-2 text-sm font-semibold text-white">Tips</h4>
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>Toggle services to include only what you need.</li>
                  <li>Network name is reused in both docker run and compose outputs.</li>
                  <li>Use the copy button to quickly grab the selected output.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
