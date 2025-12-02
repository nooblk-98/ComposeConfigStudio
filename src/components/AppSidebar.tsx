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
    <div className="w-80 bg-white shadow-lg overflow-y-auto">
      <div className="p-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Apps</span>
          </button>
        )}
        {/* App Logo and Info */}
        <div className="mb-6">
          <div className="w-full h-32 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">{app.name}</div>
          </div>
          <h2 className="text-xl font-bold mb-2">
            {app.name} {app.version} — {app.description}
          </h2>
          <p className="text-sm text-gray-600">{app.description}</p>
        </div>

        {/* Version Badge */}
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded">
            Aug 08, 2025
          </span>
        </div>

        {/* Image Assembly Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Image assembly</h3>
          <div className="space-y-2">
            {app.tools.map((tool, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    {tool.name === 'Ansible' && '📦'}
                    {tool.name === 'Bash' && '💲'}
                    {tool.name === 'OpenSSH' && '🔑'}
                    {tool.name === 'Terraform' && '🔷'}
                    {tool.name === 'PowerShell' && '⚡'}
                  </div>
                  <span className="text-sm">{tool.name}</span>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{tool.version}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
