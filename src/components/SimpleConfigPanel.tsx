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
  const [showNetworkTab, setShowNetworkTab] = useState(false);
  
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Panel - Configuration */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Apps
          </button>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{app.name}</h1>
          <p className="text-gray-600 mb-8">{app.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Services Enabled</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(serviceConfigs).filter(cfg => cfg.enabled).length}/{app.services?.length || 0}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Network</p>
              <p className="text-lg font-semibold text-gray-900">{networkConfig.enabled ? networkConfig.name : 'Disabled'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Output</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</p>
            </div>
          </div>

          {/* Services */}
          {app.services?.map((service) => {
            const config = serviceConfigs[service.name];
            if (!config) return null;

            return (
              <div key={service.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                {/* Service Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-gray-900 capitalize">{service.displayName || service.name}</h2>
                      {service.mandatory && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-mono">{service.containerName}</p>
                  </div>
                  
                  {!service.mandatory && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => updateServiceConfig(service.name, { enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  )}
                </div>

                {config.enabled && (
                  <div className="space-y-4">
                    {/* Container Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Container Name
                      </label>
                      <input
                        type="text"
                        value={config.containerName}
                        onChange={(e) => updateServiceConfig(service.name, { containerName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-mono"
                        placeholder={service.containerName}
                      />
                    </div>

                    {/* Image Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Docker Image
                      </label>
                      <select
                        value={config.selectedImage}
                        onChange={(e) => updateServiceConfig(service.name, { selectedImage: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                      >
                        {service.images.map(img => (
                          <option key={img} value={img}>{img}</option>
                        ))}
                      </select>
                    </div>

                    {/* Environment Variables */}
                    {Object.keys(config.environment).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Environment Variables
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const index = Object.keys(config.environment).length + 1;
                              updateServiceConfig(service.name, {
                                environment: { ...config.environment, [`NEW_VAR_${index}`]: '' }
                              });
                            }}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            + Add variable
                          </button>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(config.environment).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-3 items-center">
                              <span className="text-sm font-mono text-gray-600 truncate" title={key}>{key}</span>
                              <input
                                type={key.toLowerCase().includes('password') ? 'password' : 'text'}
                                value={value}
                                onChange={(e) => updateEnv(service.name, key, e.target.value)}
                                className="col-span-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ports */}
                    {config.ports.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Ports
                          </label>
                          <button
                            type="button"
                            onClick={() => updateServiceConfig(service.name, { ports: [...config.ports, ''] })}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            + Add port
                          </button>
                        </div>
                        {config.ports.map((port, idx) => {
                          const [hostPort, containerPort] = port.split(':');
                          return (
                            <div key={idx} className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Host Port</label>
                                <input
                                  type="text"
                                  value={hostPort || ''}
                                  onChange={(e) => {
                                    const newPorts = [...config.ports];
                                    newPorts[idx] = `${e.target.value}:${containerPort || '80'}`;
                                    updateServiceConfig(service.name, { ports: newPorts });
                                  }}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                  placeholder="8080"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Container Port</label>
                                <input
                                  type="text"
                                  value={containerPort || ''}
                                  onChange={(e) => {
                                    const newPorts = [...config.ports];
                                    newPorts[idx] = `${hostPort || '8080'}:${e.target.value}`;
                                    updateServiceConfig(service.name, { ports: newPorts });
                                  }}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                  placeholder="80"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Volumes */}
                    {config.volumes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Volumes
                          </label>
                          <button
                            type="button"
                            onClick={() => updateServiceConfig(service.name, { volumes: [...config.volumes, ''] })}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            + Add volume
                          </button>
                        </div>
                        {config.volumes.map((vol, idx) => {
                          const [hostPath, containerPath] = vol.split(':');
                          return (
                            <div key={idx} className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Host Path</label>
                                <input
                                  type="text"
                                  value={hostPath || ''}
                                  onChange={(e) => {
                                    const newVols = [...config.volumes];
                                    newVols[idx] = `${e.target.value}:${containerPath || '/data'}`;
                                    updateServiceConfig(service.name, { volumes: newVols });
                                  }}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                                  placeholder="./wordpress"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Container Path</label>
                                <input
                                  type="text"
                                  value={containerPath || ''}
                                  onChange={(e) => {
                                    const newVols = [...config.volumes];
                                    newVols[idx] = `${hostPath || './data'}:${e.target.value}`;
                                    updateServiceConfig(service.name, { volumes: newVols });
                                  }}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                                  placeholder="/var/www/html"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Network Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Network</h2>
                <button
                  onClick={() => setShowNetworkTab(!showNetworkTab)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showNetworkTab ? '▼ Hide' : '▶ Show'} Settings
                </button>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={networkConfig.enabled}
                  onChange={(e) => setNetworkConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {showNetworkTab && networkConfig.enabled && (
              <div className="space-y-4">
                {/* Network Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Network Name
                  </label>
                  <input
                    type="text"
                    value={networkConfig.name}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-mono"
                    placeholder="app_network"
                  />
                </div>

                {/* Network Driver */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Driver
                  </label>
                  <select
                    value={networkConfig.driver}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  >
                    <option value="bridge">bridge</option>
                    <option value="host">host</option>
                    <option value="overlay">overlay</option>
                    <option value="macvlan">macvlan</option>
                    <option value="none">none</option>
                  </select>
                </div>

                {/* IPAM Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subnet
                    </label>
                    <input
                      type="text"
                      value={networkConfig.ipam.subnet}
                      onChange={(e) => setNetworkConfig(prev => ({ 
                        ...prev, 
                        ipam: { ...prev.ipam, subnet: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-mono"
                      placeholder="172.20.0.0/16"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gateway
                    </label>
                    <input
                      type="text"
                      value={networkConfig.ipam.gateway}
                      onChange={(e) => setNetworkConfig(prev => ({ 
                        ...prev, 
                        ipam: { ...prev.ipam, gateway: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-mono"
                      placeholder="172.20.0.1"
                    />
                  </div>
                </div>

                {/* Network Options */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={networkConfig.internal}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, internal: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Internal (isolated from external access)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={networkConfig.attachable}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, attachable: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Attachable (standalone containers can attach)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Output */}
      <div className="w-1/2 bg-gray-900 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('command')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'command'
                ? 'bg-black text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-200 bg-gray-800'
            }`}
          >
            Docker command
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'compose'
                ? 'bg-black text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-200 bg-gray-800'
            }`}
          >
            Docker Compose
          </button>
        </div>

          {/* Terminal Output */}
          <div className="flex-1 overflow-auto bg-black p-6 relative">
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
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
              title="Copy to clipboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <pre className="text-green-400 text-sm font-mono leading-relaxed pr-12 whitespace-pre-wrap">
              {activeTab === 'command' ? generateDockerCommand() : generateDockerCompose()}
            </pre>
            {copied && (
              <div className="absolute top-4 right-14 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-sm">
                Copied!
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
