# @odavl-studio/email

Email service package for ODAVL Studio with support for email verification, password reset, and transactional emails.

## Features

- ✅ Email verification on registration
- ✅ Password reset flow
- ✅ Welcome emails
- ✅ Beautiful HTML templates
- ✅ Text fallback for email clients
- ✅ Nodemailer integration (SMTP)
- ✅ TypeScript support with full types
- ✅ Dual package (ESM + CJS)

## Installation

```bash
pnpm add @odavl-studio/email
```

## Usage

### Initialize Email Service

```typescript
import { EmailService } from '@odavl-studio/email';

const emailService = new EmailService({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
  from: {
    name: 'ODAVL Studio',
    email: 'noreply@odavl.com',
  },
});
```

### Send Verification Email

```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'verification-token-here',
  'https://odavl.com'
);
```

### Send Password Reset Email

```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'reset-token-here',
  'https://odavl.com'
);
```

### Send Welcome Email

```typescript
await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);
```

### Send Custom Email

```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Hello!</h1><p>Custom HTML content</p>',
  text: 'Hello! Custom text content',
});
```

### Verify Connection

```typescript
const isConnected = await emailService.verifyConnection();
if (isConnected) {
  console.log('✅ Email service ready');
} else {
  console.error('❌ Email service connection failed');
}
```

## Configuration

### Gmail Setup

1. Enable 2-factor authentication in your Google account
2. Generate an App Password:
   - Go to Google Account → Security → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password

3. Use in configuration:
```typescript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password', // 16-character app password
  }
}
```

### SendGrid Setup

```typescript
{
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: 'your-sendgrid-api-key',
  }
}
```

### Mailgun Setup

```typescript
{
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: 'postmaster@your-domain.mailgun.org',
    pass: 'your-mailgun-smtp-password',
  }
}
```

## Email Templates

All templates include:
- Responsive HTML design
- Beautiful styling with inline CSS
- Text fallback for non-HTML clients
- ODAVL branding
- Clear call-to-action buttons

### Verification Email Template
- Welcome message
- Verification link button
- Expiry notice (24 hours)
- Security note

### Password Reset Template
- Reset link button
- Expiry notice (1 hour)
- Strong security warning
- Ignore instructions if not requested

### Welcome Email Template
- Feature highlights
- Getting started guide
- Support contact info

## API Reference

### `EmailService`

#### Constructor

```typescript
constructor(config: EmailConfig)
```

#### Methods

##### `sendEmail(options: SendEmailOptions): Promise<void>`
Send a custom email.

##### `sendVerificationEmail(to, name, token, baseUrl): Promise<void>`
Send email verification link.

##### `sendPasswordResetEmail(to, name, token, baseUrl): Promise<void>`
Send password reset link.

##### `sendWelcomeEmail(to, name): Promise<void>`
Send welcome email after verification.

##### `verifyConnection(): Promise<boolean>`
Test SMTP connection.

## Environment Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@odavl.com
```

## Error Handling

```typescript
try {
  await emailService.sendVerificationEmail(...);
  console.log('Email sent successfully');
} catch (error) {
  console.error('Failed to send email:', error);
  // Handle error (log, retry, notify admin, etc.)
}
```

## Testing

### Development Mode

In development, emails are logged to console instead of being sent:

```typescript
// Set NODE_ENV=development
const emailService = new EmailService({
  // ... config
});

// Emails will be logged instead of sent
await emailService.sendVerificationEmail(...);
```

### Test Email Service

```bash
pnpm test
```

## Limits

### Gmail
- 500 emails per day (free)
- 2,000 emails per day (Workspace)

### SendGrid
- 100 emails per day (free)
- 40,000 emails per month ($15/month)

### Mailgun
- 1,000 emails per month ($15/month)

## Security Notes

- Never commit SMTP credentials to git
- Use app-specific passwords (not account passwords)
- Enable 2FA on email service accounts
- Rotate credentials regularly
- Monitor for suspicious activity
- Rate limit email endpoints

## License

MIT

## Support

For issues and questions, contact: support@odavl.com
