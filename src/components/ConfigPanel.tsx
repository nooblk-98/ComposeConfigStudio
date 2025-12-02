'use client';

import React, { useState, useEffect } from 'react';
import { AppDefinition, AppConfig } from '@/types/app';
import OutputPanel from './OutputPanel';
import AdvancedOptions from './AdvancedOptions';
import ToggleSwitch from './ToggleSwitch';

interface ConfigPanelProps {
  app: AppDefinition;
}

export default function ConfigPanel({ app }: ConfigPanelProps) {
  const [config, setConfig] = useState<AppConfig>({
    name: app.name,
    version: app.version,
    port: app.defaultPort,
    env: {},
    optionalEnv: {},
    volumes: {},
    volumeOverrides: {},
    database: app.databases?.[0] || 'mysql',
    dbVersion: '8.0', // Default MySQL version
    dbImage: 'mysql:8.0',
    adminName: app.env?.SEMAPHORE_ADMIN_NAME?.value || 'Admin',
    adminEmail: app.env?.SEMAPHORE_ADMIN_EMAIL?.value || 'admin@localhost',
    adminPassword: app.env?.SEMAPHORE_ADMIN_PASSWORD?.value || 'changeme',
    adminLogin: app.env?.SEMAPHORE_ADMIN?.value || 'admin',
    enableRunner: false,
    customEnv: [],
    customPorts: [],
    customVolumes: [],
    labels: [],
    networks: [],
    restartPolicy: 'unless-stopped',
    useExternalDb: true,
    externalDbConfig: {
      host: 'db',
      port: '3306',
      user: 'user',
      password: 'password',
      name: 'db_name'
    },
    attachedServices: [],
    attachedServiceConfigs: {},
  });

  // Initialize config from app definition
  useEffect(() => {
    const initialEnv: Record<string, string> = {};
    if (app.env) {
      Object.entries(app.env).forEach(([key, envVar]) => {
        initialEnv[key] = envVar.value;
      });
    }

    const initialVolumes: Record<string, boolean> = {};
    if (app.volumes) {
      Object.keys(app.volumes).forEach(key => {
        initialVolumes[key] = true;
      });
    }

    // Extract admin fields from env if they exist
    const adminLogin = app.env?.SEMAPHORE_ADMIN?.value || app.env?.NEXTCLOUD_ADMIN_USER?.value || app.env?.WORDPRESS_DB_USER?.value || app.env?.GF_SECURITY_ADMIN_USER?.value || 'admin';
    const adminName = app.env?.SEMAPHORE_ADMIN_NAME?.value || 'Admin';
    const adminEmail = app.env?.SEMAPHORE_ADMIN_EMAIL?.value || app.env?.NEXTCLOUD_ADMIN_EMAIL?.value || 'admin@localhost';
    const adminPassword = app.env?.SEMAPHORE_ADMIN_PASSWORD?.value || app.env?.NEXTCLOUD_ADMIN_PASSWORD?.value || app.env?.WORDPRESS_DB_PASSWORD?.value || app.env?.GF_SECURITY_ADMIN_PASSWORD?.value || 'changeme';

    setConfig(prev => ({
      ...prev,
      env: initialEnv,
      volumes: initialVolumes,
      adminLogin,
      adminName,
      adminEmail,
      adminPassword,
    }));
  }, [app]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateEnv = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      env: { ...prev.env, [key]: value }
    }));
  };

  const updateVolume = (key: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      volumes: { ...prev.volumes, [key]: enabled }
    }));
  };

  const updateDatabase = (db: string) => {
    // Set default version based on database type
    const defaultVersion = db === 'postgres' ? '16' : '8.0';
    const dbImage = db === 'postgres' ? `postgres:${defaultVersion}` : `mysql:${defaultVersion}`;
    
    setConfig(prev => ({
      ...prev,
      database: db,
      dbVersion: defaultVersion,
      dbImage: dbImage,
      env: {
        ...prev.env,
        SEMAPHORE_DB_DIALECT: db === 'sqlite' ? 'sqlite3' : db
      }
    }));
  };

  // Sync admin fields to env based on app
  useEffect(() => {
    if (!app.env) return;
    
    const updatedEnv = { ...config.env };
    
    // Map admin fields to appropriate env vars for each app
    if (app.env?.SEMAPHORE_ADMIN) {
      updatedEnv.SEMAPHORE_ADMIN = config.adminLogin;
      updatedEnv.SEMAPHORE_ADMIN_NAME = config.adminName;
      updatedEnv.SEMAPHORE_ADMIN_EMAIL = config.adminEmail;
      updatedEnv.SEMAPHORE_ADMIN_PASSWORD = config.adminPassword;
    }
    if (app.env?.NEXTCLOUD_ADMIN_USER) {
      updatedEnv.NEXTCLOUD_ADMIN_USER = config.adminLogin;
      updatedEnv.NEXTCLOUD_ADMIN_PASSWORD = config.adminPassword;
    }
    if (app.env?.WORDPRESS_DB_USER) {
      updatedEnv.WORDPRESS_DB_USER = config.adminLogin;
      updatedEnv.WORDPRESS_DB_PASSWORD = config.adminPassword;
    }
    if (app.env?.GF_SECURITY_ADMIN_USER) {
      updatedEnv.GF_SECURITY_ADMIN_USER = config.adminLogin;
      updatedEnv.GF_SECURITY_ADMIN_PASSWORD = config.adminPassword;
    }
    
    setConfig(prev => ({ ...prev, env: updatedEnv }));
  }, [config.adminLogin, config.adminName, config.adminEmail, config.adminPassword, app.env]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Configuration Form */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin bg-gray-50">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 tracking-tight">Docker Stack Generator</h1>

        {/* Main Application Settings - Consolidated WordPress Container Configuration */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">{app.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{app.name} Container</h2>
              <p className="text-sm text-gray-500">Configure main application container settings</p>
            </div>
          </div>

          {/* Container Basic Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span>⚙️</span> Container Configuration
            </h3>
            <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Container Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Unique name for the Docker container</p>
              </div>
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateConfig({ port: val });
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">External port to access the application</p>
              </div>
            </div>
          </div>

          {/* Docker Volumes */}
          {app.volumes && Object.keys(app.volumes).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <span>💾</span> Docker Volumes
              </h3>
              <div className="space-y-3">
                {Object.entries(app.volumes).map(([key, volume]) => (
                <div key={key} className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <label className="relative inline-flex items-center cursor-pointer mr-3 mt-1">
                  <input
                    type="checkbox"
                    id={`volume-${key}`}
                    checked={config.volumes[key] || false}
                    onChange={(e) => updateVolume(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
                <div className="flex-1">
                  <label htmlFor={`volume-${key}`} className="font-medium cursor-pointer text-gray-900">
                    {key.charAt(0).toUpperCase() + key.slice(1)} volume
                  </label>
                  <div className="text-sm text-gray-500 font-mono mt-0.5">{volume.path}</div>
                  <div className="text-xs text-gray-500 mt-1">{volume.description}</div>
                  {config.volumes[key] && (
                    <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Host path (optional)</label>
                        <input
                          type="text"
                          placeholder={`e.g. ./data/${key}`}
                          value={config.volumeOverrides?.[key]?.hostPath || ''}
                          onChange={(e) => {
                            const hostPath = e.target.value;
                            updateConfig({
                              volumeOverrides: {
                                ...config.volumeOverrides,
                                [key]: {
                                  hostPath,
                                  containerPath: config.volumeOverrides?.[key]?.containerPath || volume.path
                                }
                              }
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Container path</label>
                        <input
                          type="text"
                          value={config.volumeOverrides?.[key]?.containerPath || volume.path}
                          onChange={(e) => {
                            const containerPath = e.target.value;
                            updateConfig({
                              volumeOverrides: {
                                ...config.volumeOverrides,
                                [key]: {
                                  hostPath: config.volumeOverrides?.[key]?.hostPath || '',
                                  containerPath
                                }
                              }
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
              </div>
            </div>
          )}

          {/* Environment Variables */}
          {app.env && Object.keys(app.env).length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <span>🔧</span> Environment Variables
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Admin fields if applicable */}
                {(app.env?.SEMAPHORE_ADMIN || app.env?.NEXTCLOUD_ADMIN_USER || app.env?.WORDPRESS_DB_USER || app.env?.GF_SECURITY_ADMIN_USER) && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Admin Login
                      </label>
                      <input
                        type="text"
                        value={config.adminLogin}
                        onChange={(e) => updateConfig({ adminLogin: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Admin username</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Admin Password
                      </label>
                      <input
                        type="password"
                        value={config.adminPassword}
                        onChange={(e) => updateConfig({ adminPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Admin password</p>
                    </div>
                    {app.env?.SEMAPHORE_ADMIN_NAME && (
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Admin Name
                        </label>
                        <input
                          type="text"
                          value={config.adminName}
                          onChange={(e) => updateConfig({ adminName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">Admin display name</p>
                      </div>
                    )}
                    {(app.env?.SEMAPHORE_ADMIN_EMAIL || app.env?.NEXTCLOUD_ADMIN_EMAIL) && (
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          value={config.adminEmail}
                          onChange={(e) => updateConfig({ adminEmail: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">Admin email address</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Other environment variables */}
                {app.env && Object.entries(app.env).map(([key, envVar]) => {
                  const isPassword = key.toLowerCase().includes('password') || key.toLowerCase().includes('secret');
                  
                  return (
                    <div key={key}>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        {envVar.key}
                      </label>
                      <input
                        type={isPassword ? 'password' : 'text'}
                        value={config.env[key] || envVar.value}
                        onChange={(e) => updateEnv(key, e.target.value)}
                        placeholder={envVar.description}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">{envVar.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>


        {/* Database Settings */}
        {(app.databases && app.databases.length > 0 || app.needs_db) && (
          <section className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6 transition-all hover:shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Database settings</h2>
            
            {/* DB Type Tabs */}
            {app.databases && app.databases.length > 0 && (
              <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden w-fit">
                {app.databases.map((db) => (
                  <button
                    key={db}
                    onClick={() => updateDatabase(db)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      config.database === db
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-l first:border-l-0 border-gray-200'
                    }`}
                  >
                    {db === 'sqlite' ? 'SQLite' : db === 'boltdb' ? 'BoltDB' : db.charAt(0).toUpperCase() + db.slice(1)}
                  </button>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-600 mb-6">
              Configure database connection settings in the <strong>WordPress Container</strong> section above. 
              Toggle below to add an internal database container.
            </p>

            {/* Add Database Container Toggle */}
            {app.supports_external_db && (
              <div>
                <div className="flex items-center mb-4">
                  <ToggleSwitch
                    id="add-db-container"
                    checked={!config.useExternalDb}
                    onChange={(checked) => updateConfig({ useExternalDb: !checked })}
                    label={
                      <>
                        Add <span className="bg-purple-600 text-white px-1 py-0.5 rounded text-sm">database</span> container
                      </> as any
                    }
                  />
                  <div className="flex-1 border-b border-dashed border-gray-300 ml-4 relative top-1"></div>
                </div>

                {/* Conditional Inputs for Internal DB */}
                {!config.useExternalDb && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Database Version Selector */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        {config.database === 'postgres' ? 'PostgreSQL' : 'MySQL'} Version
                      </label>
                      <select
                        value={config.dbVersion || '8.0'}
                        onChange={(e) => {
                          const version = e.target.value;
                          const dbType = config.database === 'postgres' ? 'postgres' : 'mysql';
                          updateConfig({ 
                            dbVersion: version,
                            dbImage: `${dbType}:${version}`
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900"
                      >
                        {config.database === 'postgres' ? (
                          <>
                            <option value="16">PostgreSQL 16 (Latest)</option>
                            <option value="15">PostgreSQL 15</option>
                            <option value="14">PostgreSQL 14</option>
                            <option value="13">PostgreSQL 13</option>
                            <option value="12">PostgreSQL 12</option>
                          </>
                        ) : (
                          <>
                            <option value="8.0">MySQL 8.0 (Latest)</option>
                            <option value="5.7">MySQL 5.7</option>
                            <option value="5.6">MySQL 5.6</option>
                            <option value="8.4">MySQL 8.4 (Innovation)</option>
                          </>
                        )}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select the database version for the internal container
                      </p>
                    </div>

                    {/* Volume and Network Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <input type="checkbox" checked readOnly className="w-4 h-4 rounded border-gray-300 text-gray-400 mr-2" />
                          <label className="text-sm text-gray-700">
                            {config.database === 'postgres' ? 'Postgres' : 'MySQL'} data volume <span className="text-red-500 bg-red-50 px-1 rounded font-mono text-xs">/var/lib/{config.database === 'postgres' ? 'postgresql/data' : 'mysql'}</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 ml-6 mb-2">Contains {config.database === 'postgres' ? 'Postgres' : 'MySQL'} data files.</p>
                        <input
                          type="text"
                          value={`${config.name.toLowerCase().replace(/\s+/g, '-')}_${config.database === 'postgres' ? 'postgres' : 'mysql'}`}
                          readOnly
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Network</label>
                        <input
                          type="text"
                          value={`${config.name.toLowerCase().replace(/\s+/g, '-')}_network`}
                          readOnly
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Network name to connect {app.name} with</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Attachable Services / Add-ons */}
        {app.attachable_services && app.attachable_services.length > 0 && (
          <section className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6 transition-all hover:shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              Add-ons
            </h2>
            <div className="space-y-4">
              {app.attachable_services.map((service) => {
                const isAttached = config.attachedServices.includes(service.id);
                const serviceConfig = config.attachedServiceConfigs?.[service.id] || {};
                
                return (
                  <div key={service.id} className={`p-4 rounded-xl border transition-all ${isAttached ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start">
                      <label className="relative inline-flex items-center cursor-pointer mr-3 mt-1">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={isAttached}
                          onChange={(e) => {
                            const newServices = e.target.checked
                              ? [...config.attachedServices, service.id]
                              : config.attachedServices.filter(id => id !== service.id);
                            updateConfig({ attachedServices: newServices });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                      <div className="flex-1">
                        <label htmlFor={`service-${service.id}`} className="font-bold cursor-pointer text-gray-900 block text-base">
                          {service.name}
                        </label>
                        <div className="text-sm text-gray-500 mt-0.5 mb-3">{service.description}</div>
                        
                        {isAttached && (
                          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1">
                             {/* Port Configuration */}
                             {service.defaultPort && (
                               <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">Port</label>
                                 <input
                                   type="number"
                                   placeholder={service.defaultPort.toString()}
                                   value={serviceConfig.port || ''}
                                   onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      updateConfig({
                                        attachedServiceConfigs: {
                                          ...config.attachedServiceConfigs,
                                          [service.id]: {
                                            ...serviceConfig,
                                            port: isNaN(val) ? undefined : val
                                          }
                                        }
                                      });
                                   }}
                                   className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-gray-900 placeholder-gray-400"
                                 />
                               </div>
                             )}
                             
                             {/* Env Vars Configuration */}
                             {service.env && Object.keys(service.env).length > 0 && (
                               <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">Environment Variables</label>
                                 <div className="space-y-3">
                                   {Object.entries(service.env).map(([key, defaultVal]) => (
                                     <div key={key} className="grid grid-cols-12 gap-4 items-center">
                                       <span className="col-span-4 text-sm text-gray-600 font-medium truncate" title={key}>{key}</span>
                                       <div className="col-span-8">
                                         <input
                                           type="text"
                                           placeholder={defaultVal}
                                           value={serviceConfig.env?.[key] || ''}
                                           onChange={(e) => {
                                              updateConfig({
                                                attachedServiceConfigs: {
                                                  ...config.attachedServiceConfigs,
                                                  [service.id]: {
                                                    ...serviceConfig,
                                                    env: {
                                                      ...serviceConfig.env,
                                                      [key]: e.target.value
                                                    }
                                                  }
                                                }
                                              });
                                           }}
                                           className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-gray-900 placeholder-gray-400"
                                         />
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}



        {/* Runner */}
        {app.features.runner && (
          <section className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6 transition-all hover:shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Runner</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable-runner"
                checked={config.enableRunner}
                onChange={(e) => updateConfig({ enableRunner: e.target.checked })}
                className="mr-3 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="enable-runner" className="cursor-pointer font-medium text-gray-900">
                Enable runners
              </label>
            </div>
          </section>
        )}

        {/* Optional Environment Variables */}
        {app.optionalEnv && app.optionalEnv.length > 0 && (
          <section className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6 transition-all hover:shadow-md">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Optional Configuration</h2>
            <p className="text-sm text-gray-600 mb-6">
              Enable and configure optional environment variables for additional functionality
            </p>
            
            {/* Group by category */}
            {(() => {
              // Group optional env vars by category
              const grouped = app.optionalEnv.reduce((acc, envVar) => {
                const category = envVar.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(envVar);
                return acc;
              }, {} as Record<string, typeof app.optionalEnv>);

              // Define category colors and icons
              const categoryStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
                'Database': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🗄️' },
                'Main App': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '⚙️' },
                'Development': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🔧' },
                'Advanced': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', icon: '⚡' },
                'Security': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔒' },
                'Performance': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '🚀' },
                'Other': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: '📝' }
              };

              return Object.entries(grouped).map(([category, envVars]) => {
                const style = categoryStyles[category] || categoryStyles['Other'];
                
                return (
                  <div key={category} className="mb-6 last:mb-0">
                    {/* Category Header */}
                    <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${style.border}`}>
                      <span className="text-lg">{style.icon}</span>
                      <h3 className={`text-sm font-bold uppercase tracking-wide ${style.text}`}>
                        {category}
                      </h3>
                      <span className={`text-xs ${style.text} opacity-60`}>
                        ({envVars.length} {envVars.length === 1 ? 'variable' : 'variables'})
                      </span>
                    </div>

                    {/* Environment Variables in this category */}
                    <div className="space-y-3">
                      {envVars.map((envVar) => {
                        const isEnabled = config.optionalEnv && config.optionalEnv[envVar.key] !== undefined;
                        return (
                          <div 
                            key={envVar.key} 
                            className={`border rounded-lg p-4 transition-all ${
                              isEnabled 
                                ? `${style.bg} ${style.border} shadow-sm` 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id={`optional-${envVar.key}`}
                                checked={isEnabled}
                                onChange={(e) => {
                                  const newOptionalEnv = { ...config.optionalEnv };
                                  if (e.target.checked) {
                                    newOptionalEnv[envVar.key] = envVar.defaultValue;
                                  } else {
                                    delete newOptionalEnv[envVar.key];
                                  }
                                  updateConfig({ optionalEnv: newOptionalEnv });
                                }}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <label 
                                    htmlFor={`optional-${envVar.key}`} 
                                    className="font-bold text-gray-900 cursor-pointer text-sm font-mono"
                                  >
                                    {envVar.key}
                                  </label>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${style.bg} ${style.text} ${style.border} border`}>
                                    {category}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">{envVar.description}</p>
                                {isEnabled && (
                                  <input
                                    type="text"
                                    value={config.optionalEnv?.[envVar.key] || ''}
                                    onChange={(e) => {
                                      updateConfig({
                                        optionalEnv: {
                                          ...config.optionalEnv,
                                          [envVar.key]: e.target.value
                                        }
                                      });
                                    }}
                                    placeholder={`Default: ${envVar.defaultValue}`}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-900 placeholder-gray-400"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </section>
        )}

        {/* Advanced Options */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6 transition-all hover:shadow-md">
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">Advanced options</span>
              <span className="text-sm text-purple-600 font-medium group-open:hidden">Expand</span>
              <span className="text-sm text-purple-600 font-medium hidden group-open:inline">Collapse</span>
            </summary>
            <div className="mt-6">
              <AdvancedOptions config={config} updateConfig={updateConfig} />
            </div>
          </details>
        </section>
      </div>

      {/* Output Panel */}
      <OutputPanel app={app} config={config} updateConfig={updateConfig} />
    </div>
  );
}
