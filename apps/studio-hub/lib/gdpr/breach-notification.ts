/**
 * GDPR Data Breach Notification System
 *
 * Implements GDPR Article 33 - Notification of Personal Data Breach to Supervisory Authority
 * Implements GDPR Article 34 - Communication of Personal Data Breach to Data Subject
 *
 * Requirements:
 * - Notify supervisory authority within 72 hours
 * - Notify affected users without undue delay
 * - Document all breaches (even if not notifiable)
 *
 * @see docs/legal/PRIVACY_POLICY.md
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/sender";
import { logger } from "@/lib/logger";

export enum BreachSeverity {
  LOW = "LOW", // Unlikely to result in risk to rights and freedoms
  MEDIUM = "MEDIUM", // May result in risk
  HIGH = "HIGH", // Likely to result in high risk (requires user notification)
  CRITICAL = "CRITICAL", // Immediate risk (requires immediate notification)
}

export interface DataBreach {
  id: string;
  severity: BreachSeverity;
  description: string;
  affectedUsersCount: number;
  affectedUserIds: string[];
  dataTypesAffected: string[];
  discoveredAt: Date;
  reportedToAuthorityAt?: Date;
  reportedToUsersAt?: Date;
  mitigationSteps: string[];
  rootCause?: string;
  responsibleParty?: string;
}

/**
 * Report a data breach (internal logging + GDPR compliance tracking)
 *
 * CRITICAL: This function must be called IMMEDIATELY upon discovering a breach
 */
