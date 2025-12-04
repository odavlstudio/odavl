/**
 * Email Service using Nodemailer
 * Supports SMTP configuration for sending transactional emails
 */

import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 * Called automatically on first email send
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST is not configured');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send email using configured SMTP service
 * @param options Email options (to, subject, html, text)
 * @throws Error if SMTP is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!process.env.SMTP_HOST) {
    logger.warn('SMTP not configured, skipping email send', { subject: options.subject });
    return;
  }

  try {
    const transport = getTransporter();

    const from = options.from || `${process.env.SMTP_FROM_NAME || 'ODAVL Studio'} <${process.env.SMTP_FROM || 'noreply@odavl.com'}>`;

    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });

    logger.success(`Email sent successfully to ${options.to}`, { to: options.to, subject: options.subject });
  } catch (error) {
    logger.error('Failed to send email', error as Error, { subject: options.subject });
    throw error;
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Verify SMTP connection
 * @returns true if connection is successful
 */
export async function verifyEmailConnection(): Promise<boolean> {
  if (!process.env.SMTP_HOST) {
    return false;
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    logger.success('SMTP connection verified');
    return true;
  } catch (error) {
    logger.error('SMTP connection failed', error as Error);
    return false;
  }
}
