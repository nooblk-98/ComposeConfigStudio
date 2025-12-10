import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-2">Search</h3>
      <div className="relative">
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-card border border-border rounded-lg py-2 pl-9 pr-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-card-foreground"
        />
        <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}
