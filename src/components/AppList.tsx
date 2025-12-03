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
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

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
        break;
    }
    return list;
  }, [apps, selectedCategory, query, sortKey]);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Search</h3>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="category" checked={selectedCategory === 'all'} onChange={() => setSelectedCategory('all')} className="accent-purple-500" />
            <span className="text-sm text-slate-800">All</span>
          </label>
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} className="accent-purple-500" />
              <span className="text-sm text-slate-800">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Sort</h3>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30">
          <option value="default">Default</option>
          <option value="name">Name</option>
          <option value="version">Version</option>
          <option value="port">Port</option>
        </select>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Options</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} className="accent-purple-500" />
          <span className="text-sm text-slate-800">Show Details</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h1 className="text-2xl font-bold text-slate-900">Docker Apps</h1>
          <button
            onClick={() => setShowFiltersMobile(prev => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
          >
            Filters
            <svg
              className={`h-4 w-4 transition-transform ${showFiltersMobile ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showFiltersMobile && (
          <div className="mb-4 lg:hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            {filterPanel}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          <aside className="lg:col-span-1">
            <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 sticky top-6 h-fit shadow-sm">
              {filterPanel}
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="mb-6 hidden lg:block">
              <h1 className="text-3xl font-bold text-slate-900">Docker Apps</h1>
              <p className="text-sm text-slate-600 mt-1">{filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}</p>
            </div>
            <div className="mb-4 lg:hidden">
              <p className="text-sm text-slate-600">{filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app)}
                  className="bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg rounded-2xl p-5 sm:p-6 text-left transition-all group shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-slate-900 text-xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                      {app.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={app.logo}
                          alt={app.name}
                          className="h-full w-full object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        app.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 mb-1 truncate">{app.name}</h3>
                      {showDetails && (
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{app.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {app.version && <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-1 rounded font-medium border border-slate-200">{app.version}</span>}
                        {app.defaultPort && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium border border-purple-200">Port {app.defaultPort}</span>}
                        {app.databases && app.databases.length > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-medium border border-emerald-200">{app.databases.length} DB options</span>
                        )}
                      </div>
                      {showDetails && app.tools && app.tools.length > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
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
