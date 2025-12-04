"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/audit-logs.ts
var audit_logs_exports = {};
__export(audit_logs_exports, {
  AuditAction: () => AuditAction,
  AuditCategory: () => AuditCategory,
  AuditLogsService: () => AuditLogsService,
  AuditSeverity: () => AuditSeverity,
  auditLogsService: () => auditLogsService
});
module.exports = __toCommonJS(audit_logs_exports);
var import_node_crypto = __toESM(require("crypto"), 1);
var AuditAction = /* @__PURE__ */ ((AuditAction2) => {
  AuditAction2["USER_LOGIN"] = "USER_LOGIN";
  AuditAction2["USER_LOGOUT"] = "USER_LOGOUT";
  AuditAction2["USER_REGISTER"] = "USER_REGISTER";
  AuditAction2["USER_UPDATE"] = "USER_UPDATE";
  AuditAction2["USER_DELETE"] = "USER_DELETE";
  AuditAction2["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
  AuditAction2["PASSWORD_RESET"] = "PASSWORD_RESET";
  AuditAction2["ORG_CREATE"] = "ORG_CREATE";
  AuditAction2["ORG_UPDATE"] = "ORG_UPDATE";
  AuditAction2["ORG_DELETE"] = "ORG_DELETE";
  AuditAction2["ORG_MEMBER_ADD"] = "ORG_MEMBER_ADD";
  AuditAction2["ORG_MEMBER_REMOVE"] = "ORG_MEMBER_REMOVE";
  AuditAction2["ORG_MEMBER_ROLE_CHANGE"] = "ORG_MEMBER_ROLE_CHANGE";
  AuditAction2["PROJECT_CREATE"] = "PROJECT_CREATE";
  AuditAction2["PROJECT_UPDATE"] = "PROJECT_UPDATE";
  AuditAction2["PROJECT_DELETE"] = "PROJECT_DELETE";
  AuditAction2["PROJECT_VIEW"] = "PROJECT_VIEW";
  AuditAction2["PROJECT_ANALYZE"] = "PROJECT_ANALYZE";
  AuditAction2["SECURITY_ROLE_CHANGE"] = "SECURITY_ROLE_CHANGE";
  AuditAction2["SECURITY_PERMISSION_GRANT"] = "SECURITY_PERMISSION_GRANT";
  AuditAction2["SECURITY_PERMISSION_REVOKE"] = "SECURITY_PERMISSION_REVOKE";
  AuditAction2["SECURITY_API_KEY_CREATE"] = "SECURITY_API_KEY_CREATE";
  AuditAction2["SECURITY_API_KEY_DELETE"] = "SECURITY_API_KEY_DELETE";
  AuditAction2["SECURITY_2FA_ENABLE"] = "SECURITY_2FA_ENABLE";
  AuditAction2["SECURITY_2FA_DISABLE"] = "SECURITY_2FA_DISABLE";
  AuditAction2["INVITATION_SEND"] = "INVITATION_SEND";
  AuditAction2["INVITATION_ACCEPT"] = "INVITATION_ACCEPT";
  AuditAction2["INVITATION_DECLINE"] = "INVITATION_DECLINE";
  AuditAction2["INVITATION_REVOKE"] = "INVITATION_REVOKE";
  AuditAction2["DATA_EXPORT"] = "DATA_EXPORT";
  AuditAction2["DATA_IMPORT"] = "DATA_IMPORT";
  AuditAction2["DATA_DELETE"] = "DATA_DELETE";
  AuditAction2["INTEGRATION_CONNECT"] = "INTEGRATION_CONNECT";
  AuditAction2["INTEGRATION_DISCONNECT"] = "INTEGRATION_DISCONNECT";
  AuditAction2["WEBHOOK_CREATE"] = "WEBHOOK_CREATE";
  AuditAction2["WEBHOOK_DELETE"] = "WEBHOOK_DELETE";
  AuditAction2["BILLING_PLAN_CHANGE"] = "BILLING_PLAN_CHANGE";
  AuditAction2["BILLING_PAYMENT_SUCCESS"] = "BILLING_PAYMENT_SUCCESS";
  AuditAction2["BILLING_PAYMENT_FAIL"] = "BILLING_PAYMENT_FAIL";
  AuditAction2["BILLING_SUBSCRIPTION_CANCEL"] = "BILLING_SUBSCRIPTION_CANCEL";
  return AuditAction2;
})(AuditAction || {});
var AuditSeverity = /* @__PURE__ */ ((AuditSeverity2) => {
  AuditSeverity2["INFO"] = "INFO";
  AuditSeverity2["WARNING"] = "WARNING";
  AuditSeverity2["ERROR"] = "ERROR";
  AuditSeverity2["CRITICAL"] = "CRITICAL";
  return AuditSeverity2;
})(AuditSeverity || {});
var AuditCategory = /* @__PURE__ */ ((AuditCategory2) => {
  AuditCategory2["AUTHENTICATION"] = "AUTHENTICATION";
  AuditCategory2["AUTHORIZATION"] = "AUTHORIZATION";
  AuditCategory2["DATA_ACCESS"] = "DATA_ACCESS";
  AuditCategory2["DATA_MODIFICATION"] = "DATA_MODIFICATION";
  AuditCategory2["SECURITY"] = "SECURITY";
  AuditCategory2["COMPLIANCE"] = "COMPLIANCE";
  AuditCategory2["SYSTEM"] = "SYSTEM";
  return AuditCategory2;
})(AuditCategory || {});
var AuditLogsService = class _AuditLogsService {
  static instance;
  logs = /* @__PURE__ */ new Map();
  constructor() {
  }
  static getInstance() {
    if (!_AuditLogsService.instance) {
      _AuditLogsService.instance = new _AuditLogsService();
    }
    return _AuditLogsService.instance;
  }
  /**
   * Log an audit event
   */
  async log(params) {
    const id = `audit_${Date.now()}_${import_node_crypto.default.randomBytes(8).toString("hex")}`;
    const entry = {
      id,
      timestamp: /* @__PURE__ */ new Date(),
      action: params.action,
      category: params.category,
      severity: params.severity,
      description: params.description,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      organizationId: params.organizationId,
      projectId: params.projectId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      sessionId: params.sessionId,
      changes: params.changes,
      metadata: params.metadata,
      location: params.location,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: params.tags || []
    };
    this.logs.set(id, entry);
    if (entry.severity === "CRITICAL" /* CRITICAL */) {
      console.warn("[AUDIT] Critical event:", entry);
    }
    return entry;
  }
  /**
   * Log user login
   */
  async logLogin(params) {
    return this.log({
      action: "USER_LOGIN" /* USER_LOGIN */,
      category: "AUTHENTICATION" /* AUTHENTICATION */,
      severity: params.success ? "INFO" /* INFO */ : "WARNING" /* WARNING */,
      description: `User ${params.userEmail} ${params.success ? "logged in" : "failed to log in"}`,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: ["authentication", "login"]
    });
  }
  /**
   * Log security event
   */
  async logSecurityEvent(params) {
    return this.log({
      action: params.action,
      category: "SECURITY" /* SECURITY */,
      severity: params.severity || "WARNING" /* WARNING */,
      description: params.description,
      userId: params.userId,
      userEmail: params.userEmail,
      organizationId: params.organizationId,
      changes: params.changes,
      success: params.success,
      tags: ["security"]
    });
  }
  /**
   * Log data access
   */
  async logDataAccess(params) {
    return this.log({
      action: params.action,
      category: "DATA_ACCESS" /* DATA_ACCESS */,
      severity: "INFO" /* INFO */,
      description: `User ${params.userEmail} accessed ${params.resourceType} ${params.resourceId}`,
      userId: params.userId,
      userEmail: params.userEmail,
      organizationId: params.organizationId,
      projectId: params.projectId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      success: true,
      tags: ["data-access"]
    });
  }
  /**
   * Log data modification
   */
  async logDataModification(params) {
    return this.log({
      action: params.action,
      category: "DATA_MODIFICATION" /* DATA_MODIFICATION */,
      severity: params.success ? "INFO" /* INFO */ : "ERROR" /* ERROR */,
      description: `User ${params.userEmail} ${params.action} ${params.resourceType} ${params.resourceId}`,
      userId: params.userId,
      userEmail: params.userEmail,
      organizationId: params.organizationId,
      projectId: params.projectId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      changes: params.changes,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: ["data-modification"]
    });
  }
  /**
   * Get logs with filters
   */
  async getLogs(filters = {}) {
    let logs = Array.from(this.logs.values());
    if (filters.startDate) {
      logs = logs.filter((log) => log.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      logs = logs.filter((log) => log.timestamp <= filters.endDate);
    }
    if (filters.actions && filters.actions.length > 0) {
      logs = logs.filter((log) => filters.actions.includes(log.action));
    }
    if (filters.categories && filters.categories.length > 0) {
      logs = logs.filter((log) => filters.categories.includes(log.category));
    }
    if (filters.severities && filters.severities.length > 0) {
      logs = logs.filter((log) => filters.severities.includes(log.severity));
    }
    if (filters.userId) {
      logs = logs.filter((log) => log.userId === filters.userId);
    }
    if (filters.userEmail) {
      logs = logs.filter((log) => log.userEmail === filters.userEmail);
    }
    if (filters.organizationId) {
      logs = logs.filter((log) => log.organizationId === filters.organizationId);
    }
    if (filters.projectId) {
      logs = logs.filter((log) => log.projectId === filters.projectId);
    }
    if (filters.resourceType) {
      logs = logs.filter((log) => log.resourceType === filters.resourceType);
    }
    if (filters.resourceId) {
      logs = logs.filter((log) => log.resourceId === filters.resourceId);
    }
    if (filters.success !== void 0) {
      logs = logs.filter((log) => log.success === filters.success);
    }
    if (filters.tags && filters.tags.length > 0) {
      logs = logs.filter((log) => filters.tags.some((tag) => log.tags.includes(tag)));
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      logs = logs.filter(
        (log) => log.description.toLowerCase().includes(query) || log.userEmail?.toLowerCase().includes(query) || log.action.toLowerCase().includes(query)
      );
    }
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    logs = logs.slice(offset, offset + limit);
    return logs;
  }
  /**
   * Get statistics
   */
  async getStats(organizationId) {
    let logs = Array.from(this.logs.values());
    if (organizationId) {
      logs = logs.filter((log) => log.organizationId === organizationId);
    }
    const totalLogs = logs.length;
    const byCategory = {};
    Object.values(AuditCategory).forEach((cat) => {
      byCategory[cat] = logs.filter((log) => log.category === cat).length;
    });
    const bySeverity = {};
    Object.values(AuditSeverity).forEach((sev) => {
      bySeverity[sev] = logs.filter((log) => log.severity === sev).length;
    });
    const actionCounts = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    });
    const byAction = Object.fromEntries(
      Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    );
    const successCount = logs.filter((log) => log.success).length;
    const failureCount = logs.filter((log) => !log.success).length;
    const successRate = totalLogs > 0 ? successCount / totalLogs * 100 : 0;
    const userCounts = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      if (log.userId && log.userEmail) {
        const existing = userCounts.get(log.userId);
        if (existing) {
          existing.count++;
        } else {
          userCounts.set(log.userId, {
            userId: log.userId,
            userEmail: log.userEmail,
            count: 1
          });
        }
      }
    });
    const topUsers = Array.from(userCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10).map((u) => ({ userId: u.userId, userEmail: u.userEmail, actionCount: u.count }));
    const recentActivity = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);
    const now = Date.now();
    const last24Hours = logs.filter((log) => now - log.timestamp.getTime() < 24 * 60 * 60 * 1e3).length;
    const last7Days = logs.filter((log) => now - log.timestamp.getTime() < 7 * 24 * 60 * 60 * 1e3).length;
    const last30Days = logs.filter((log) => now - log.timestamp.getTime() < 30 * 24 * 60 * 60 * 1e3).length;
    return {
      totalLogs,
      byCategory,
      bySeverity,
      byAction,
      successRate,
      failureCount,
      topUsers,
      recentActivity,
      last24Hours,
      last7Days,
      last30Days
    };
  }
  /**
   * Generate compliance report
   */
  async generateComplianceReport(params) {
    const logs = await this.getLogs({
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId
    });
    const id = `report_${Date.now()}_${import_node_crypto.default.randomBytes(8).toString("hex")}`;
    const securityEvents = logs.filter((log) => log.category === "SECURITY" /* SECURITY */);
    const criticalEvents = logs.filter((log) => log.severity === "CRITICAL" /* CRITICAL */);
    const userActivity = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      if (log.userId && log.userEmail) {
        const existing = userActivity.get(log.userId);
        if (existing) {
          existing.actionCount++;
          if (log.timestamp > existing.lastActivity) {
            existing.lastActivity = log.timestamp;
          }
        } else {
          userActivity.set(log.userId, {
            userId: log.userId,
            userEmail: log.userEmail,
            actionCount: 1,
            lastActivity: log.timestamp
          });
        }
      }
    });
    const complianceMetrics = {
      mfaEnabled: logs.filter((log) => log.action === "SECURITY_2FA_ENABLE" /* SECURITY_2FA_ENABLE */).length,
      passwordChanges: logs.filter((log) => log.action === "PASSWORD_CHANGE" /* PASSWORD_CHANGE */).length,
      dataExports: logs.filter((log) => log.action === "DATA_EXPORT" /* DATA_EXPORT */).length,
      dataDeletes: logs.filter((log) => log.action === "DATA_DELETE" /* DATA_DELETE */).length,
      permissionChanges: logs.filter(
        (log) => log.action === "SECURITY_PERMISSION_GRANT" /* SECURITY_PERMISSION_GRANT */ || log.action === "SECURITY_PERMISSION_REVOKE" /* SECURITY_PERMISSION_REVOKE */
      ).length
    };
    return {
      id,
      generatedAt: /* @__PURE__ */ new Date(),
      period: {
        start: params.startDate,
        end: params.endDate
      },
      organizationId: params.organizationId,
      summary: {
        totalActions: logs.length,
        securityEvents: securityEvents.length,
        dataAccess: logs.filter((log) => log.category === "DATA_ACCESS" /* DATA_ACCESS */).length,
        dataModifications: logs.filter((log) => log.category === "DATA_MODIFICATION" /* DATA_MODIFICATION */).length,
        failedActions: logs.filter((log) => !log.success).length
      },
      userActivity: Array.from(userActivity.values()).sort((a, b) => b.actionCount - a.actionCount),
      securityEvents,
      criticalEvents,
      complianceMetrics
    };
  }
  /**
   * Export logs to JSON
   */
  async exportLogs(filters = {}) {
    const logs = await this.getLogs(filters);
    return JSON.stringify(logs, null, 2);
  }
  /**
   * Export logs to CSV
   */
  async exportLogsCSV(filters = {}) {
    const logs = await this.getLogs(filters);
    const headers = [
      "ID",
      "Timestamp",
      "Action",
      "Category",
      "Severity",
      "Description",
      "User Email",
      "Organization ID",
      "Project ID",
      "Resource Type",
      "Resource ID",
      "IP Address",
      "Success",
      "Error Message"
    ];
    const rows = logs.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.action,
      log.category,
      log.severity,
      log.description,
      log.userEmail || "",
      log.organizationId || "",
      log.projectId || "",
      log.resourceType || "",
      log.resourceId || "",
      log.ipAddress || "",
      log.success.toString(),
      log.errorMessage || ""
    ]);
    const csvLines = [headers, ...rows].map(
      (row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    );
    return csvLines.join("\n");
  }
  /**
   * Delete old logs (retention policy)
   */
  async deleteOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1e3);
    let deletedCount = 0;
    for (const [id, log] of this.logs.entries()) {
      if (log.timestamp < cutoffDate) {
        this.logs.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }
};
var auditLogsService = AuditLogsService.getInstance();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuditAction,
  AuditCategory,
  AuditLogsService,
  AuditSeverity,
  auditLogsService
});
