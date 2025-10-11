'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ODCardProps {
  className?: string
  title?: string
  description?: string
  headerContent?: React.ReactNode
  children?: React.ReactNode
}

const ODCard: React.FC<ODCardProps> = ({ className, title, description, headerContent, children }) => (
  <motion.div
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
      className
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={{ y: -2 }}
  >
    {(title || description || headerContent) && (
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        {headerContent}
        {title && <h3 className="font-semibold leading-none tracking-tight">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    )}
    {children && <div className="p-6 pt-0">{children}</div>}
  </motion.div>
)

export { ODCard }