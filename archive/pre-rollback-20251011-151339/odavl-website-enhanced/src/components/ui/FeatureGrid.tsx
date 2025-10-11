'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { ODCard } from "./ODCard"
import { cn } from "@/lib/utils"

interface Feature {
  icon: string
  title: string
  description: string
}

export interface FeatureGridProps {
  features: Feature[]
  className?: string
}

export function FeatureGrid({ features, className }: Readonly<FeatureGridProps>) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <ODCard className="h-full text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </ODCard>
        </motion.div>
      ))}
    </div>
  )
}