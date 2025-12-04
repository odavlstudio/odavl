/**
 * @odavl-studio/email
 * Email service for ODAVL Studio with verification and password reset
 */

import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';

/**
 * Email service configuration
 */
export interface EmailConfig {
  /** SMTP host (e.g., smtp.gmail.com) */
  host: string;
  /** SMTP port (587 for TLS, 465 for SSL) */
  port: number;
  /** Use SSL (true for port 465, false for 587) */
  secure: boolean;
  /** SMTP authentication credentials */
  auth: {
    user: string;
    pass: string;
  };
  /** From address configuration */
  from: {
    name: string;
    email: string;
  };
}

/**
 * Options for sending an email
 */
export interface SendEmailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject */
  subject: string;
  /** HTML email body */
  html: string;
  /** Plain text email body (auto-generated if not provided) */
  text?: string;
}

/**
 * Email service for sending transactional emails
 * Supports verification, password reset, and welcome emails
 */
export class EmailService {
  private transporter: Transporter;
  private from: { name: string; email: string };

  /**
   * Create a new email service instance
   * @param config Email service configuration
   */
  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    this.from = config.from;
  }

  /**
   * Send an email
   * @param options Email options (to, subject, html, text)
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const mailOptions: SendMailOptions = {
      from: `"${this.from.name}" <${this.from.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.stripHtml(options.html),
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send email verification link to user
   * @param to User email address
   * @param name User name
   * @param token Verification token
   * @param baseUrl Base URL of application
   */
  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
    baseUrl: string
  ): Promise<void> {
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    await this.sendEmail({
      to,
      subject: 'Verify your ODAVL account',
      html: this.getVerificationEmailTemplate(name, verifyUrl),
    });
  }

  /**
   * Send password reset link to user
   * @param to User email address
   * @param name User name
   * @param token Password reset token
   * @param baseUrl Base URL of application
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
    baseUrl: string
  ): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await this.sendEmail({
      to,
      subject: 'Reset your ODAVL password',
      html: this.getPasswordResetTemplate(name, resetUrl),
    });
  }

  /**
   * Send welcome email after email verification
   * @param to User email address
   * @param name User name
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to ODAVL Studio!',
      html: this.getWelcomeTemplate(name),
    });
  }

  /**
   * Verify SMTP connection
   * @returns True if connection successful, false otherwise
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Get HTML template for email verification
   */
  private getVerificationEmailTemplate(name: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .link-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
              font-size: 14px;
              color: #6b7280;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              background: #f9fafb;
              color: #6b7280;
              font-size: 14px;
            }
            .footer p {
              margin: 5px 0;
            }
            .divider {
              height: 1px;
              background: #e5e7eb;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 ODAVL Studio</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Autonomous Code Quality Platform</p>
            </div>
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              <p>Thanks for signing up for ODAVL Studio. We're excited to have you on board!</p>
              <p>Please verify your email address to activate your account and start using our platform:</p>
              <center>
                <a href="${verifyUrl}" class="button">✅ Verify Email Address</a>
              </center>
              <div class="divider"></div>
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link in your browser:</p>
              <div class="link-box">${verifyUrl}</div>
              <p style="font-size: 14px; color: #6b7280;">
                ⏱️ This link will expire in <strong>24 hours</strong>.
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p><strong>&copy; 2025 ODAVL Studio</strong></p>
              <p>Autonomous Code Quality for Modern Development</p>
              <p style="margin-top: 15px;">Questions? Contact us at <a href="mailto:support@odavl.com" style="color: #667eea;">support@odavl.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get HTML template for password reset
   */
  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .link-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
              font-size: 14px;
              color: #6b7280;
            }
            .warning-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              background: #f9fafb;
              color: #6b7280;
              font-size: 14px;
            }
            .footer p {
              margin: 5px 0;
            }
            .divider {
              height: 1px;
              background: #e5e7eb;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 ODAVL Studio</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <center>
                <a href="${resetUrl}" class="button">🔑 Reset Password</a>
              </center>
              <div class="divider"></div>
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link in your browser:</p>
              <div class="link-box">${resetUrl}</div>
              <p style="font-size: 14px; color: #6b7280;">
                ⏱️ This link will expire in <strong>1 hour</strong>.
              </p>
              <div class="warning-box">
                <p style="margin: 0; font-weight: 600; color: #92400e;">⚠️ Security Notice</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">
                  If you didn't request this password reset, please ignore this email. 
                  Your password will remain unchanged.
                </p>
              </div>
            </div>
            <div class="footer">
              <p><strong>&copy; 2025 ODAVL Studio</strong></p>
              <p>Autonomous Code Quality for Modern Development</p>
              <p style="margin-top: 15px;">Questions? Contact us at <a href="mailto:support@odavl.com" style="color: #667eea;">support@odavl.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get HTML template for welcome email
   */
  private getWelcomeTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ODAVL</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .feature {
              background: #f9fafb;
              border-left: 4px solid #667eea;
              border-radius: 6px;
              padding: 20px;
              margin: 15px 0;
            }
            .feature h3 {
              margin: 0 0 10px 0;
              color: #667eea;
              font-size: 18px;
            }
            .feature p {
              margin: 0;
              font-size: 14px;
              color: #6b7280;
            }
            .steps {
              background: #eff6ff;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .steps h3 {
              margin-top: 0;
              color: #1e40af;
            }
            .steps ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .steps li {
              margin: 8px 0;
              color: #1e40af;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              background: #f9fafb;
              color: #6b7280;
              font-size: 14px;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ODAVL!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your account is now active</p>
            </div>
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              <p>Your ODAVL Studio account is now active and ready to use. Here's what you can do with our platform:</p>

              <div class="feature">
                <h3>🔍 ODAVL Insight</h3>
                <p>Detect code issues with 12 specialized detectors across TypeScript, Python, and Java. Get ML-powered suggestions for fixes.</p>
              </div>

              <div class="feature">
                <h3>🤖 ODAVL Autopilot</h3>
                <p>Self-healing code infrastructure with the O-D-A-V-L cycle. Automatically fix issues while you sleep.</p>
              </div>

              <div class="feature">
                <h3>🛡️ ODAVL Guardian</h3>
                <p>Pre-deploy testing and quality monitoring. Catch issues before they reach production.</p>
              </div>

              <div class="steps">
                <h3>🚀 Get Started in 3 Steps:</h3>
                <ul>
                  <li>Install the ODAVL VS Code extension</li>
                  <li>Run your first code analysis</li>
                  <li>Check the dashboard for insights and metrics</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">Need help getting started? Check out our <a href="https://docs.odavl.com" style="color: #667eea;">documentation</a> or contact our support team.</p>
            </div>
            <div class="footer">
              <p><strong>&copy; 2025 ODAVL Studio</strong></p>
              <p>Autonomous Code Quality for Modern Development</p>
              <p style="margin-top: 15px;">Need help? Email <a href="mailto:support@odavl.com" style="color: #667eea;">support@odavl.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Strip HTML tags from text
   * Used to generate plain text version of emails
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export types for use in other packages
export type { Transporter, SendMailOptions };
