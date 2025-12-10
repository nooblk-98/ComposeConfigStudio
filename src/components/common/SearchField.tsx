import React from 'react'
import { appsList } from '../../data/index'
import CategorySelector from './CategorySelector'
import SearchInput from './SearchInput'

interface SearchFieldProps {
  query: string;
  setQuery: (query: string) => void;
  selectedCategory: string | 'all';
  setSelectedCategory: (category: string | 'all') => void;
  sortKey: 'default' | 'name' | 'version' | 'port';
  setSortKey: (sortKey: 'default' | 'name' | 'version' | 'port') => void;
  showDetails: boolean;
  setShowDetails: (showDetails: boolean) => void;
}

export default function SearchField({
  query,
  setQuery,
  selectedCategory,
  setSelectedCategory,
  sortKey,
  setSortKey,
  showDetails,
  setShowDetails
}: SearchFieldProps) {
  const categories = Array.from(new Set(appsList.map(app => app.category))).sort();

  return (
    <div className="space-y-6">
      <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps..." />

      <div>
        <CategorySelector
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
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
  )
}
