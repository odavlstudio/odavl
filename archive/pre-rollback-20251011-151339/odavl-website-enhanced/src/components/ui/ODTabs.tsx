'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ODTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[]
  defaultTab?: string
  className?: string
}

export function ODTabs({ tabs, defaultTab, className }: Readonly<ODTabsProps>) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id)
  
  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === tabId);
    let nextIndex: number;
    
    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        event.preventDefault();
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        event.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        event.preventDefault();
        break;
      default:
        return;
    }
    
    setActiveTab(tabs[nextIndex].id);
    // Focus the new tab
    const nextButton = event.currentTarget.parentElement?.children[nextIndex] as HTMLButtonElement;
    nextButton?.focus();
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex space-x-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Content sections">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              activeTab === tab.id && "text-foreground"
            )} 
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            role="tab" 
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {activeTab === tab.id && (
              <motion.span 
                layoutId="bubble" 
                className="absolute inset-0 z-10 bg-background mix-blend-difference rounded-lg" 
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} 
              />
            )}
            <span className="relative z-20">{tab.label}</span>
          </button>
        ))}
      </div>
      <div 
        className="mt-4"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        id={`tabpanel-${activeTab}`}
        tabIndex={0}
      >
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}