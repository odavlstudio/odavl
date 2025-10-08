// ODAVL-WAVE-X9-INJECT: Newsletter Configuration
// @odavl-governance: MARKETING-SAFE mode - Email marketing setup

export interface NewsletterConfig {
  enabled: boolean;
  provider: string;
  apiEndpoint: string;
  doubleOptIn: boolean;
  lists: {
    general: string;
    developers: string;
    announcements: string;
  };
}

export const NEWSLETTER_CONFIG: NewsletterConfig = {
  enabled: true,
  provider: 'mailchimp', // Can be configured for different providers
  apiEndpoint: '/api/newsletter/subscribe',
  doubleOptIn: true,
  lists: {
    general: 'odavl-general',
    developers: 'odavl-developers', 
    announcements: 'odavl-announcements'
  }
};

export const NEWSLETTER_CONTENT = {
  hero: {
    title: 'Stay Updated with ODAVL',
    subtitle: 'Get the latest insights on autonomous code quality, AI-powered development tools, and industry best practices.',
    placeholder: 'Enter your email address',
    buttonText: 'Subscribe',
    frequencyText: 'Weekly newsletter • No spam • Unsubscribe anytime'
  },
  benefits: [
    'Latest ODAVL features and updates',
    'Code quality best practices',
    'AI automation insights',
    'Community showcase stories',
    'Early access to new tools'
  ],
  privacyText: 'We respect your privacy. Your email will only be used for ODAVL updates.',
  successMessage: 'Thanks for subscribing! Check your email to confirm your subscription.',
  errorMessage: 'Something went wrong. Please try again later.'
};