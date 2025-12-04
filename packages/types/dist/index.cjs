"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PRODUCT_TIERS: () => PRODUCT_TIERS
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PRODUCT_TIERS
});
