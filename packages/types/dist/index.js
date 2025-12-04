// src/index.ts
var PRODUCT_TIERS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    limits: {
      projects: 3,
      detectorRuns: 100,
      teamMembers: 1,
      apiCalls: 1e3,
      storageMB: 100
    },
    features: [
      "3 projects",
      "100 detector runs/month",
      "1 team member",
      "1,000 API calls/month",
      "100 MB storage",
      "Community support"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 29,
    interval: "month",
    limits: {
      projects: 20,
      detectorRuns: 1e3,
      teamMembers: 5,
      apiCalls: 1e4,
      storageMB: 1e3
    },
    features: [
      "20 projects",
      "1,000 detector runs/month",
      "5 team members",
      "10,000 API calls/month",
      "1 GB storage",
      "Priority support",
      "Advanced analytics"
    ]
  },
  team: {
    id: "team",
    name: "Team",
    price: 99,
    interval: "month",
    limits: {
      projects: 100,
      detectorRuns: 5e3,
      teamMembers: 20,
      apiCalls: 5e4,
      storageMB: 5e3
    },
    features: [
      "100 projects",
      "5,000 detector runs/month",
      "20 team members",
      "50,000 API calls/month",
      "5 GB storage",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "SSO"
    ]
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    interval: "month",
    limits: {
      projects: -1,
      // Unlimited
      detectorRuns: -1,
      teamMembers: -1,
      apiCalls: -1,
      storageMB: -1
    },
    features: [
      "Unlimited projects",
      "Unlimited detector runs",
      "Unlimited team members",
      "Unlimited API calls",
      "Unlimited storage",
      "24/7 dedicated support",
      "Advanced analytics",
      "Custom integrations",
      "SSO",
      "SLA",
      "On-premise deployment"
    ]
  }
};
export {
  PRODUCT_TIERS
};
