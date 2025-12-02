'use client';

import React, { useMemo, useState } from 'react';
import { AppDefinition } from '@/types/app';

interface AppListProps {
  apps: AppDefinition[];
  onSelectApp: (app: AppDefinition) => void;
}

export default function AppList({ apps, onSelectApp }: AppListProps) {
  const categories = useMemo(() => Array.from(new Set(apps.map(app => app.category))), [apps]);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortKey, setSortKey] = useState<'default' | 'name' | 'version' | 'port'>('default');
  const [showDetails, setShowDetails] = useState(true);

  const filteredApps = useMemo(() => {
    let list = apps;
    if (selectedCategory !== 'all') {
      list = list.filter(a => a.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tools.some(t => t.name.toLowerCase().includes(q))
      );
    }
    switch (sortKey) {
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'version':
        list = [...list].sort((a, b) => (a.version || '').localeCompare(b.version || ''));
        break;
      case 'port':
        list = [...list].sort((a, b) => (a.defaultPort || 0) - (b.defaultPort || 0));
        break;
      default:
        // keep original order
        break;
    }
    return list;
  }, [apps, selectedCategory, query, sortKey]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Automation': '🤖',
      'Management': '⚙️',
      'Productivity': '📁',
      'CMS': '📝',
      'Networking': '🌐',
      'Monitoring': '📊',
      'Media': '🎬',
      'Database': '💾',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 bg-gray-900/70 border border-gray-800 rounded-2xl p-5 sticky top-6 h-fit">
            <div className="space-y-6">
              {/* Links */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Links</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Sponsors', 'Requests', 'Partners', 'Icons'].map((label) => (
                    <a key={label} className="text-xs bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg px-3 py-2 flex items-center justify-between" href="#">
                      {label}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">Powered by Docker Stack Generator</p>
              </div>

              {/* Search */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Search</h3>
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search apps..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Categories</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="category" checked={selectedCategory === 'all'} onChange={() => setSelectedCategory('all')} className="accent-blue-600" />
                    <span className="text-sm">All</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} className="accent-blue-600" />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Sort</h3>
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm">
                  <option value="default">Default</option>
                  <option value="name">Name</option>
                  <option value="version">Version</option>
                  <option value="port">Port</option>
                </select>
              </div>

              {/* Options */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Options</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} className="accent-blue-600" />
                  <span className="text-sm">Show Details</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <main className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Docker Apps</h1>
              <p className="text-sm text-gray-400 mt-1">{filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app)}
                  className="bg-gray-900/60 border border-gray-800 hover:border-blue-600 rounded-2xl p-6 text-left transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                      {app.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold mb-1 truncate">{app.name}</h3>
                      {showDetails && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{app.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded">v{app.version}</span>
                        <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-1 rounded">Port {app.defaultPort}</span>
                        {app.databases.length > 0 && (
                          <span className="text-[10px] bg-green-900/40 text-green-300 px-2 py-1 rounded">{app.databases.length} DB options</span>
                        )}
                      </div>
                      {showDetails && (
                        <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {app.tools.slice(0, 2).map(tool => tool.name).join(', ')}
                          {app.tools.length > 2 && ` +${app.tools.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end text-blue-400 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Configure
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
