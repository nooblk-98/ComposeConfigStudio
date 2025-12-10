import React from 'react';

interface SidebarProps {
  open: boolean;
  animate: boolean;
  children: React.ReactNode;
}

export function Sidebar({ open, animate, children }: SidebarProps) {
  return (
    <div className={`bg-sidebar border-sidebar-border ${open ? 'w-64' : 'w-0'} transition-all ${animate ? 'duration-300' : ''} hidden md:block`}>
      {children}
    </div>
  );
}

interface SidebarBodyProps {
  children: React.ReactNode;
}

export function SidebarBody({ children }: SidebarBodyProps) {
  return (
    <div className="p-4">
      {children}
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SidebarLink({ href, children }: SidebarLinkProps) {
  return (
    <a href={href} className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent rounded">
      {children}
    </a>
  );
}
