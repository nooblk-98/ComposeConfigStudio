'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Space, Tag, Typography, Tooltip as AntTooltip } from 'antd';
import { ArrowLeftOutlined, CloudDownloadOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { AppDefinition, ServiceDefinition } from '@/types/app';

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
  portsEnabled: boolean;
  restartPolicy: string;
  restartPolicyEnabled: boolean;
}

const DOCKER_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-plain.svg';

const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
  <AntTooltip title={content} color="#1f1f1f">
    {children}
  </AntTooltip>
);

const InfoIcon = ({ content }: { content: string }) => (
  <Tooltip content={content}>
    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
  </Tooltip>
);

export default function SimpleConfigPanel({ app, onBack }: SimpleConfigPanelProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [optionalEnvValues, setOptionalEnvValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    // App-level optional env (for main service)
    if (app.optionalEnv && app.optionalEnv.length > 0) {
      initial[app.id] = {};
      app.optionalEnv.forEach(opt => {
        initial[app.id][opt.key] = opt.defaultValue || '';
      });
    }
    // Service-level optional env
    app.services?.forEach(service => {
      if (service.optionalEnv && service.optionalEnv.length > 0) {
        initial[service.name] = initial[service.name] || {};
        service.optionalEnv.forEach(opt => {
          if (initial[service.name][opt.key] === undefined) {
            initial[service.name][opt.key] = opt.defaultValue || '';
          }
        });
      }
    });
    return initial;
  });
  
  // Track which services are expanded (default: all collapsed)
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [networkExpanded, setNetworkExpanded] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({});

  // Auto-expand first enabled service on load
  useEffect(() => {
    if (app.services) {
      const firstEnabled = app.services.find(s => serviceConfigs[s.name]?.enabled);
      if (firstEnabled) {
        setExpandedServices(prev => ({ ...prev, [firstEnabled.name]: true }));
      }
    }
  }, []);

  const validatePort = (port: string): boolean => {
    if (!port) return true; // Empty is handled by other logic if required
    const parts = port.split(':');
    return parts.every(p => {
      const num = parseInt(p, 10);
      return !isNaN(num) && num >= 0 && num <= 65535;
    });
  };

  const validateContainerName = (name: string): boolean => {
    if (!name) return true;
    // Docker container name regex: [a-zA-Z0-9][a-zA-Z0-9_.-]*
    return /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name);
  };

  const toggleServiceExpanded = (serviceName: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };
  
  const getServiceIcon = (_service?: ServiceDefinition) => DOCKER_ICON;

  // Track default values to prevent removing predefined entries
  const defaultsRef = useRef<Record<string, { envKeys: Set<string>; ports: number; volumes: number }>>({});

  // Initialize service configs
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceConfig>>(() => {
    const configs: Record<string, ServiceConfig> = {};
    const firstInGroup: Record<string, boolean> = {};

    // First pass: create all configs
    app.services?.forEach(service => {
      const inGroup = service.group;
      const shouldEnable = inGroup
        ? !firstInGroup[inGroup]
        : (service.mandatory || service.defaultEnabled === true);
      if (inGroup && !firstInGroup[inGroup]) {
        firstInGroup[inGroup] = true;
      }

      if (!defaultsRef.current[service.name]) {
        defaultsRef.current[service.name] = {
          envKeys: new Set(Object.keys(service.environment || {})),
          ports: service.ports?.length || 0,
          volumes: service.volumes?.length || 0
        };
      }
      configs[service.name] = {
        enabled: shouldEnable,
        selectedImage: service.defaultImage,
        containerName: service.containerName || '',
        environment: { ...service.environment },
        ports: [...(service.ports || [])],
        volumes: [...(service.volumes || [])],
        volumesEnabled: true,
        portsEnabled: (service.ports || []).length > 0,
        restartPolicy: service.restart || 'always',
        restartPolicyEnabled: !!service.restart,
        resourceLimits: {
          enabled: false,
          memory: '',
          cpus: ''
        }
      };
    });

    // Second pass: resolve variable references
    app.services?.forEach(service => {
      if (service.environment) {
        Object.entries(service.environment).forEach(([key, value]) => {
          if (typeof value === 'string' && value.match(/^\$\{(\w+)\.(\w+)\}$/)) {
            const match = value.match(/^\$\{(\w+)\.(\w+)\}$/);
            if (match) {
              const [, refServiceName, refVarName] = match;
              if (configs[refServiceName]?.environment?.[refVarName]) {
                configs[service.name].environment[key] = configs[refServiceName].environment[refVarName];
              }
            }
          }
        });
      }
    });

    return configs;
  });

  // Helper function to resolve variable references like ${serviceName.VAR_NAME}
  const resolveVariableReference = (value: string, allConfigs: Record<string, ServiceConfig>): string => {
    if (typeof value !== 'string') return value;
    
    const match = value.match(/^\$\{(\w+)\.(\w+)\}$/);
    if (match) {
      const [, refServiceName, refVarName] = match;
      if (allConfigs[refServiceName]?.environment?.[refVarName]) {
        return allConfigs[refServiceName].environment[refVarName];
      }
    }
    return value;
  };

  // Helper function to check if an environment variable is linked from another service
  const isLinkedVariable = (serviceName: string, key: string): boolean => {
    const service = app.services?.find(s => s.name === serviceName);
    if (!service?.environment) return false;
    
    const originalValue = service.environment[key];
    return typeof originalValue === 'string' && /^\$\{(\w+)\.(\w+)\}$/.test(originalValue);
  };

  // Generate a random secure password
  const generatePassword = (length: number = 16): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*-_=+';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const updateServiceConfig = (serviceName: string, updates: Partial<ServiceConfig>) => {
    setServiceConfigs(prev => ({
      ...prev,
      [serviceName]: { ...prev[serviceName], ...updates }
    }));
  };

  const setGroupSelection = (group: string, selectedService: string) => {
    setServiceConfigs(prev => {
      const next = { ...prev };

      // Get the selected service object
      const selectedSvc = app.services?.find(s => s.name === selectedService);

      // Toggle services in the group
      app.services
        ?.filter(s => s.group === group)
        .forEach(s => {
          // Enable if it's the selected service OR if it's a dependency of the selected service
          const isDependency = selectedSvc?.dependsOn?.includes(s.name) ?? false;
          next[s.name] = {
            ...next[s.name],
            enabled: s.name === selectedService || isDependency
          };
        });

      // If selecting app flavor, toggle related database service (legacy support for separate database group)
      if (group === 'npm-flavor') {
        const dbMap: Record<string, string | null> = {
          'npm-sqlite': null,
          'npm-mariadb': 'mariadb',
          'npm-postgres': 'postgres'
        };
        const targetDb = dbMap[selectedService];
        app.services
          ?.filter(s => s.group === 'database')
          .forEach(s => {
            next[s.name] = { ...next[s.name], enabled: targetDb === s.name };
          });
      }

      return next;
    });
  };

  // Initialize grouped service selections (to sync env/volumes from non-image services)
  useEffect(() => {
    const groups = app.services?.reduce<Record<string, string>>((acc, svc) => {
      if (svc.group) {
        const cfg = serviceConfigs[svc.name];
        if (cfg?.enabled && !acc[svc.group]) {
          acc[svc.group] = svc.name;
        }
      }
      return acc;
    }, {}) || {};

    Object.entries(groups).forEach(([group, svcName]) => {
      setGroupSelection(group, svcName);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateEnv = (serviceName: string, key: string, value: string) => {
    setServiceConfigs(prev => {
      const updated = {
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          environment: { ...prev[serviceName].environment, [key]: value }
        }
      };

      // Check if any other services reference this variable and update them
      app.services?.forEach(service => {
        if (service.name !== serviceName && service.environment) {
          const needsUpdate: Record<string, string> = {};
          
          Object.entries(service.environment).forEach(([envKey, envValue]) => {
            if (typeof envValue === 'string' && envValue.includes(`\${${serviceName}.${key}}`)) {
              needsUpdate[envKey] = value;
            }
          });

          if (Object.keys(needsUpdate).length > 0) {
            updated[service.name] = {
              ...updated[service.name],
              environment: { ...updated[service.name].environment, ...needsUpdate }
            };
          }
        }
      });

      return updated;
    });
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
    name: app.networks && app.networks.length > 0 ? app.networks[0] : `${app.id}_network`,
    driver: 'bridge',
    ipam: {
      driver: 'default',
      subnet: '',
      gateway: ''
    },
    internal: false,
    attachable: true
  });

  const versionLabel = app.version
    ? app.version === 'latest'
      ? 'latest'
      : app.version.startsWith('v')
        ? app.version
        : `v${app.version}`
    : null;

  const downloadCompose = () => {
    const text = generateDockerCompose();
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'docker-compose.yml';
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateDockerCommand = () => {
    const enabledServices = app.services?.filter(s => serviceConfigs[s.name]?.enabled);
    if (!enabledServices || enabledServices.length === 0) return '';

    const parts: string[] = [];
    const primaryService = app.services?.find(s => !s.group);
    const extraVolumes: string[] = [];

    if (networkConfig.enabled) {
      parts.push(`# Create network once\ndocker network create ${networkConfig.name} || true`);
    }

    enabledServices.forEach(service => {
      const config = serviceConfigs[service.name];
      if (!config.selectedImage?.trim()) {
        if (config.volumesEnabled) {
          config.volumes.forEach(v => {
            const trimmed = v.trim();
            if (trimmed) extraVolumes.push(trimmed);
          });
        }
        return;
      }
      let cmd = `docker run -d --name ${config.containerName}`;

      if (config.restartPolicyEnabled && config.restartPolicy) {
        cmd += ` --restart ${config.restartPolicy}`;
      }

      if (networkConfig.enabled) {
        cmd += ` --network ${networkConfig.name}`;
      }

      config.ports.forEach(port => {
        const trimmed = port.trim();
        if (trimmed && config.portsEnabled) {
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
      const serviceOptional = service.optionalEnv || (service.name === app.id ? app.optionalEnv : undefined);
      if (serviceOptional && serviceOptional.length > 0) {
        const vals = optionalEnvValues[service.name] || optionalEnvValues[app.id] || {};
        serviceOptional.forEach(opt => {
          const val = vals[opt.key]?.trim();
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
      if (primaryService && service.name === primaryService.name && extraVolumes.length > 0) {
        extraVolumes.forEach(v => cmd += ` -v ${v}`);
      }

      cmd += ` ${config.selectedImage}`;
      parts.push(cmd);
    });

    return parts.join('\n\n');
  };

  const generateDockerCompose = () => {
    const enabledServices = app.services?.filter(s => serviceConfigs[s.name]?.enabled);
    if (!enabledServices) return '';

    const enabledServiceNamesWithImages = enabledServices
      .filter(s => (serviceConfigs[s.name]?.selectedImage || '').trim().length > 0)
      .map(s => s.name);
    const primaryService = app.services?.find(s => !s.group);
    const extraVolumes: string[] = [];

    let yaml = 'version: "3.8"\n\nservices:\n';

    enabledServices.forEach(service => {
      const config = serviceConfigs[service.name];
      if (!config.selectedImage?.trim()) {
        if (config.volumesEnabled) {
          config.volumes.forEach(v => {
            const trimmed = v.trim();
            if (trimmed) extraVolumes.push(trimmed);
          });
        }
        return;
      }
      yaml += `  ${service.name}:\n`;
      yaml += `    image: ${config.selectedImage}\n`;
      yaml += `    container_name: ${config.containerName}\n`;
      if (config.restartPolicyEnabled && config.restartPolicy) {
        yaml += `    restart: ${config.restartPolicy}\n`;
      }

      if (config.ports.length > 0 && config.portsEnabled) {
        yaml += `    ports:\n`;
        config.ports.forEach(port => yaml += `      - "${port}"\n`);
      }

      const envKeys = Object.keys(config.environment);
      if (envKeys.length > 0) {
        yaml += `    environment:\n`;
        envKeys.forEach(key => {
          yaml += `      ${key}: ${config.environment[key]}\n`;
        });
        const serviceOptional = service.optionalEnv || (service.name === app.id ? app.optionalEnv : undefined);
        if (serviceOptional && serviceOptional.length > 0) {
          const vals = optionalEnvValues[service.name] || optionalEnvValues[app.id] || {};
          serviceOptional.forEach(opt => {
            const val = vals[opt.key]?.trim();
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
      if (primaryService && service.name === primaryService.name && extraVolumes.length > 0) {
        if (!config.volumesEnabled || config.volumes.length === 0) {
          yaml += `    volumes:\n`;
        }
        extraVolumes.forEach(vol => yaml += `      - ${vol}\n`);
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
      const usedVolumes = app.namedVolumes.filter(v => enabledServiceNamesWithImages.includes(v));
      if (usedVolumes.length > 0) {
        yaml += 'volumes:\n';
        usedVolumes.forEach(vol => yaml += `  ${vol}:\n`);
      }
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
        <Space align="center" size={10} className="text-slate-800">
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ paddingLeft: 0 }}>
            Back to apps
          </Button>
          <Typography.Text type="secondary" style={{ letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Configure &amp; launch
          </Typography.Text>
        </Space>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {app.logo && (
                      <div className="h-12 w-12 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={app.logo} alt={app.name} className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div>
                      <Typography.Title level={3} style={{ margin: 0 }}>
                        {app.name}
                      </Typography.Title>
                      <Typography.Text type="secondary">{app.description}</Typography.Text>
                    </div>
                  </div>
                  <Space wrap style={{ marginTop: 12 }}>
                    <Tag color="green">{app.category}</Tag>
                    {versionLabel && <Tag color="blue">{versionLabel}</Tag>}
                  </Space>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-64">
                  <Card size="small" bordered>
                    <Typography.Text type="secondary">Services</Typography.Text>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {Object.values(serviceConfigs).filter(cfg => cfg.enabled).length}/{app.services?.length || 0}
                    </Typography.Title>
                  </Card>
                  <Card size="small" bordered>
                    <Typography.Text type="secondary">Network</Typography.Text>
                    <Typography.Text strong>{networkConfig.enabled ? networkConfig.name : 'Disabled'}</Typography.Text>
                  </Card>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Services Configuration</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const allExpanded = app.services?.reduce((acc, s) => ({ ...acc, [s.name]: true }), {}) || {};
                    setExpandedServices(allExpanded);
                  }}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Expand All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setExpandedServices({})}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {app.services?.map((service) => {
                const config = serviceConfigs[service.name];
                if (!config) return null;
                if (service.group && !config.enabled) return null;
                const iconUrl = getServiceIcon(service);
                const hasImage = !!config.selectedImage?.trim();

                const isMandatory = service.mandatory;
                const isEnabled = config.enabled;

                return (
                  <div 
                    key={service.name} 
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 
                      ${isMandatory ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-200'} 
                      ${!isEnabled && !isMandatory ? 'opacity-75 grayscale-[0.5]' : ''}
                    `}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center gap-3 flex-1">
                        {config.enabled && (
                          <button
                            onClick={() => toggleServiceExpanded(service.name)}
                            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                            aria-label={expandedServices[service.name] ? 'Collapse' : 'Expand'}
                          >
                            <svg className="w-5 h-5 text-slate-600 transition-transform" style={{ transform: expandedServices[service.name] ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
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
                          {service.description && !expandedServices[service.name] && (
                            <p className="text-sm text-slate-600">{service.description}</p>
                          )}
                          {!expandedServices[service.name] && config.enabled && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {config.portsEnabled && config.ports.length > 0 && (
                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                  Ports: {config.ports.length}
                                </span>
                              )}
                              {config.volumesEnabled && config.volumes.length > 0 && (
                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                  Volumes: {config.volumes.length}
                                </span>
                              )}
                              {config.restartPolicyEnabled && (
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                  Restart: {config.restartPolicy}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {service.mandatory && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 border border-blue-200">
                            Required
                          </span>
                        )}
                        {service.group && service.group !== 'npm-flavor' && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                            {service.group}
                          </span>
                        )}
                      </div>

                      {!service.mandatory && !service.group && (
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

                    {config.enabled && expandedServices[service.name] && (
                      <div className="space-y-6 px-5 py-5 bg-slate-50">
                        {hasImage && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="block text-base font-semibold text-slate-900">Container name</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={config.containerName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateServiceConfig(service.name, { containerName: val });
                                    setValidationErrors(prev => ({
                                      ...prev,
                                      [service.name]: {
                                        ...prev[service.name],
                                        containerName: validateContainerName(val) ? '' : 'Invalid container name'
                                      }
                                    }));
                                  }}
                                  className={`w-full rounded-lg border px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 
                                    ${validationErrors[service.name]?.containerName 
                                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/40' 
                                      : 'border-slate-200 focus:border-purple-400 focus:ring-purple-500/40'
                                    }`}
                                  placeholder="e.g. my-app"
                                />
                                {config.containerName && !validationErrors[service.name]?.containerName && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                )}
                              </div>
                              {validationErrors[service.name]?.containerName && (
                                <p className="text-sm text-red-500">{validationErrors[service.name]?.containerName}</p>
                              )}

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
                        )}

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
                              <div className="space-y-4">
                                {Object.entries(config.environment).map(([key, value]) => {
                                  const isLinked = isLinkedVariable(service.name, key);
                                  return (
                                  <div key={key} className="space-y-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono tracking-wide text-slate-800">{key}</span>
                                        {isLinked && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Linked
                                          </span>
                                        )}
                                      </div>
                                      {!isLinked && !defaultsRef.current[service.name]?.envKeys.has(key) && (
                                        <button
                                          type="button"
                                          onClick={() => removeEnv(service.name, key)}
                                          className="text-xs text-red-500 hover:text-red-600"
                                          title="Remove variable"
                                          aria-label="Remove variable"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                    <div className="relative">
                                      <input
                                        type={key.toLowerCase().includes('password') && !showPasswords[`${service.name}_${key}`] ? 'password' : 'text'}
                                        value={value}
                                        onChange={(e) => updateEnv(service.name, key, e.target.value)}
                                        readOnly={isLinked}
                                        disabled={isLinked}
                                        className={`w-full h-11 rounded-lg border px-3 text-sm placeholder:text-slate-400 focus:outline-none ${
                                          key.toLowerCase().includes('password') && !isLinked ? 'pr-20' : 'pr-10'
                                        } ${
                                          isLinked 
                                            ? 'border-blue-200 bg-blue-50/50 text-blue-900 cursor-not-allowed' 
                                            : 'border-slate-200 bg-white text-slate-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40'
                                        }`}
                                        title={isLinked ? 'This value is automatically synced from another service' : ''}
                                      />
                                      {key.toLowerCase().includes('password') && !isLinked && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newPassword = generatePassword();
                                            updateEnv(service.name, key, newPassword);
                                            setShowPasswords(prev => ({
                                              ...prev,
                                              [`${service.name}_${key}`]: true
                                            }));
                                          }}
                                          className="absolute right-10 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800"
                                          title="Generate random password"
                                          aria-label="Generate random password"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                        </button>
                                      )}
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
                                  </div>
                                )})}
                              </div>
                            </div>
                          )}

                          {(() => {
                            const serviceOptional = service.optionalEnv || (service.name === app.id ? app.optionalEnv : undefined);
                            return serviceOptional && serviceOptional.length > 0;
                          })() && (
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-3">
                                  <span className="text-base font-semibold text-slate-900">Optional environment variables</span>
                                  <p className="text-sm text-slate-500">Only included when a value is provided.</p>
                                </div>
                                <div className="space-y-4">
                                  {(service.optionalEnv || (service.name === app.id ? app.optionalEnv : []) || []).map(opt => {
                                    const val = (optionalEnvValues[service.name] || optionalEnvValues[app.id] || {})[opt.key] ?? '';
                                    return (
                                      <div key={opt.key} className="space-y-1">
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-xs font-mono tracking-wide text-slate-800">{opt.key}</span>
                                          {opt.description && <span className="text-xs text-slate-500 text-right">{opt.description}</span>}
                                        </div>
                                        <input
                                          type={opt.key.toLowerCase().includes('password') ? 'password' : 'text'}
                                          value={val}
                                          onChange={(e) => setOptionalEnvValues(prev => ({
                                            ...prev,
                                            [service.name]: {
                                              ...(prev[service.name] || prev[app.id] || {}),
                                              [opt.key]: e.target.value
                                            }
                                          }))}
                                          className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                          placeholder={opt.defaultValue || 'Enter value'}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {hasImage && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">Port Mappings</span>
                                    <InfoIcon content="Map host ports to container ports to access services" />
                                  </div>
                                  <p className="text-sm text-slate-500">Expose container ports to the host</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                  <input
                                    type="checkbox"
                                    checked={config.portsEnabled}
                                    onChange={(e) => updateServiceConfig(service.name, { portsEnabled: e.target.checked })}
                                    className="peer sr-only"
                                  />
                                  <div className="h-7 w-14 rounded-full bg-slate-200 border border-slate-300 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-200 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
                                </label>
                              </div>
                              {config.portsEnabled && config.ports.length > 0 && (
                                <div className="mb-3 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => updateServiceConfig(service.name, { ports: [...config.ports, ''] })}
                                    className="text-sm font-semibold text-purple-700 hover:text-purple-900"
                                  >
                                    + Add
                                  </button>
                                </div>
                              )}
                              {config.portsEnabled && config.ports.length > 0 ? (
                                <div className="space-y-2">
                                  {config.ports.map((port, idx) => {
                                    const [hostPort, containerPort] = port.split(':');
                                    return (
                                      <div key={idx} className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-sm text-slate-700 mb-1">Host port</label>
                                          <div className="relative">
                                            <input
                                              type="text"
                                              value={hostPort || ''}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const newPorts = [...config.ports];
                                                newPorts[idx] = `${val}:${containerPort || '80'}`;
                                                updateServiceConfig(service.name, { ports: newPorts });
                                                
                                                setValidationErrors(prev => ({
                                                  ...prev,
                                                  [service.name]: {
                                                    ...prev[service.name],
                                                    [`port_${idx}_host`]: validatePort(val) ? '' : 'Invalid'
                                                  }
                                                }));
                                              }}
                                              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 
                                                ${validationErrors[service.name]?.[`port_${idx}_host`] 
                                                  ? 'border-red-300 focus:border-red-400 focus:ring-red-500/40' 
                                                  : 'border-slate-200 focus:border-purple-400 focus:ring-purple-500/40'
                                                }`}
                                              placeholder="8080"
                                            />
                                            {validationErrors[service.name]?.[`port_${idx}_host`] && (
                                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500">Invalid</span>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-sm text-slate-700 mb-1">Container port</label>
                                          <div className="flex gap-2">
                                            <div className="relative w-full">
                                              <input
                                                type="text"
                                                value={containerPort || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  const newPorts = [...config.ports];
                                                  newPorts[idx] = `${hostPort || '8080'}:${val}`;
                                                  updateServiceConfig(service.name, { ports: newPorts });

                                                  setValidationErrors(prev => ({
                                                    ...prev,
                                                    [service.name]: {
                                                      ...prev[service.name],
                                                      [`port_${idx}_container`]: validatePort(val) ? '' : 'Invalid'
                                                    }
                                                  }));
                                                }}
                                                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 
                                                  ${validationErrors[service.name]?.[`port_${idx}_container`] 
                                                    ? 'border-red-300 focus:border-red-400 focus:ring-red-500/40' 
                                                    : 'border-slate-200 focus:border-purple-400 focus:ring-purple-500/40'
                                                  }`}
                                                placeholder="80"
                                              />
                                              {validationErrors[service.name]?.[`port_${idx}_container`] && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500">Invalid</span>
                                              )}
                                            </div>
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
                              ) : config.portsEnabled ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                                  <svg className="mx-auto h-10 w-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm font-medium text-slate-700 mb-1">No ports configured</p>
                                  <p className="text-sm text-slate-500 mb-3">Click "+ Add" to expose a port from this container to your host</p>
                                  <button
                                    type="button"
                                    onClick={() => updateServiceConfig(service.name, { ports: [...config.ports, ''] })}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-purple-700 hover:text-purple-900"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Port
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">Port mappings are disabled for this service.</p>
                              )}
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

                          {hasImage && (
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
                          )}

                          {hasImage && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">Restart Policy</span>
                                    <InfoIcon content="Determine when the container should restart automatically" />
                                  </div>
                                  <p className="text-sm text-slate-500">Control container restart behavior</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                  <input
                                    type="checkbox"
                                    checked={config.restartPolicyEnabled}
                                    onChange={(e) => updateServiceConfig(service.name, { restartPolicyEnabled: e.target.checked })}
                                    className="peer sr-only"
                                  />
                                  <div className="h-7 w-14 rounded-full bg-slate-200 border border-slate-300 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-200 after:absolute after:start-[6px] after:top-[5px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
                                </label>
                              </div>
                              {config.restartPolicyEnabled ? (
                                <div className="space-y-1">
                                  <label className="block text-sm font-semibold text-slate-800">Policy</label>
                                  <select
                                    value={config.restartPolicy}
                                    onChange={(e) => updateServiceConfig(service.name, { restartPolicy: e.target.value })}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                  >
                                    <option value="no">no - Never restart</option>
                                    <option value="always">always - Always restart</option>
                                    <option value="on-failure">on-failure - Restart on failure</option>
                                    <option value="unless-stopped">unless-stopped - Always restart unless manually stopped</option>
                                  </select>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">Restart policy is disabled for this service.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3 flex-1">
                  {networkConfig.enabled && (
                    <button
                      onClick={() => setNetworkExpanded(!networkExpanded)}
                      className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                      aria-label={networkExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg className="w-5 h-5 text-slate-600 transition-transform" style={{ transform: networkExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">Network</h3>
                      <InfoIcon content="Define how your containers communicate with each other" />
                    </div>
                    {!networkExpanded && networkConfig.enabled && (
                      <p className="text-base text-slate-600">Control how services communicate with each other.</p>
                    )}
                  </div>
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

              {networkConfig.enabled && networkExpanded && (
                <div className="grid gap-4 px-5 py-5 md:grid-cols-2 bg-slate-50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="block text-base font-semibold text-slate-900">Network name</label>
                      <InfoIcon content="Name of the Docker network (e.g., my-app-net)" />
                    </div>
                    <input
                      type="text"
                      value={networkConfig.name}
                      onChange={(e) => setNetworkConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="app_network"
                    />

                    <div className="flex items-center gap-2">
                      <label className="block text-base font-semibold text-slate-900">Driver</label>
                      <InfoIcon content="Network driver to use (bridge is default for single host)" />
                    </div>
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
              <Card
                title={<Tag color="purple" style={{ marginRight: 0 }}>Docker Compose</Tag>}
                extra={
                  <Space>
                    <Button icon={<CloudDownloadOutlined />} onClick={downloadCompose}>
                      Download
                    </Button>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const text = generateDockerCompose();
                        if (text.trim().length > 0) {
                          navigator.clipboard.writeText(text).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          });
                        }
                      }}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </Space>
                }
              >
                <div className="relative max-h-[70vh] overflow-auto border border-slate-800 bg-slate-900 px-4 py-5 rounded-lg">
                  <pre className="whitespace-pre-wrap break-words text-sm font-mono leading-relaxed text-emerald-400 pr-10">
                    {generateDockerCompose()}
                  </pre>
                  {copied && (
                    <div className="absolute right-4 top-4 rounded-full bg-emerald-900/30 px-3 py-1 text-sm font-semibold text-emerald-400 border border-emerald-800/50 backdrop-blur-sm">
                      Copied
                    </div>
                  )}
                </div>
              </Card>
              <Card title="Tips">
                <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                  <li>Toggle services to include only what you need.</li>
                  <li>Network name is reused in both docker run and compose outputs.</li>
                  <li>Use the copy button to quickly grab the selected output.</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
