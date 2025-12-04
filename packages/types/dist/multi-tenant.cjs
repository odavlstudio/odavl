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

// src/multi-tenant.ts
var multi_tenant_exports = {};
__export(multi_tenant_exports, {
  DeliveryStatus: () => DeliveryStatus,
  InvitationStatus: () => InvitationStatus,
  MemberRole: () => MemberRole,
  MemberStatus: () => MemberStatus,
  PERMISSIONS: () => PERMISSIONS,
  PLAN_LIMITS: () => PLAN_LIMITS,
  PlanStatus: () => PlanStatus,
  ProjectStatus: () => ProjectStatus,
  ROLE_PERMISSIONS: () => ROLE_PERMISSIONS,
  SubscriptionPlan: () => SubscriptionPlan,
  WEBHOOK_EVENTS: () => WEBHOOK_EVENTS
});
module.exports = __toCommonJS(multi_tenant_exports);
var SubscriptionPlan = /* @__PURE__ */ ((SubscriptionPlan2) => {
  SubscriptionPlan2["FREE"] = "FREE";
  SubscriptionPlan2["STARTER"] = "STARTER";
  SubscriptionPlan2["PROFESSIONAL"] = "PROFESSIONAL";
  SubscriptionPlan2["ENTERPRISE"] = "ENTERPRISE";
  return SubscriptionPlan2;
})(SubscriptionPlan || {});
var PlanStatus = /* @__PURE__ */ ((PlanStatus2) => {
  PlanStatus2["ACTIVE"] = "ACTIVE";
  PlanStatus2["PAST_DUE"] = "PAST_DUE";
  PlanStatus2["CANCELED"] = "CANCELED";
  PlanStatus2["TRIALING"] = "TRIALING";
  return PlanStatus2;
})(PlanStatus || {});
var MemberRole = /* @__PURE__ */ ((MemberRole2) => {
  MemberRole2["OWNER"] = "OWNER";
  MemberRole2["ADMIN"] = "ADMIN";
  MemberRole2["MEMBER"] = "MEMBER";
  MemberRole2["VIEWER"] = "VIEWER";
  return MemberRole2;
})(MemberRole || {});
var MemberStatus = /* @__PURE__ */ ((MemberStatus2) => {
  MemberStatus2["ACTIVE"] = "ACTIVE";
  MemberStatus2["SUSPENDED"] = "SUSPENDED";
  MemberStatus2["INVITED"] = "INVITED";
  return MemberStatus2;
})(MemberStatus || {});
var InvitationStatus = /* @__PURE__ */ ((InvitationStatus2) => {
  InvitationStatus2["PENDING"] = "PENDING";
  InvitationStatus2["ACCEPTED"] = "ACCEPTED";
  InvitationStatus2["EXPIRED"] = "EXPIRED";
  InvitationStatus2["CANCELED"] = "CANCELED";
  return InvitationStatus2;
})(InvitationStatus || {});
var ProjectStatus = /* @__PURE__ */ ((ProjectStatus2) => {
  ProjectStatus2["ACTIVE"] = "ACTIVE";
  ProjectStatus2["ARCHIVED"] = "ARCHIVED";
  ProjectStatus2["DELETED"] = "DELETED";
  return ProjectStatus2;
})(ProjectStatus || {});
var DeliveryStatus = /* @__PURE__ */ ((DeliveryStatus2) => {
  DeliveryStatus2["PENDING"] = "PENDING";
  DeliveryStatus2["SUCCESS"] = "SUCCESS";
  DeliveryStatus2["FAILED"] = "FAILED";
  DeliveryStatus2["RETRYING"] = "RETRYING";
  return DeliveryStatus2;
})(DeliveryStatus || {});
var PLAN_LIMITS = {
  ["FREE" /* FREE */]: {
    maxMembers: 1,
    maxProjects: 3,
    maxApiCalls: 1e3,
    maxStorage: 1 * 1024 * 1024 * 1024,
    // 1GB
    features: ["basic_analysis", "local_storage"]
  },
  ["STARTER" /* STARTER */]: {
    maxMembers: 5,
    maxProjects: 20,
    maxApiCalls: 5e4,
    maxStorage: 10 * 1024 * 1024 * 1024,
    // 10GB
    features: ["basic_analysis", "cloud_storage", "email_notifications", "priority_support"]
  },
  ["PROFESSIONAL" /* PROFESSIONAL */]: {
    maxMembers: 25,
    maxProjects: 100,
    maxApiCalls: 5e5,
    maxStorage: 100 * 1024 * 1024 * 1024,
    // 100GB
    features: ["advanced_analysis", "cloud_storage", "email_notifications", "webhooks", "sso", "priority_support", "custom_branding"]
  },
  ["ENTERPRISE" /* ENTERPRISE */]: {
    maxMembers: -1,
    // unlimited
    maxProjects: -1,
    // unlimited
    maxApiCalls: -1,
    // unlimited
    maxStorage: -1,
    // unlimited
    features: ["all_features", "dedicated_support", "sla", "on_premise"]
  }
};
var PERMISSIONS = {
  // Organization management
  "org:update": "Update organization settings",
  "org:delete": "Delete organization",
  "org:billing": "Manage billing and subscriptions",
  // Member management
  "members:invite": "Invite new members",
  "members:remove": "Remove members",
  "members:update": "Update member roles",
  // Project management
  "projects:create": "Create new projects",
  "projects:read": "View projects",
  "projects:update": "Update projects",
  "projects:delete": "Delete projects",
  // API keys
  "apikeys:create": "Create API keys",
  "apikeys:read": "View API keys",
  "apikeys:revoke": "Revoke API keys",
  // Webhooks
  "webhooks:create": "Create webhooks",
  "webhooks:read": "View webhooks",
  "webhooks:update": "Update webhooks",
  "webhooks:delete": "Delete webhooks",
  // Usage analytics
  "analytics:read": "View usage analytics"
};
var ROLE_PERMISSIONS = {
  ["OWNER" /* OWNER */]: Object.keys(PERMISSIONS),
  ["ADMIN" /* ADMIN */]: [
    "org:update",
    "members:invite",
    "members:remove",
    "members:update",
    "projects:create",
    "projects:read",
    "projects:update",
    "projects:delete",
    "apikeys:create",
    "apikeys:read",
    "apikeys:revoke",
    "webhooks:create",
    "webhooks:read",
    "webhooks:update",
    "webhooks:delete",
    "analytics:read"
  ],
  ["MEMBER" /* MEMBER */]: [
    "projects:create",
    "projects:read",
    "projects:update",
    "apikeys:create",
    "apikeys:read",
    "webhooks:read",
    "analytics:read"
  ],
  ["VIEWER" /* VIEWER */]: [
    "projects:read",
    "apikeys:read",
    "webhooks:read",
    "analytics:read"
  ]
};
var WEBHOOK_EVENTS = {
  // Insight events
  "insight.analysis.started": "Insight analysis started",
  "insight.analysis.completed": "Insight analysis completed",
  "insight.analysis.failed": "Insight analysis failed",
  // Autopilot events
  "autopilot.run.started": "Autopilot run started",
  "autopilot.run.completed": "Autopilot run completed",
  "autopilot.run.failed": "Autopilot run failed",
  "autopilot.improvement.applied": "Autopilot improvement applied",
  // Guardian events
  "guardian.test.started": "Guardian test started",
  "guardian.test.completed": "Guardian test completed",
  "guardian.test.failed": "Guardian test failed",
  "guardian.gate.passed": "Quality gate passed",
  "guardian.gate.failed": "Quality gate failed",
  // Organization events
  "org.member.joined": "Member joined organization",
  "org.member.left": "Member left organization",
  "org.member.role_changed": "Member role changed",
  // Project events
  "project.created": "Project created",
  "project.updated": "Project updated",
  "project.deleted": "Project deleted",
  // Usage events
  "usage.limit.warning": "Usage limit warning (80%)",
  "usage.limit.exceeded": "Usage limit exceeded"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeliveryStatus,
  InvitationStatus,
  MemberRole,
  MemberStatus,
  PERMISSIONS,
  PLAN_LIMITS,
  PlanStatus,
  ProjectStatus,
  ROLE_PERMISSIONS,
  SubscriptionPlan,
  WEBHOOK_EVENTS
});
