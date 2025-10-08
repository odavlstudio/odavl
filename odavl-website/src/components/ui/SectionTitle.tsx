'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface SectionTitleProps {
  title: string; subtitle?: string; description?: string; className?: string; align?: "left" | "center" | "right"
}

export function SectionTitle({ title, subtitle, description, className, align = "center" }: Readonly<SectionTitleProps>) {
  const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[align]

  return (
    <motion.div className={cn("space-y-4", alignClass, className)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      {subtitle && <p className="text-sm font-medium uppercase tracking-wider text-primary">{subtitle}</p>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{description}</p>}
    </motion.div>
  )
}