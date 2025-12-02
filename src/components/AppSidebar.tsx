'use client';

import React from 'react';
import Image from 'next/image';
import { AppDefinition } from '@/types/app';

interface AppSidebarProps {
  app: AppDefinition;
  onBack?: () => void;
}

export default function AppSidebar({ app, onBack }: AppSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="font-bold text-sm">Back to Apps</span>
          </button>
        )}
        {/* App Logo and Info */}
        <div className="mb-8">
          <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-6 flex items-center justify-center shadow-sm">
            <div className="text-white text-4xl font-bold">{app.name.charAt(0)}</div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 tracking-tight">
            {app.name}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">{app.description}</p>
        </div>

        {/* Version Badge */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
               {app.version}
             </span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
               Port {app.defaultPort}
             </span>
          </div>
        </div>

        {/* Image Assembly Section */}
        {app.tools && app.tools.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Stack Components</h3>
            <div className="space-y-3">
              {app.tools.map((tool, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm">
                      {tool.name === 'Ansible' && '📦'}
                      {tool.name === 'Bash' && '💲'}
                      {tool.name === 'OpenSSH' && '🔑'}
                      {tool.name === 'Terraform' && '🔷'}
                      {tool.name === 'PowerShell' && '⚡'}
                      {!['Ansible', 'Bash', 'OpenSSH', 'Terraform', 'PowerShell'].includes(tool.name) && '🔧'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{tool.version}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
