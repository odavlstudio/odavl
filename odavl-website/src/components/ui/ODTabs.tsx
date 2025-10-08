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

  return (
    <div className={cn("w-full", className)}>
      <div className="flex space-x-1 rounded-xl bg-muted p-1" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} className={cn("relative rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition focus-visible:outline-2", activeTab === tab.id && "text-foreground")} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id}>
            {activeTab === tab.id && (
              <motion.span layoutId="bubble" className="absolute inset-0 z-10 bg-background mix-blend-difference rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs.find(tab => tab.id === activeTab)?.content}</div>
    </div>
  )
}