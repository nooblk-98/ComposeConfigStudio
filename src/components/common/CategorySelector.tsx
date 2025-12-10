import React from 'react'

interface CategorySelectorProps {
  selectedCategory: string | 'all';
  setSelectedCategory: (category: string | 'all') => void;
  categories: string[];
}

export default function CategorySelector({
  selectedCategory,
  setSelectedCategory,
  categories
}: CategorySelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-2">Categories</h3>
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="radio" name="category" value="all" checked={selectedCategory === 'all'} onChange={(e) => setSelectedCategory(e.target.value as 'all')} className="accent-primary" />
          <span className="text-sm text-card-foreground">All</span>
        </label>
        {categories.map(cat => (
          <label key={cat} className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="category" value={cat} checked={selectedCategory === cat} onChange={(e) => setSelectedCategory(e.target.value)} className="accent-primary" />
            <span className="text-sm text-card-foreground">{cat}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
