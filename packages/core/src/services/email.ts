/**
 * Email Service
 * Handles transactional emails with templates
 */

import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface WelcomeEmailData {
  name: string;
  organizationName: string;
  loginUrl: string;
}

export interface InvitationEmailData {
  inviterName: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}

export interface SubscriptionEmailData {
  organizationName: string;
  plan: string;
  amount: number;
  nextBillingDate: Date;
  manageBillingUrl: string;
}

export interface ErrorAlertEmailData {
  organizationName: string;
  projectName: string;
  errorCount: number;
  criticalCount: number;
  timeRange: string;
  dashboardUrl: string;
}

export interface UsageLimitEmailData {
  organizationName: string;
  limitType: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  upgradeUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@odavl.studio';

    // Configure transporter based on environment
    if (process.env.SMTP_HOST) {
      // Production SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development: Log emails to console
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const result = await this.transporter.sendMail({
        from: options.from || this.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      // Log in development
      if (!process.env.SMTP_HOST) {
        console.log('📧 Email sent (development mode):');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('---');
      }

      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    const html = this.generateWelcomeEmailHtml(data);
    
    await this.sendEmail({
      to,
      subject: `Welcome to ${data.organizationName} on ODAVL Studio`,
      html,
      text: this.htmlToText(html),
    });
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(to: string, data: InvitationEmailData): Promise<void> {
    const html = this.generateInvitationEmailHtml(data);
    
    await this.sendEmail({
      to,
      subject: `${data.inviterName} invited you to join ${data.organizationName}`,
      html,
      text: this.htmlToText(html),
    });
  }

  /**
   * Send subscription confirmation
   */
  async sendSubscriptionConfirmation(to: string, data: SubscriptionEmailData): Promise<void> {
    const html = this.generateSubscriptionEmailHtml(data);
    
    await this.sendEmail({
      to,
      subject: `Subscription Confirmed - ${data.plan} Plan`,
      html,
      text: this.htmlToText(html),
    });
  }

  /**
   * Send error alert
   */
  async sendErrorAlert(to: string | string[], data: ErrorAlertEmailData): Promise<void> {
    const html = this.generateErrorAlertEmailHtml(data);
    
    await this.sendEmail({
      to,
      subject: `⚠️ Error Alert: ${data.errorCount} errors detected in ${data.projectName}`,
      html,
      text: this.htmlToText(html),
    });
  }

  /**
   * Send usage limit warning
   */
  async sendUsageLimitWarning(to: string, data: UsageLimitEmailData): Promise<void> {
    const html = this.generateUsageLimitEmailHtml(data);
    
    await this.sendEmail({
      to,
      subject: `⚠️ Usage Alert: ${data.percentage}% of ${data.limitType} limit reached`,
      html,
      text: this.htmlToText(html),
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const html = this.generatePasswordResetEmailHtml(resetUrl);
    
    await this.sendEmail({
      to,
      subject: 'Reset Your Password - ODAVL Studio',
      html,
      text: this.htmlToText(html),
    });
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHtml(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ODAVL Studio</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name}! 👋</h2>
              <p>Welcome to <strong>${data.organizationName}</strong> on ODAVL Studio!</p>
              <p>You now have access to powerful code quality tools including:</p>
              <ul>
                <li>🔍 <strong>ODAVL Insight</strong> - ML-powered error detection</li>
                <li>🤖 <strong>ODAVL Autopilot</strong> - Self-healing code infrastructure</li>
                <li>🛡️ <strong>ODAVL Guardian</strong> - Pre-deploy testing & monitoring</li>
              </ul>
              <p>Ready to get started?</p>
              <a href="${data.loginUrl}" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ODAVL Studio. All rights reserved.</p>
              <p>Need help? Contact us at support@odavl.studio</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate invitation email HTML
   */
  private generateInvitationEmailHtml(data: InvitationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .info-box { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You've Been Invited!</h1>
            </div>
            <div class="content">
              <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on ODAVL Studio.</p>
              
              <div class="info-box">
                <p><strong>Your Role:</strong> ${data.role}</p>
                <p><strong>Expires:</strong> ${data.expiresAt.toLocaleDateString()}</p>
              </div>

              <p>ODAVL Studio provides AI-powered code quality tools for modern development teams.</p>
              
              <a href="${data.acceptUrl}" class="button">Accept Invitation</a>
              
              <p style="font-size: 14px; color: #6b7280;">
                This invitation will expire on ${data.expiresAt.toLocaleDateString()}. 
                If you don't want to join this organization, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ODAVL Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate subscription email HTML
   */
  private generateSubscriptionEmailHtml(data: SubscriptionEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Subscription Confirmed</h1>
            </div>
            <div class="content">
              <h2>Thank you, ${data.organizationName}!</h2>
              <p>Your subscription to the <strong>${data.plan}</strong> plan has been confirmed.</p>
              
              <div class="info-box">
                <p><strong>Plan:</strong> ${data.plan}</p>
                <p><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}/month</p>
                <p><strong>Next Billing Date:</strong> ${data.nextBillingDate.toLocaleDateString()}</p>
              </div>

              <p>You now have access to all ${data.plan} features. Visit your dashboard to get started.</p>
              
              <a href="${data.manageBillingUrl}" class="button">Manage Subscription</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ODAVL Studio. All rights reserved.</p>
              <p>Questions? Contact us at billing@odavl.studio</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate error alert email HTML
   */
  private generateErrorAlertEmailHtml(data: ErrorAlertEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #ef4444; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Error Alert</h1>
            </div>
            <div class="content">
              <h2>${data.organizationName}</h2>
              
              <div class="alert-box">
                <p><strong>Project:</strong> ${data.projectName}</p>
                <p><strong>Time Range:</strong> ${data.timeRange}</p>
              </div>

              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${data.errorCount}</div>
                  <div>Total Errors</div>
                </div>
                <div class="stat">
                  <div class="stat-number" style="color: #dc2626;">${data.criticalCount}</div>
                  <div>Critical</div>
                </div>
              </div>

              <p>ODAVL Insight has detected ${data.errorCount} errors in your project, including ${data.criticalCount} critical issues that require immediate attention.</p>
              
              <a href="${data.dashboardUrl}" class="button">View Dashboard</a>
              
              <p style="font-size: 14px; color: #6b7280;">
                Tip: Use ODAVL Autopilot to automatically fix common issues.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ODAVL Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate usage limit email HTML
   */
  private generateUsageLimitEmailHtml(data: UsageLimitEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .progress-bar { background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .progress-fill { background: #f59e0b; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Usage Alert</h1>
            </div>
            <div class="content">
              <h2>${data.organizationName}</h2>
              <p>You've reached <strong>${data.percentage}%</strong> of your ${data.limitType} limit.</p>
              
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${data.percentage}%">${data.percentage}%</div>
              </div>

              <div class="info-box">
                <p><strong>Current Usage:</strong> ${data.currentUsage.toLocaleString()}</p>
                <p><strong>Plan Limit:</strong> ${data.limit.toLocaleString()}</p>
                <p><strong>Remaining:</strong> ${(data.limit - data.currentUsage).toLocaleString()}</p>
              </div>

              <p>Consider upgrading your plan to avoid service interruption.</p>
              
              <a href="${data.upgradeUrl}" class="button">Upgrade Plan</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ODAVL Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate password reset email HTML
   */
  private generatePasswordResetEmailHtml(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your password for ODAVL Studio.</p>
              <p>Click the button below to create a new password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p style="font-size: 14px; color: #6b7280;">
                This link will expire in 1 hour. If you didn't request this reset, 
                please ignore this email and your password will remain unchanged.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ODAVL Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();
