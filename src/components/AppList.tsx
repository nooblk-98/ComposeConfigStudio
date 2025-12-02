'use client';

import React, { useMemo, useState } from 'react';
import { AppDefinition } from '@/types/app';

interface AppListProps {
  apps: AppDefinition[];
  onSelectApp: (app: AppDefinition) => void | Promise<void>;
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 sticky top-6 h-fit shadow-sm">
            <div className="space-y-6">
              {/* Links */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Links</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Sponsors', 'Requests', 'Partners', 'Icons'].map((label) => (
                    <a key={label} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors rounded-lg px-3 py-2 flex items-center justify-between" href="#">
                      {label}
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">Powered by Docker Stack Generator</p>
              </div>

              {/* Search */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Search</h3>
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search apps..."
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                  <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Categories</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="category" checked={selectedCategory === 'all'} onChange={() => setSelectedCategory('all')} className="accent-purple-600" />
                    <span className="text-sm">All</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} className="accent-purple-600" />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Sort</h3>
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="default">Default</option>
                  <option value="name">Name</option>
                  <option value="version">Version</option>
                  <option value="port">Port</option>
                </select>
              </div>

              {/* Options */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Options</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} className="accent-purple-600" />
                  <span className="text-sm">Show Details</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <main className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Docker Apps</h1>
              <p className="text-sm text-gray-500 mt-1">{filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app)}
                  className="bg-white border border-gray-200 hover:border-purple-500 hover:shadow-md rounded-2xl p-6 text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      {app.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{app.name}</h3>
                      {showDetails && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{app.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {app.version && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">v{app.version}</span>}
                        {app.defaultPort && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-medium">Port {app.defaultPort}</span>}
                        {app.databases && app.databases.length > 0 && (
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-medium">{app.databases.length} DB options</span>
                        )}
                      </div>
                      {showDetails && app.tools && app.tools.length > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {app.tools.slice(0, 2).map(tool => tool.name).join(', ')}
                          {app.tools.length > 2 && ` +${app.tools.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end text-purple-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
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
