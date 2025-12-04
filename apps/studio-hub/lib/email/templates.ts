/**
 * ODAVL Studio - Email Templates
 * HTML email templates for different notification types
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export type EmailTemplateType =
  | 'critical-issue-detected'
  | 'autopilot-success'
  | 'autopilot-failed'
  | 'guardian-test-passed'
  | 'guardian-test-failed'
  | 'team-invite'
  | 'team-member-joined'
  | 'subscription-expiring'
  | 'subscription-renewed'
  | 'weekly-digest';

export const emailTemplates: Record<EmailTemplateType, (data: any) => EmailTemplate> = {
  'critical-issue-detected': (data: {
    projectName: string;
    issueTitle: string;
    issueDescription: string;
    issueUrl: string;
    severity: string;
  }) => ({
    subject: `🚨 Critical Issue Detected in ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ODAVL Studio</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Autonomous Code Quality Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">Critical Issue Detected</h2>
                      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        ODAVL Insight detected a critical issue in your project <strong>${data.projectName}</strong>:
                      </p>

                      <!-- Issue Alert Box -->
                      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 0 0 24px 0;">
                        <h3 style="color: #991b1b; font-size: 18px; margin: 0 0 12px 0;">${data.issueTitle}</h3>
                        <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0;">${data.issueDescription}</p>
                        <div style="margin-top: 12px;">
                          <span style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                            ${data.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.issueUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              View Issue Details →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                        You received this email because you have notifications enabled for critical issues.
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        <a href="{{settingsUrl}}" style="color: #3b82f6; text-decoration: none;">Manage notification preferences</a> •
                        <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Critical Issue Detected in ${data.projectName}\n\n${data.issueTitle}\n${data.issueDescription}\n\nSeverity: ${data.severity}\n\nView details: ${data.issueUrl}`,
  }),

  'autopilot-success': (data: {
    projectName: string;
    fixCount: number;
    filesChanged: number;
    runUrl: string;
    summary: string[];
  }) => ({
    subject: `✅ Autopilot Successfully Fixed ${data.fixCount} Issues in ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚀 Autopilot Success</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">Run Completed Successfully</h2>
                      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        ODAVL Autopilot successfully fixed <strong>${data.fixCount} issues</strong> in <strong>${data.projectName}</strong>.
                      </p>

                      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 0 0 24px 0;">
                        <h3 style="color: #065f46; font-size: 16px; margin: 0 0 12px 0;">Changes Made:</h3>
                        <ul style="color: #047857; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                          ${data.summary.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                        <p style="color: #065f46; font-size: 14px; margin: 12px 0 0 0;">
                          📁 Files changed: <strong>${data.filesChanged}</strong>
                        </p>
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.runUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                              View Run Details →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        ODAVL Studio • Autonomous Code Quality
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }),

  'guardian-test-failed': (data: {
    url: string;
    score: number;
    issues: { category: string; count: number }[];
    reportUrl: string;
  }) => ({
    subject: `❌ Guardian Test Failed for ${data.url}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0;">🛡️ Guardian Test Failed</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; margin: 0 0 16px 0;">Test Results for ${data.url}</h2>
                      <p style="color: #6b7280; margin: 0 0 24px 0;">
                        Overall Score: <strong style="color: #dc2626; font-size: 24px;">${data.score}/100</strong>
                      </p>

                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 0 0 24px 0;">
                        <h3 style="color: #92400e; margin: 0 0 12px 0;">Issues Found:</h3>
                        ${data.issues.map(issue => `
                          <p style="color: #78350f; margin: 8px 0;">
                            <strong>${issue.category}:</strong> ${issue.count} issues
                          </p>
                        `).join('')}
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.reportUrl}" style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                              View Full Report →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }),

  'team-invite': (data: {
    inviterName: string;
    orgName: string;
    role: string;
    inviteUrl: string;
    expiresIn: string;
  }) => ({
    subject: `👥 ${data.inviterName} invited you to join ${data.orgName} on ODAVL`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0;">Team Invitation</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; margin: 0 0 16px 0;">You've been invited!</h2>
                      <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px 0;">
                        <strong>${data.inviterName}</strong> invited you to join <strong>${data.orgName}</strong> as a <strong>${data.role}</strong>.
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.inviteUrl}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Accept Invitation →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
                        This invitation expires in ${data.expiresIn}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }),

  'subscription-expiring': (data: {
    planName: string;
    daysRemaining: number;
    renewUrl: string;
  }) => ({
    subject: `⚠️ Your ODAVL ${data.planName} Subscription Expires in ${data.daysRemaining} Days`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0;">Subscription Expiring</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; margin: 0 0 16px 0;">Your ${data.planName} plan expires soon</h2>
                      <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px 0;">
                        Your subscription will expire in <strong style="color: #dc2626;">${data.daysRemaining} days</strong>. Renew now to avoid service interruption.
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.renewUrl}" style="display: inline-block; background: #8b5cf6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                              Renew Subscription →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }),

  'guardian-test-passed': (data) => ({ subject: '', html: '' }),
  'autopilot-failed': (data) => ({ subject: '', html: '' }),
  'team-member-joined': (data) => ({ subject: '', html: '' }),
  'subscription-renewed': (data) => ({ subject: '', html: '' }),
  'weekly-digest': (data) => ({ subject: '', html: '' }),
};
