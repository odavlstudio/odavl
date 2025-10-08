'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { ODButton } from "./ODButton"
import { ODCard } from "./ODCard"
import { ODBadge } from "./ODBadge"
import { cn } from "@/lib/utils"

interface PricingTier { name: string; price: string; description: string; features: string[]; cta: string; popular?: boolean }
export interface PricingTableProps { tiers: PricingTier[]; className?: string }

export function PricingTable({ tiers, className }: Readonly<PricingTableProps>) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-3", className)}>
      {tiers.map((tier, index) => (
        <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
          <ODCard className={cn("relative h-full", tier.popular && "border-primary")}>
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <ODBadge variant="default">Most Popular</ODBadge>
              </div>
            )}
            <div className="p-6">
              <h3 className="text-2xl font-bold">{tier.name}</h3>
              <div className="mt-4 text-6xl font-bold">{tier.price}</div>
              <p className="mt-4 text-muted-foreground">{tier.description}</p>
              <ul className="mt-6 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center"><span className="mr-3 text-green-500">✓</span>{feature}</li>
                ))}
              </ul>
              <ODButton className="mt-8 w-full" variant={tier.popular ? "primary" : "outline"}>{tier.cta}</ODButton>
            </div>
          </ODCard>
        </motion.div>
      ))}
    </div>
  )
}