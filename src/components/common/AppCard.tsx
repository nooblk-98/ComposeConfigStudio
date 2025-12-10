"use client";
import React from 'react';
import { AppDefinition } from '@/types/app';
import { AnimatePresence, motion } from "framer-motion";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import ReadMoreButton from '@/components/ui/ReadMoreButton';

interface AppCardProps {
  app: AppDefinition;
  onSelectApp: (app: AppDefinition) => void;
  showDetails: boolean;
}

export default function AppCard({ app, onSelectApp, showDetails }: AppCardProps) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative bg-card/10 backdrop-blur-lg border border-border hover:border-primary hover:shadow-2xl hover:backdrop-blur-sm focus:ring-2 focus:ring-ring focus:outline-none rounded-2xl p-8 sm:p-10 text-left transition-all duration-300 group shadow-md transform hover:-translate-y-1 overflow-hidden cursor-pointer min-h-[280px] z-30"
    >
      <div className="flex items-start gap-4 relative z-20">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent rounded-xl flex items-center justify-center text-primary text-xl font-bold flex-shrink-0 group-hover:scale-110 group-hover:ring-2 group-hover:ring-ring transition-all duration-300 overflow-hidden border border-border">
          {app.logo ? (
            app.logo.endsWith('.mp4') ? (
              <video
                src={app.logo}
                className="h-full w-full object-contain rounded-lg"
                autoPlay
                muted
                loop
                onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
              />
            ) : (
              <img
                src={app.logo}
                alt={app.name}
                className="h-full w-full object-contain rounded-lg"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )
          ) : (
            app.name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-card-foreground mb-1 truncate group-hover:text-primary transition-colors">{app.name}</h3>
          {/*  */}
          <div className="flex flex-wrap gap-2">
            {app.version && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium border border-border shadow-sm hover:bg-accent transition-colors">{app.version}</span>}
            {app.defaultPort && <span className="text-[10px] bg-accent text-primary px-2 py-1 rounded-full font-medium border border-border shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors">Port {app.defaultPort}</span>}
            {app.databases && app.databases.length > 0 && (
              <span className="text-[10px] bg-accent text-primary px-2 py-1 rounded-full font-medium border border-border shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors">{app.databases.length} DB options</span>
            )}
          </div>
          
          {showDetails && app.tools && app.tools.length > 0 && (
            <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {app.tools.slice(0, 2).map(tool => tool.name).join(', ')}
              {app.tools.length > 2 && ` +${app.tools.length - 2} more`}
            </div>
          )}
        </div>
      </div>
      {showDetails && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed mt-5 text-white">{app.description}</p>
          )}
      <div className=" relative z-20">
        <ReadMoreButton text="Configure" onClick={() => onSelectApp(app)} />
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute inset-0 pointer-events-none"
          >
            <CanvasRevealEffect
              animationSpeed={5}
              containerClassName="bg-transparent"
              colors={[
                [59, 130, 246],
                [139, 92, 246],
              ]}
              opacities={[0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.4, 1]}
              dotSize={2}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
