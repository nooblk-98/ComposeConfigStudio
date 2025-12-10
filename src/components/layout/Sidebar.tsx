"use client";
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';
import {
  Home,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import SearchField from '../common/SearchField';



function SidebarComponent() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortKey, setSortKey] = useState<'default' | 'name' | 'version' | 'port'>('default');
  const [showDetails, setShowDetails] = useState(true);
  const categories: string[] = []; // Empty for now, as no apps in sidebar

  return (
    <Sidebar open={true} animate={false}>
      <SidebarBody>
        <div className="flex flex-col flex-1 overflow-x-hidden h-full">
          <div className="flex flex-col gap-2 h-full">
            <SearchField
              query={query}
              setQuery={setQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortKey={sortKey}
              setSortKey={setSortKey}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
            />
            
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export default SidebarComponent;
