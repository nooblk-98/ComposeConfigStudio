'use client';

import React, { useState } from 'react';
import { AppDefinition } from '@/types/app';

interface SimpleConfigPanelProps {
  app: AppDefinition;
}

interface ServiceConfig {
  enabled: boolean;
  selectedImage: string;
  environment: Record<string, string>;
  ports: string[];
  volumes: string[];
}

export default function SimpleConfigPanel({ app }: SimpleConfigPanelProps) {
  // Initialize service configs
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceConfig>>(() => {
    const configs: Record<string, ServiceConfig> = {};
    
    app.services?.forEach(service => {
      configs[service.name] = {
        enabled: service.mandatory,
        selectedImage: service.defaultImage,
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

  const generateDockerCompose = () => {
    const enabledServices = app.services?.filter(s => serviceConfigs[s.name]?.enabled);
    if (!enabledServices) return '';

    let yaml = 'version: "3.8"\n\nservices:\n';

    enabledServices.forEach(service => {
      const config = serviceConfigs[service.name];
      yaml += `  ${service.name}:\n`;
      yaml += `    image: ${config.selectedImage}\n`;
      yaml += `    container_name: ${service.containerName}\n`;
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
      
      yaml += '\n';
    });

    if (app.namedVolumes && app.namedVolumes.length > 0) {
      yaml += 'volumes:\n';
      app.namedVolumes.forEach(vol => yaml += `  ${vol}:\n`);
    }

    return yaml;
  };

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateDockerCompose()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Panel - Configuration */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => window.location.reload()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Apps
          </button>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{app.name}</h1>
          <p className="text-gray-600 mb-8">{app.description}</p>

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
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Environment Variables
                        </label>
                        <div className="space-y-3">
                          {Object.entries(config.environment).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-3 items-center">
                              <span className="text-sm font-mono text-gray-600">{key}</span>
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ports
                        </label>
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Volumes
                        </label>
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
        </div>
      </div>

      {/* Right Panel - Output */}
      <div className="w-1/2 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-semibold">docker-compose.yml</h3>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-gray-300 text-sm font-mono leading-relaxed">
            {generateDockerCompose()}
          </pre>
        </div>
      </div>
    </div>
  );
}
