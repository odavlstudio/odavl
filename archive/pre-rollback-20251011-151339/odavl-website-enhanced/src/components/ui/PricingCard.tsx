/**
 * Individual Pricing Card Component
 * Reusable pricing tier card with CTA routing
 */

'use client';

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ODButton } from "./ODButton";
import { ODCard } from "./ODCard";
import { ODBadge } from "./ODBadge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { PricingTier } from "@/data/pricing";

interface PricingCardProps {
  tier: PricingTier;
  className?: string;
  index?: number;
}

export function PricingCard({ tier, className, index = 0 }: Readonly<PricingCardProps>) {
  const ctaRoutes = {
    trial: '/signup?plan=' + tier.id,
    contact: '/contact?plan=' + tier.id,
    checkout: '/api/stripe/create-session?plan=' + tier.id
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={className}
    >
      <ODCard className={cn("relative h-full", tier.popular && "border-primary")}>
        {(tier.popular || tier.badge) && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <ODBadge variant="default">
              {tier.badge || "Most Popular"}
            </ODBadge>
          </div>
        )}
        <div className="p-6">
          <h3 className="text-2xl font-bold">{tier.name}</h3>
          <div className="mt-4 text-6xl font-bold">{tier.priceDisplay}</div>
          {tier.seatsLimit && (
            <p className="mt-2 text-sm text-muted-foreground">
              Up to {tier.seatsLimit} seat{tier.seatsLimit > 1 ? 's' : ''}
            </p>
          )}
          <ul className="mt-6 space-y-3">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <ODButton 
            className="mt-8 w-full" 
            variant={tier.popular ? "primary" : "outline"}
            asChild
          >
            <Link href={ctaRoutes[tier.ctaType]}>
              {tier.ctaLabel}
            </Link>
          </ODButton>
        </div>
      </ODCard>
    </motion.div>
  );
}