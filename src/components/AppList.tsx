'use client';

import React, { useMemo, useState } from 'react';
import { AppDefinition } from '@/types/app';
import AppCard from './common/AppCard';

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
      const words = q.split(/\s+/).filter(w => w);
      list = list.filter(a =>
        words.every(word =>
          a.name.toLowerCase().includes(word) ||
          a.description.toLowerCase().includes(word) ||
          a.tools.some(t => t.name.toLowerCase().includes(word))
        )
      );
    }
    // Sort
    if (query.trim()) {
      list = [...list].sort((a, b) => {
        const scoreA = getScore(a, query);
        const scoreB = getScore(b, query);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.name.localeCompare(b.name);
      });
    } else {
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
    }
    return list;
  }, [apps, selectedCategory, query, sortKey]);

  function getScore(app: AppDefinition, q: string) {
    let score = 0;
    const words = q.toLowerCase().split(/\s+/).filter(w => w);
    words.forEach(word => {
      if (app.name.toLowerCase().includes(word)) score += 10;
      if (app.description.toLowerCase().includes(word)) score += 5;
      app.tools.forEach(t => {
        if (t.name.toLowerCase().includes(word)) score += 1;
      });
    });
    return score;
  }

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Search</h3>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps..."
            className="w-full bg-card border border-border rounded-lg py-2 pl-9 pr-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-card-foreground"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="category" checked={selectedCategory === 'all'} onChange={() => setSelectedCategory('all')} className="accent-primary" />
            <span className="text-sm text-card-foreground">All</span>
          </label>
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} className="accent-primary" />
              <span className="text-sm text-card-foreground">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Sort</h3>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="w-full bg-card border border-border rounded-lg py-2 px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="default">Default</option>
          <option value="name">Name</option>
          <option value="version">Version</option>
          <option value="port">Port</option>
        </select>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Options</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} className="accent-primary" />
          <span className="text-sm text-card-foreground">Show Details</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* <div className="flex items-center justify-between mb-4 lg:hidden">
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
        </div> */}

        {/* {showFiltersMobile && (
          <div className="mb-4 lg:hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            {filterPanel}
          </div>
        )} */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* <aside className="lg:col-span-1">
            <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 sticky top-6 h-fit shadow-sm">
              {filterPanel}
            </div>
          </aside> */}

          <main className="lg:col-span-3 w-[1130px]">
            <div className="mb-6 hidden lg:block">
              <h1 className="text-3xl font-bold text-foreground">Docker Apps</h1>
              <p className="text-sm text-muted-foreground mt-1">{filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}</p>
            </div>
            <div className="mb-4 lg:hidden">
              <p className="text-sm text-muted-foreground">{filteredApps.length} results {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredApps.map(app => (
                <AppCard key={app.id} app={app} onSelectApp={onSelectApp} showDetails={showDetails} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
