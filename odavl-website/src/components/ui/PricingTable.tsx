'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { PricingCard } from "./PricingCard";
import type { PricingTier } from "@/data/pricing";

export interface PricingTableProps { 
  tiers: PricingTier[]; 
  className?: string; 
}

export function PricingTable({ tiers, className }: Readonly<PricingTableProps>) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-3", className)}>
      {tiers.map((tier, index) => (
        <PricingCard 
          key={tier.id} 
          tier={tier} 
          index={index}
          className="h-full"
        />
      ))}
    </div>
  );
}