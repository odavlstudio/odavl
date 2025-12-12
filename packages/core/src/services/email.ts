/**
 * Email Service (Stub)
 * 
 * Note: This is a placeholder. Email functionality should be implemented
 * at the application level (apps/studio-hub/lib/email/sender.ts).
 * 
 * To enable this service:
 * 1. Install: pnpm add nodemailer @react-email/render @types/nodemailer
 * 2. Implement EmailService class with nodemailer integration
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  component: any;
}

/**
 * Stub EmailService class
 * Replace with actual implementation when nodemailer is installed
 */
export class EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    throw new Error('EmailService not implemented in packages/core. Use app-specific email service.');
  }

  async sendTemplatedEmail(
    template: EmailTemplate,
    to: string | string[],
    data: Record<string, any>
  ): Promise<void> {
    throw new Error('EmailService not implemented in packages/core. Use app-specific email service.');
  }
}

export const emailService = new EmailService();