export async function reportDataBreach(breach: Omit<DataBreach, "id" | "discoveredAt">): Promise<string> {
  const breachId = `breach-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const discoveredAt = new Date();

  const breachRecord: DataBreach = {
    id: breachId,
    ...breach,
    discoveredAt,
  };

  // 1. Log breach immediately (persistent storage)
  try {
    await prisma.dataBreachLog?.create({
      data: {
        id: breachId,
        severity: breach.severity,
        description: breach.description,
        affectedUsersCount: breach.affectedUsersCount,
        affectedUserIds: JSON.stringify(breach.affectedUserIds),
        dataTypesAffected: JSON.stringify(breach.dataTypesAffected),
        discoveredAt,
        mitigationSteps: JSON.stringify(breach.mitigationSteps),
        rootCause: breach.rootCause,
        responsibleParty: breach.responsibleParty,
      },
    });
  } catch (error) {
    logger.error("[CRITICAL] Failed to log data breach to database", { error, breachId });
    // Fallback: Write to file system
    await writeFallbackBreachLog(breachRecord);
  }

  // 2. Alert security team (PagerDuty, Slack, SMS)
  await alertSecurityTeam(breachRecord);

  // 3. Assess if notification required
  const requiresAuthorityNotification = shouldNotifyAuthority(breach.severity, breach.affectedUsersCount);
  const requiresUserNotification = shouldNotifyUsers(breach.severity, breach.dataTypesAffected);

  // 4. Schedule notifications
  if (requiresAuthorityNotification) {
    await scheduleAuthorityNotification(breachRecord);
  }

  if (requiresUserNotification) {
    await scheduleUserNotification(breachRecord);
  }

  logger.error(`[DATA BREACH] ${breach.severity} breach discovered`, {
    breachId,
    affectedUsers: breach.affectedUsersCount,
    dataTypes: breach.dataTypesAffected,
    requiresAuthorityNotification,
    requiresUserNotification,
  });

  return breachId;
}

/**
 * Determine if supervisory authority notification is required
 * GDPR Article 33: Notify within 72 hours unless unlikely to result in risk
 */
function shouldNotifyAuthority(severity: BreachSeverity, affectedCount: number): boolean {
  // Always notify for HIGH/CRITICAL
  if (severity === BreachSeverity.HIGH || severity === BreachSeverity.CRITICAL) {
    return true;
  }

  // Notify for MEDIUM if affecting 100+ users
  if (severity === BreachSeverity.MEDIUM && affectedCount >= 100) {
    return true;
  }

  // For LOW severity, only notify if affecting 1000+ users (consult legal counsel)
  if (severity === BreachSeverity.LOW && affectedCount >= 1000) {
    return true;
  }

  return false;
}

/**
 * Determine if user notification is required
 * GDPR Article 34: Notify users if likely to result in high risk
 */
function shouldNotifyUsers(severity: BreachSeverity, dataTypes: string[]): boolean {
  // Always notify for HIGH/CRITICAL
  if (severity === BreachSeverity.HIGH || severity === BreachSeverity.CRITICAL) {
    return true;
  }

  // Notify if sensitive data affected (passwords, payment info, personal identifiers)
  const sensitiveDataTypes = ["password", "payment", "credit_card", "ssn", "passport", "health"];
  const hasSensitiveData = dataTypes.some((type) =>
    sensitiveDataTypes.some((sensitive) => type.toLowerCase().includes(sensitive))
  );

  if (hasSensitiveData) {
    return true;
  }

  return false;
}

/**
 * Alert security team via multiple channels
 */
async function alertSecurityTeam(breach: DataBreach): Promise<void> {
  const alertMessage = `
🚨 DATA BREACH DETECTED 🚨

Severity: ${breach.severity}
Affected Users: ${breach.affectedUsersCount}
Data Types: ${breach.dataTypesAffected.join(", ")}
Discovered: ${breach.discoveredAt.toISOString()}

Description: ${breach.description}

Mitigation Steps:
${breach.mitigationSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

Breach ID: ${breach.id}
  `;

  // Send to security email
  try {
    await sendEmail({
      to: "security@odavl.studio",
      subject: `🚨 [${breach.severity}] Data Breach Detected - ${breach.id}`,
      html: alertMessage.replace(/\n/g, "<br>"),
    });
  } catch (error) {
    logger.error("Failed to send breach alert email", { error });
  }

  // TODO: Integrate with PagerDuty, Slack, SMS alerts
  logger.error("[SECURITY ALERT] Data breach notification sent", { breachId: breach.id });
}

/**
 * Schedule notification to supervisory authority (72-hour deadline)
 */
async function scheduleAuthorityNotification(breach: DataBreach): Promise<void> {
  logger.warn(`[GDPR] Supervisory authority notification required for breach ${breach.id}`);

  // TODO: Integrate with GDPR notification system (manual process for now)
  // In production:
  // 1. Create ticket in legal system
  // 2. Set 72-hour deadline reminder
  // 3. Prepare breach notification form (EU SCC template)
  // 4. Contact DPO and legal counsel

  await sendEmail({
    to: "dpo@odavl.studio",
    cc: "legal@odavl.studio",
    subject: `[URGENT] GDPR Authority Notification Required - Breach ${breach.id}`,
    html: `
      <h2>⚠️ GDPR Article 33 - Authority Notification Required</h2>
      <p><strong>Deadline:</strong> ${new Date(breach.discoveredAt.getTime() + 72 * 60 * 60 * 1000).toISOString()} (72 hours from discovery)</p>
      <p><strong>Breach ID:</strong> ${breach.id}</p>
      <p><strong>Severity:</strong> ${breach.severity}</p>
      <p><strong>Affected Users:</strong> ${breach.affectedUsersCount}</p>
      <p><strong>Data Types:</strong> ${breach.dataTypesAffected.join(", ")}</p>
      <p><strong>Description:</strong> ${breach.description}</p>

      <h3>Next Steps:</h3>
      <ol>
        <li>Complete GDPR breach notification form</li>
        <li>Submit to relevant supervisory authority (e.g., German BfDI, Irish DPC)</li>
        <li>Document submission date and authority response</li>
      </ol>
    `,
  });
}

/**
 * Schedule notification to affected users
 */
async function scheduleUserNotification(breach: DataBreach): Promise<void> {
  logger.warn(`[GDPR] User notification required for breach ${breach.id}`);

  // Fetch affected users
  const affectedUsers = await prisma.user.findMany({
    where: { id: { in: breach.affectedUserIds } },
    select: { id: true, email: true, name: true },
  });

  // Send breach notification email to each user
  for (const user of affectedUsers) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Important: Security Incident Notification - ODAVL Studio",
        html: generateUserBreachNotificationHTML(user.name || user.email, breach),
      });
    } catch (error) {
      logger.error(`Failed to send breach notification to user ${user.id}`, { error });
    }
  }

  // Update breach record
  await prisma.dataBreachLog?.update({
    where: { id: breach.id },
    data: { reportedToUsersAt: new Date() },
  });

  logger.info(`[GDPR] Sent breach notifications to ${affectedUsers.length} users`, {
    breachId: breach.id,
  });
}

/**
 * Generate user-facing breach notification email (GDPR Article 34)
 */
function generateUserBreachNotificationHTML(userName: string, breach: DataBreach): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Important Security Notification</h2>

        <p>Dear ${userName},</p>

        <p>We are writing to inform you of a security incident that may have affected your personal data.</p>

        <h3>What Happened?</h3>
        <p>${breach.description}</p>

        <h3>What Information Was Affected?</h3>
        <ul>
          ${breach.dataTypesAffected.map((type) => `<li>${type}</li>`).join("")}
        </ul>

        <h3>What We're Doing</h3>
        <ul>
          ${breach.mitigationSteps.map((step) => `<li>${step}</li>`).join("")}
        </ul>

        <h3>What You Should Do</h3>
        <ol>
          <li><strong>Change your password</strong> immediately if you haven't already</li>
          <li>Enable two-factor authentication (2FA) in your account settings</li>
          <li>Review your account activity for any unauthorized access</li>
          <li>Be cautious of phishing emails claiming to be from ODAVL Studio</li>
        </ol>

        <h3>Your Rights</h3>
        <p>Under GDPR, you have the right to:</p>
        <ul>
          <li>Access all data we hold about you</li>
          <li>Request deletion of your account</li>
          <li>File a complaint with your data protection authority</li>
        </ul>

        <h3>Questions?</h3>
        <p>
          Contact our Data Protection Officer:<br>
          Email: <a href="mailto:dpo@odavl.studio">dpo@odavl.studio</a><br>
          Support: <a href="mailto:support@odavl.studio">support@odavl.studio</a>
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
          We sincerely apologize for this incident and are committed to protecting your data.
        </p>

        <p style="color: #666; font-size: 0.9em;">
          — The ODAVL Studio Security Team
        </p>

        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 0.8em; color: #999;">
          Incident ID: ${breach.id}<br>
          Discovered: ${breach.discoveredAt.toISOString()}<br>
          Notification sent: ${new Date().toISOString()}
        </p>
      </body>
    </html>
  `;
}

/**
 * Fallback: Write breach log to file system if database unavailable
 */
async function writeFallbackBreachLog(breach: DataBreach): Promise<void> {
  const fs = require("fs").promises;
  const path = require("path");

  const logDir = path.join(process.cwd(), "logs", "security-breaches");
  const logFile = path.join(logDir, `breach-${breach.id}.json`);

  try {
    await fs.mkdir(logDir, { recursive: true });
    await fs.writeFile(logFile, JSON.stringify(breach, null, 2));
    logger.warn(`[FALLBACK] Wrote breach log to file system: ${logFile}`);
  } catch (error) {
    logger.error("[CRITICAL] Failed to write fallback breach log", { error });
  }
}

/**
 * Example: Report a sample breach (for testing)
 */
export async function testBreachNotification() {
  const breachId = await reportDataBreach({
    severity: BreachSeverity.HIGH,
    description: "Unauthorized access to user database detected via compromised admin credentials",
    affectedUsersCount: 150,
    affectedUserIds: ["user1", "user2", "user3"], // Example IDs
    dataTypesAffected: ["email", "name", "workspace names", "error signatures"],
    mitigationSteps: [
      "Revoked all admin access tokens",
      "Reset all user passwords",
      "Enabled mandatory 2FA for all admin accounts",
      "Conducted full security audit of authentication system",
      "Implemented additional monitoring for suspicious activity",
    ],
    rootCause: "Admin credentials exposed via phishing attack",
    responsibleParty: "External attacker",
  });

  return breachId;
}
