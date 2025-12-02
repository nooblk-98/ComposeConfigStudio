'use client';

import React, { useState, useEffect } from 'react';
import { AppDefinition, AppConfig } from '@/types/app';
import OutputPanel from './OutputPanel';
import AdvancedOptions from './AdvancedOptions';

interface ConfigPanelProps {
  app: AppDefinition;
}

export default function ConfigPanel({ app }: ConfigPanelProps) {
  const [config, setConfig] = useState<AppConfig>({
    name: app.name,
    version: app.version,
    port: app.defaultPort,
    env: {},
    volumes: {},
    database: app.databases[0],
    adminName: app.env.SEMAPHORE_ADMIN_NAME?.value || 'Admin',
    adminEmail: app.env.SEMAPHORE_ADMIN_EMAIL?.value || 'admin@localhost',
    adminPassword: app.env.SEMAPHORE_ADMIN_PASSWORD?.value || 'changeme',
    adminLogin: app.env.SEMAPHORE_ADMIN?.value || 'admin',
    enableRunner: false,
    customEnv: [],
    customPorts: [],
    customVolumes: [],
    labels: [],
    networks: [],
    restartPolicy: 'unless-stopped',
  });

  // Initialize config from app definition
  useEffect(() => {
    const initialEnv: Record<string, string> = {};
    Object.entries(app.env).forEach(([key, envVar]) => {
      initialEnv[key] = envVar.value;
    });

    const initialVolumes: Record<string, boolean> = {};
    Object.keys(app.volumes).forEach(key => {
      initialVolumes[key] = true;
    });

    // Extract admin fields from env if they exist
    const adminLogin = app.env.SEMAPHORE_ADMIN?.value || app.env.NEXTCLOUD_ADMIN_USER?.value || app.env.WORDPRESS_DB_USER?.value || app.env.GF_SECURITY_ADMIN_USER?.value || 'admin';
    const adminName = app.env.SEMAPHORE_ADMIN_NAME?.value || 'Admin';
    const adminEmail = app.env.SEMAPHORE_ADMIN_EMAIL?.value || app.env.NEXTCLOUD_ADMIN_EMAIL?.value || 'admin@localhost';
    const adminPassword = app.env.SEMAPHORE_ADMIN_PASSWORD?.value || app.env.NEXTCLOUD_ADMIN_PASSWORD?.value || app.env.WORDPRESS_DB_PASSWORD?.value || app.env.GF_SECURITY_ADMIN_PASSWORD?.value || 'changeme';

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
    setConfig(prev => ({
      ...prev,
      database: db,
      env: {
        ...prev.env,
        SEMAPHORE_DB_DIALECT: db === 'sqlite' ? 'sqlite3' : db
      }
    }));
  };

  // Sync admin fields to env based on app
  useEffect(() => {
    const updatedEnv = { ...config.env };
    
    // Map admin fields to appropriate env vars for each app
    if (app.env.SEMAPHORE_ADMIN) {
      updatedEnv.SEMAPHORE_ADMIN = config.adminLogin;
      updatedEnv.SEMAPHORE_ADMIN_NAME = config.adminName;
      updatedEnv.SEMAPHORE_ADMIN_EMAIL = config.adminEmail;
      updatedEnv.SEMAPHORE_ADMIN_PASSWORD = config.adminPassword;
    }
    if (app.env.NEXTCLOUD_ADMIN_USER) {
      updatedEnv.NEXTCLOUD_ADMIN_USER = config.adminLogin;
      updatedEnv.NEXTCLOUD_ADMIN_PASSWORD = config.adminPassword;
    }
    if (app.env.WORDPRESS_DB_USER) {
      updatedEnv.WORDPRESS_DB_USER = config.adminLogin;
      updatedEnv.WORDPRESS_DB_PASSWORD = config.adminPassword;
    }
    if (app.env.GF_SECURITY_ADMIN_USER) {
      updatedEnv.GF_SECURITY_ADMIN_USER = config.adminLogin;
      updatedEnv.GF_SECURITY_ADMIN_PASSWORD = config.adminPassword;
    }
    
    setConfig(prev => ({ ...prev, env: updatedEnv }));
  }, [config.adminLogin, config.adminName, config.adminEmail, config.adminPassword, app.env]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Configuration Form */}
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Docker Stack Generator</h1>

        {/* Container Settings */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Container settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => updateConfig({ port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Docker Volumes */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Docker volumes</h2>
          <div className="space-y-3">
            {Object.entries(app.volumes).map(([key, volume]) => (
              <div key={key} className="flex items-start">
                <input
                  type="checkbox"
                  id={`volume-${key}`}
                  checked={config.volumes[key] || false}
                  onChange={(e) => updateVolume(key, e.target.checked)}
                  className="mt-1 mr-3 w-4 h-4"
                />
                <div className="flex-1">
                  <label htmlFor={`volume-${key}`} className="font-medium cursor-pointer">
                    {key.charAt(0).toUpperCase() + key.slice(1)} volume
                  </label>
                  <div className="text-sm text-gray-600">{volume.path}</div>
                  <div className="text-xs text-gray-500">{volume.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Database Settings - Only show if app supports databases */}
        {app.databases.length > 0 && (
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Database settings</h2>
            <div className="flex flex-wrap gap-3">
              {app.databases.map((db) => (
                <button
                  key={db}
                  onClick={() => updateDatabase(db)}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    config.database === db
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {db.charAt(0).toUpperCase() + db.slice(1)}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Admin User - Only show if app has admin-related env vars */}
        {(app.env.SEMAPHORE_ADMIN || app.env.NEXTCLOUD_ADMIN_USER || app.env.WORDPRESS_DB_USER || app.env.GF_SECURITY_ADMIN_USER) && (
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Admin user</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login
                </label>
                <input
                  type="text"
                  value={config.adminLogin}
                  onChange={(e) => updateConfig({ adminLogin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {app.env.SEMAPHORE_ADMIN_NAME && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={config.adminName}
                    onChange={(e) => updateConfig({ adminName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={config.adminPassword}
                  onChange={(e) => updateConfig({ adminPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(app.env.SEMAPHORE_ADMIN_EMAIL || app.env.NEXTCLOUD_ADMIN_EMAIL) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.adminEmail}
                    onChange={(e) => updateConfig({ adminEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Runner */}
        {app.features.runner && (
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Runner</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable-runner"
                checked={config.enableRunner}
                onChange={(e) => updateConfig({ enableRunner: e.target.checked })}
                className="mr-3 w-4 h-4"
              />
              <label htmlFor="enable-runner" className="cursor-pointer">
                Enable runners
              </label>
            </div>
          </section>
        )}
        {/* Advanced Options */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center justify-between">
              <span className="text-xl font-semibold">Advanced options</span>
              <span className="text-sm text-blue-600 group-open:hidden">Expand</span>
              <span className="text-sm text-blue-600 hidden group-open:inline">Collapse</span>
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
