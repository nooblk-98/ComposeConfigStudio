'use client';

import React, { useRef, useState } from 'react';
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
  resourceLimits: {
    enabled: boolean;
    memory: string;
    cpus: string;
  };
  volumesEnabled: boolean;
}

const DOCKER_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-plain.svg';

export default function SimpleConfigPanel({ app, onBack }: SimpleConfigPanelProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [optionalEnvValues, setOptionalEnvValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    app.optionalEnv?.forEach(opt => {
      initial[opt.key] = opt.defaultValue || '';
    });
    return initial;
  });
  const getServiceIcon = () => DOCKER_ICON;

  // Track default values to prevent removing predefined entries
  const defaultsRef = useRef<Record<string, { envKeys: Set<string>; ports: number; volumes: number }>>({});

  // Initialize service configs
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceConfig>>(() => {
    const configs: Record<string, ServiceConfig> = {};

    app.services?.forEach(service => {
      if (!defaultsRef.current[service.name]) {
        defaultsRef.current[service.name] = {
          envKeys: new Set(Object.keys(service.environment || {})),
          ports: service.ports?.length || 0,
          volumes: service.volumes?.length || 0
        };
      }
      configs[service.name] = {
        enabled: service.mandatory,
        selectedImage: service.defaultImage,
        containerName: service.containerName,
        environment: { ...service.environment },
        ports: [...(service.ports || [])],
        volumes: [...(service.volumes || [])],
        volumesEnabled: true,
        resourceLimits: {
          enabled: false,
          memory: '',
          cpus: ''
        }
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

  const renameEnvKey = (serviceName: string, oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;

    setServiceConfigs(prev => {
      const env = prev[serviceName].environment;
      // Avoid overwriting an existing key
      if (Object.prototype.hasOwnProperty.call(env, newKey)) {
        return prev;
      }
      const { [oldKey]: value, ...rest } = env;
      return {
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          environment: { ...rest, [newKey]: value }
        }
      };
    });
  };

  const removeEnv = (serviceName: string, key: string) => {
    setServiceConfigs(prev => {
      const { [key]: _removed, ...rest } = prev[serviceName].environment;
      return {
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          environment: rest
        }
      };
    });
  };

  const removePort = (serviceName: string, index: number) => {
    setServiceConfigs(prev => {
      const updated = [...prev[serviceName].ports];
      updated.splice(index, 1);
      return {
        ...prev,
        [serviceName]: { ...prev[serviceName], ports: updated }
      };
    });
  };

  const removeVolume = (serviceName: string, index: number) => {
    setServiceConfigs(prev => {
      const updated = [...prev[serviceName].volumes];
      updated.splice(index, 1);
      return {
        ...prev,
        [serviceName]: { ...prev[serviceName], volumes: updated }
      };
    });
  };

  const [copied, setCopied] = useState(false);

  // Network configuration
  const [networkConfig, setNetworkConfig] = useState({
    enabled: true,
    name: `${app.id}_network`,
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

      if (config.resourceLimits.enabled) {
        if (config.resourceLimits.memory.trim()) {
          cmd += ` --memory ${config.resourceLimits.memory.trim()}`;
        }
        if (config.resourceLimits.cpus.trim()) {
          cmd += ` --cpus ${config.resourceLimits.cpus.trim()}`;
        }
      }

      Object.entries(config.environment).forEach(([key, value]) => {
        if (key) {
          cmd += ` -e ${key}=${value}`;
        }
      });
      const primaryService = enabledServices[0];
      if (service.name === app.id || service.name === primaryService?.name) {
        app.optionalEnv?.forEach(opt => {
          const val = optionalEnvValues[opt.key]?.trim();
          if (val) {
            cmd += ` -e ${opt.key}=${val}`;
          }
        });
      }

      config.volumes.forEach(vol => {
        const trimmed = vol.trim();
        if (trimmed && config.volumesEnabled) {
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
        const primaryService = enabledServices[0];
        if (service.name === app.id || service.name === primaryService?.name) {
          app.optionalEnv?.forEach(opt => {
            const val = optionalEnvValues[opt.key]?.trim();
            if (val) {
              yaml += `      ${opt.key}: ${val}\n`;
            }
          });
        }
      }

      if (config.volumes.length > 0) {
        if (config.volumesEnabled) {
          yaml += `    volumes:\n`;
          config.volumes.forEach(vol => yaml += `      - ${vol}\n`);
        }
      }

      if (config.resourceLimits.enabled && (config.resourceLimits.memory || config.resourceLimits.cpus)) {
        yaml += `    deploy:\n`;
        yaml += `      resources:\n`;
        yaml += `        limits:\n`;
        if (config.resourceLimits.cpus) {
          yaml += `          cpus: '${config.resourceLimits.cpus}'\n`;
        }
        if (config.resourceLimits.memory) {
          yaml += `          memory: ${config.resourceLimits.memory}\n`;
        }
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
    <div className="relative min-h-screen bg-slate-50">
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3 text-slate-800">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-base font-medium text-slate-800 border border-slate-200 hover:bg-slate-100 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to apps
          </button>
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">Configure &amp; launch</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {app.logo && (
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={app.logo} alt={app.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">{app.name}</h1>
                      <p className="text-base text-slate-600">{app.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
                      {app.category}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 border border-blue-200">v{app.version}</span>
                    {app.defaultPort && (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700 border border-purple-200">Default port {app.defaultPort}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-64">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
                    <p className="text-sm uppercase tracking-wide text-slate-500">Services</p>
                    <p className="text-xl font-semibold text-slate-900">
                      {Object.values(serviceConfigs).filter(cfg => cfg.enabled).length}/{app.services?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
                    <p className="text-sm uppercase tracking-wide text-slate-500">Network</p>
                    <p className="text-base font-medium text-slate-900 truncate">{networkConfig.enabled ? networkConfig.name : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {app.services?.map((service) => {
                const config = serviceConfigs[service.name];
                if (!config) return null;
                const iconUrl = getServiceIcon(service);

                return (
                  <div key={service.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                            {iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={iconUrl}
                                alt={`${service.displayName || service.name} logo`}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-slate-800">
                                {(service.displayName || service.name).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900 capitalize">{service.displayName || service.name}</h2>
                            <p className="text-sm text-slate-500 font-mono">{service.containerName}</p>
                          </div>
                          {service.mandatory && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 border border-blue-200">
                              Required
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="mt-2 text-sm text-slate-600">{service.description}</p>
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
                          <div className="h-7 w-14 rounded-full bg-slate-200 border border-slate-300 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-200 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
                        </label>
                      )}
                    </div>

                    {config.enabled && (
                      <div className="space-y-6 px-5 py-5 bg-slate-50">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-base font-semibold text-slate-900">Container name</label>
                            <input
                              type="text"
                              value={config.containerName}
                              onChange={(e) => updateServiceConfig(service.name, { containerName: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                              placeholder={service.containerName}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-base font-semibold text-slate-900">Docker image</label>
                            <select
                              value={config.selectedImage}
                              onChange={(e) => updateServiceConfig(service.name, { selectedImage: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              {service.images.map(img => (
                                <option key={img} value={img} className="bg-white text-slate-900">{img}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {Object.keys(config.environment).length > 0 && (
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-base font-semibold text-slate-900">Environment variables</span>
                              <button
                                type="button"
                                  onClick={() => {
                                    const index = Object.keys(config.environment).length + 1;
                                    updateServiceConfig(service.name, {
                                      environment: { ...config.environment, [`NEW_VAR_${index}`]: '' }
                                    });
                                  }}
                                  className="text-sm font-semibold text-purple-700 hover:text-purple-900"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(config.environment).map(([key, value]) => (
                                  <div key={key} className="grid grid-cols-[1.1fr_1fr_auto] gap-3 items-center">
                                    <div className="flex">
                                      {defaultsRef.current[service.name]?.envKeys.has(key) ? (
                                        <span className="inline-flex h-11 min-w-0 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-mono text-slate-900 shadow-sm" title={key}>{key}</span>
                                      ) : (
                                        <input
                                          type="text"
                                          value={key}
                                          onChange={(e) => renameEnvKey(service.name, key, e.target.value)}
                                          className="w-full h-11 rounded-lg border border-slate-200 bg-white px-2 text-sm font-mono text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="ENV_NAME"
                                        />
                                      )}
                                    </div>
                                    <div className="relative">
                                      <input
                                        type={key.toLowerCase().includes('password') && !showPasswords[`${service.name}_${key}`] ? 'password' : 'text'}
                                        value={value}
                                        onChange={(e) => updateEnv(service.name, key, e.target.value)}
                                        className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                      />
                                      {key.toLowerCase().includes('password') && (
                                        <button
                                          type="button"
                                          onClick={() => setShowPasswords(prev => ({
                                            ...prev,
                                            [`${service.name}_${key}`]: !prev[`${service.name}_${key}`]
                                          }))}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                          title={showPasswords[`${service.name}_${key}`] ? 'Hide password' : 'Show password'}
                                          aria-label={showPasswords[`${service.name}_${key}`] ? 'Hide password' : 'Show password'}
                                        >
                                          {showPasswords[`${service.name}_${key}`] ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M17.94 17.94 6.06 6.06" />
                                              <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                                              <path d="M9.88 4.24a10.07 10.07 0 0 1 12.18 7.76 10.05 10.05 0 0 1-3.16 5.05M6.19 6.19A10.06 10.06 0 0 0 1.93 12a10.05 10.05 0 0 0 11 6.9" />
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                                              <circle cx="12" cy="12" r="3" />
                                            </svg>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    {defaultsRef.current[service.name]?.envKeys.has(key) ? null : (
                                      <button
                                        type="button"
                                        onClick={() => removeEnv(service.name, key)}
                                        className="h-11 w-11 flex items-center justify-center rounded-md border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
                                        title="Remove variable"
                                        aria-label="Remove variable"
                                      >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                          <path d="M9 3h6a1 1 0 0 1 .99.86L16 5h4a1 1 0 1 1 0 2h-.99l-.8 12.06A2 2 0 0 1 16.21 21H7.8a2 2 0 0 1-1.99-1.94L5 7H4a1 1 0 0 1 0-2h4l.01-1.14A1 1 0 0 1 9 3Zm6.01 4H8.99l-.7 12h7.42l.3-12Z" />
                                          <path d="M10 10a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {app.optionalEnv && app.optionalEnv.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="mb-3">
                                <span className="text-base font-semibold text-slate-900">Optional environment variables</span>
                                <p className="text-sm text-slate-500">Only included when a value is provided.</p>
                              </div>
                              <div className="space-y-3">
                                {app.optionalEnv.map(opt => (
                                  <div key={opt.key} className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-mono text-slate-800">{opt.key}</span>
                                      {opt.description && <span className="text-xs text-slate-500">{opt.description}</span>}
                                    </div>
                                    <input
                                      type={opt.key.toLowerCase().includes('password') ? 'password' : 'text'}
                                      value={optionalEnvValues[opt.key] ?? ''}
                                      onChange={(e) => setOptionalEnvValues(prev => ({ ...prev, [opt.key]: e.target.value }))}
                                      className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                      placeholder={opt.defaultValue || 'Enter value'}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {config.ports.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-base font-semibold text-slate-900">Ports</span>
                                <button
                                  type="button"
                                  onClick={() => updateServiceConfig(service.name, { ports: [...config.ports, ''] })}
                                  className="text-sm font-semibold text-purple-700 hover:text-purple-900"
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
                                        <label className="block text-sm text-slate-700 mb-1">Host port</label>
                                        <input
                                          type="text"
                                          value={hostPort || ''}
                                          onChange={(e) => {
                                            const newPorts = [...config.ports];
                                            newPorts[idx] = `${e.target.value}:${containerPort || '80'}`;
                                            updateServiceConfig(service.name, { ports: newPorts });
                                          }}
                                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="8080"
                                        />
                                      </div>
                                    <div>
                                      <label className="block text-sm text-slate-700 mb-1">Container port</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={containerPort || ''}
                                          onChange={(e) => {
                                            const newPorts = [...config.ports];
                                            newPorts[idx] = `${hostPort || '8080'}:${e.target.value}`;
                                            updateServiceConfig(service.name, { ports: newPorts });
                                          }}
                                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="80"
                                        />
                                        {idx >= (defaultsRef.current[service.name]?.ports ?? 0) && (
                                          <button
                                            type="button"
                                            onClick={() => removePort(service.name, idx)}
                                            className="p-2 rounded-md border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
                                            title="Remove port mapping"
                                            aria-label="Remove port mapping"
                                          >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                              <path d="M9 3h6a1 1 0 0 1 .99.86L16 5h4a1 1 0 1 1 0 2h-.99l-.8 12.06A2 2 0 0 1 16.21 21H7.8a2 2 0 0 1-1.99-1.94L5 7H4a1 1 0 0 1 0-2h4l.01-1.14A1 1 0 0 1 9 3Zm6.01 4H8.99l-.7 12h7.42l.3-12Z" />
                                              <path d="M10 10a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          )}

                          {config.volumes.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-base font-semibold text-slate-900">Volumes</span>
                                  <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                      type="checkbox"
                                      checked={config.volumesEnabled}
                                      onChange={(e) => updateServiceConfig(service.name, { volumesEnabled: e.target.checked })}
                                      className="peer sr-only"
                                    />
                                    <div className="h-7 w-14 rounded-full bg-slate-200 border border-slate-300 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-200 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateServiceConfig(service.name, { volumes: [...config.volumes, ''] })}
                                  className={`text-sm font-semibold ${config.volumesEnabled ? 'text-purple-700 hover:text-purple-900' : 'text-slate-400 cursor-not-allowed'}`}
                                  disabled={!config.volumesEnabled}
                                >
                                  + Add
                                </button>
                              </div>
                              {config.volumesEnabled && (
                              <div className="space-y-2">
                                {config.volumes.map((vol, idx) => {
                                  const [hostPath, containerPath] = vol.split(':');
                                  return (
                                    <div key={idx} className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-sm text-slate-700 mb-1">Host path</label>
                                        <input
                                          type="text"
                                          value={hostPath || ''}
                                          onChange={(e) => {
                                            const newVols = [...config.volumes];
                                            newVols[idx] = `${e.target.value}:${containerPath || '/data'}`;
                                            updateServiceConfig(service.name, { volumes: newVols });
                                          }}
                                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder="./wordpress"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-700 mb-1">Container path</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={containerPath || ''}
                                            onChange={(e) => {
                                              const newVols = [...config.volumes];
                                              newVols[idx] = `${hostPath || './data'}:${e.target.value}`;
                                              updateServiceConfig(service.name, { volumes: newVols });
                                            }}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                            placeholder="/var/www/html"
                                          />
                                          {idx >= (defaultsRef.current[service.name]?.volumes ?? 0) && (
                                            <button
                                              type="button"
                                              onClick={() => removeVolume(service.name, idx)}
                                              className="p-2 rounded-md border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200"
                                              title="Remove volume"
                                              aria-label="Remove volume"
                                            >
                                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path d="M9 3h6a1 1 0 0 1 .99.86L16 5h4a1 1 0 1 1 0 2h-.99l-.8 12.06A2 2 0 0 1 16.21 21H7.8a2 2 0 0 1-1.99-1.94L5 7H4a1 1 0 0 1 0-2h4l.01-1.14A1 1 0 0 1 9 3Zm6.01 4H8.99l-.7 12h7.42l.3-12Z" />
                                                <path d="M10 10a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              )}
                              {!config.volumesEnabled && (
                                <p className="text-sm text-slate-500">Volumes are disabled for this service.</p>
                              )}
                            </div>
                          )}

                          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-base font-semibold text-slate-900">Resource limits</span>
                                <p className="text-sm text-slate-500">Optional CPU/Memory caps for this container.</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  checked={config.resourceLimits.enabled}
                                  onChange={(e) => updateServiceConfig(service.name, { resourceLimits: { ...config.resourceLimits, enabled: e.target.checked } })}
                                  className="peer sr-only"
                                />
                                <div className="h-7 w-14 rounded-full bg-slate-200 border border-slate-300 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-200 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
                              </label>
                            </div>
                            {config.resourceLimits.enabled && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-sm font-semibold text-slate-800">Memory</label>
                                  <input
                                    type="text"
                                    value={config.resourceLimits.memory}
                                    onChange={(e) => updateServiceConfig(service.name, { resourceLimits: { ...config.resourceLimits, memory: e.target.value } })}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    placeholder="512m or 1g"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-sm font-semibold text-slate-800">CPUs</label>
                                  <input
                                    type="text"
                                    value={config.resourceLimits.cpus}
                                    onChange={(e) => updateServiceConfig(service.name, { resourceLimits: { ...config.resourceLimits, cpus: e.target.value } })}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    placeholder="0.5 or 2"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Network</h3>
                  <p className="text-base text-slate-600">Control how services communicate with each other.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={networkConfig.enabled}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="peer sr-only"
                  />
                  <div className="h-7 w-14 rounded-full bg-slate-200 border border-slate-300 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-200 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
                </label>
              </div>

              {networkConfig.enabled && (
                <div className="grid gap-4 px-5 py-5 md:grid-cols-2 bg-slate-50">
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-slate-900">Network name</label>
                    <input
                      type="text"
                      value={networkConfig.name}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="app_network"
                    />

                    <label className="block text-base font-semibold text-slate-900">Driver</label>
                    <select
                      value={networkConfig.driver}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, driver: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      <option value="bridge" className="bg-white text-slate-900">bridge</option>
                      <option value="host" className="bg-white text-slate-900">host</option>
                      <option value="overlay" className="bg-white text-slate-900">overlay</option>
                      <option value="macvlan" className="bg-white text-slate-900">macvlan</option>
                      <option value="none" className="bg-white text-slate-900">none</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-slate-900">Subnet</label>
                    <input
                      type="text"
                      value={networkConfig.ipam.subnet}
                      onChange={(e) => setNetworkConfig(prev => ({
                        ...prev,
                        ipam: { ...prev.ipam, subnet: e.target.value }
                      }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="172.20.0.0/16"
                    />

                    <label className="block text-base font-semibold text-slate-900">Gateway</label>
                    <input
                      type="text"
                      value={networkConfig.ipam.gateway}
                      onChange={(e) => setNetworkConfig(prev => ({
                        ...prev,
                        ipam: { ...prev.ipam, gateway: e.target.value }
                      }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="172.20.0.1"
                    />

                    <div className="flex flex-wrap gap-3 pt-1 text-base text-slate-700">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={networkConfig.internal}
                          onChange={(e) => setNetworkConfig(prev => ({ ...prev, internal: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500/30"
                        />
                        Internal
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={networkConfig.attachable}
                          onChange={(e) => setNetworkConfig(prev => ({ ...prev, attachable: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500/30"
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
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-3 py-3">
                  <span className="inline-flex items-center rounded-xl bg-purple-600 text-white text-sm font-semibold px-3 py-2">
                    Docker Compose
                  </span>
                </div>
                <div className="relative max-h-[70vh] overflow-auto border-t border-slate-100 bg-slate-50 px-4 py-5">
                  <button
                    onClick={() => {
                      const text = generateDockerCompose();
                      if (text.trim().length > 0) {
                        navigator.clipboard.writeText(text).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        });
                      }
                    }}
                    className="absolute right-4 top-4 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100"
                    title="Copy to clipboard"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-emerald-700 pr-10">
                    {generateDockerCompose()}
                  </pre>
                  {copied && (
                    <div className="absolute right-4 top-14 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 border border-emerald-200">
                      Copied
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-700 shadow-sm">
                <h4 className="mb-2 text-base font-semibold text-slate-900">Tips</h4>
                <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
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
