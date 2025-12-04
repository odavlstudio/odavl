/**
 * Cookie Service Initializer
 * Initializes third-party services based on consent
 */

import { logger } from '@/lib/logger';
import { CookieConsent } from './cookie-consent-banner';

/**
 * Initialize services based on user consent
 */
export function initializeServices(consent: CookieConsent): void {
  logger.info('Initializing services with consent', { consent });

  // Always initialize necessary services
  initializeNecessaryServices();

  // Conditionally initialize based on consent
  if (consent.functional) {
    initializeFunctionalServices();
  }

  if (consent.analytics) {
    initializeAnalytics();
  }

  if (consent.marketing) {
    initializeMarketing();
  }
}

function initializeNecessaryServices(): void {
  // Session management, CSRF, authentication
  // These are already handled by Next.js/NextAuth
  logger.debug('Necessary services initialized');
}

function initializeFunctionalServices(): void {
  // Theme, language preferences
  logger.debug('Functional services initialized');

  // Restore saved preferences
  const theme = localStorage.getItem('theme');
  if (theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

function initializeAnalytics(): void {
  logger.debug('Analytics services initialized');

  // Initialize Google Analytics if gtag is available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });

    logger.info('Google Analytics consent granted');
  }
}

function initializeMarketing(): void {
  logger.debug('Marketing services initialized');

  // Initialize marketing pixels if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });

    logger.info('Marketing consent granted');
  }
}
