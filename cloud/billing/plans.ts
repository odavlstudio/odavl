/**
 * Plan Manager - Subscription plan definitions
 */

export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeatures;
  stripePriceId?: string;
}

export interface PlanFeatures {
  maxProjects: number;
  maxTeamMembers: number;
  insightScans: number; // per month
  autopilotRuns: number; // per month
  guardianTests: number; // per month
  marketplacePublish: boolean;
  intelligenceAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export class PlanManager {
  private plans: Map<string, Plan> = new Map();

  constructor() {
    this.initializePlans();
  }

  private initializePlans(): void {
    const plans: Plan[] = [
      {
        id: 'free',
        name: 'Free',
        tier: PlanTier.FREE,
        priceMonthly: 0,
        priceYearly: 0,
        features: {
          maxProjects: 3,
          maxTeamMembers: 1,
          insightScans: 100,
          autopilotRuns: 10,
          guardianTests: 50,
          marketplacePublish: false,
          intelligenceAccess: false,
          prioritySupport: false,
          customBranding: false,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        tier: PlanTier.PRO,
        priceMonthly: 29,
        priceYearly: 290,
        features: {
          maxProjects: 10,
          maxTeamMembers: 5,
          insightScans: 1000,
          autopilotRuns: 100,
          guardianTests: 500,
          marketplacePublish: true,
          intelligenceAccess: true,
          prioritySupport: false,
          customBranding: false,
        },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        tier: PlanTier.ENTERPRISE,
        priceMonthly: 199,
        priceYearly: 1990,
        features: {
          maxProjects: -1, // unlimited
          maxTeamMembers: -1,
          insightScans: -1,
          autopilotRuns: -1,
          guardianTests: -1,
          marketplacePublish: true,
          intelligenceAccess: true,
          prioritySupport: true,
          customBranding: true,
        },
      },
    ];

    plans.forEach((plan) => this.plans.set(plan.id, plan));
  }

  getPlan(id: string): Plan | undefined {
    return this.plans.get(id);
  }

  listPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  checkFeature(planId: string, feature: keyof PlanFeatures): boolean | number {
    const plan = this.plans.get(planId);
    return plan ? plan.features[feature] : false;
  }
}
