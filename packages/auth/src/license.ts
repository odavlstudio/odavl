/**
 * License Key System
 * Sprint 3: Billing Infrastructure - Task 3.4
 * 
 * Format: ODAVL-{TIER}-{RANDOM}-{CHECKSUM}
 * Example: ODAVL-PRO-X7K9M2-A8F3
 */

import crypto from 'crypto';
import type { SubscriptionTier } from '@odavl/types';

const LICENSE_SECRET = process.env.LICENSE_SECRET || 'change-this-in-production';

/**
 * Generate a license key for a user and tier
 */
export function generateLicenseKey(
  userId: string,
  tier: SubscriptionTier
): string {
  // Generate random segment (6 chars, alphanumeric uppercase)
  const randomSegment = generateRandomString(6);

  // Create payload for HMAC
  const payload = `${userId}:${tier}:${randomSegment}`;

  // Generate checksum (first 4 chars of HMAC-SHA256)
  const checksum = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();

  // Format: ODAVL-{TIER}-{RANDOM}-{CHECKSUM}
  return `ODAVL-${tier}-${randomSegment}-${checksum}`;
}

/**
 * Validate a license key and extract information
 */
export function validateLicenseKey(key: string): {
  valid: boolean;
  tier?: SubscriptionTier;
  error?: string;
} {
  // Check format: ODAVL-{TIER}-{RANDOM}-{CHECKSUM}
  const parts = key.split('-');

  if (parts.length !== 4) {
    return { valid: false, error: 'Invalid format' };
  }

  const [prefix, tier, random, checksum] = parts;

  // Validate prefix
  if (prefix !== 'ODAVL') {
    return { valid: false, error: 'Invalid prefix' };
  }

  // Validate tier
  if (!['FREE', 'PRO', 'ENTERPRISE'].includes(tier)) {
    return { valid: false, error: 'Invalid tier' };
  }

  // Validate random segment (6 chars, alphanumeric)
  if (!/^[A-Z0-9]{6}$/.test(random)) {
    return { valid: false, error: 'Invalid random segment' };
  }

  // Validate checksum (4 chars, hex)
  if (!/^[A-F0-9]{4}$/.test(checksum)) {
    return { valid: false, error: 'Invalid checksum' };
  }

  return {
    valid: true,
    tier: tier as SubscriptionTier,
  };
}

/**
 * Verify license key checksum (for activation)
 * This requires the userId to verify the HMAC
 */
export function verifyLicenseKey(
  key: string,
  userId: string
): {
  valid: boolean;
  tier?: SubscriptionTier;
  error?: string;
} {
  const validation = validateLicenseKey(key);

  if (!validation.valid) {
    return validation;
  }

  const [, tier, random, providedChecksum] = key.split('-');

  // Recreate payload and checksum
  const payload = `${userId}:${tier}:${random}`;
  const expectedChecksum = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();

  if (providedChecksum !== expectedChecksum) {
    return { valid: false, error: 'Invalid checksum (key may be forged)' };
  }

  return {
    valid: true,
    tier: tier as SubscriptionTier,
  };
}

/**
 * Activate a license key for a user
 */
export async function activateLicense(
  key: string,
  userId: string,
  prisma: any // PrismaClient type
): Promise<{
  success: boolean;
  subscription?: any;
  error?: string;
}> {
  // Verify key
  const verification = verifyLicenseKey(key, userId);

  if (!verification.valid) {
    return {
      success: false,
      error: verification.error || 'Invalid license key',
    };
  }

  // Check if key already used
  const existingSubscription = await prisma.subscription.findFirst({
    where: { licenseKey: key },
  });

  if (existingSubscription) {
    return {
      success: false,
      error: 'License key already activated',
    };
  }

  // Get or create subscription
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const tier = verification.tier!;
  const tierLimits = getTierLimits(tier);

  if (subscription) {
    // Update existing subscription
    subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        tier,
        licenseKey: key,
        ...tierLimits,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      },
    });
  } else {
    // Create new subscription
    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        licenseKey: key,
        ...tierLimits,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      },
    });
  }

  return {
    success: true,
    subscription,
  };
}

/**
 * Deactivate a license key
 */
export async function deactivateLicense(
  licenseKey: string,
  prisma: any
): Promise<{
  success: boolean;
  error?: string;
}> {
  const subscription = await prisma.subscription.findFirst({
    where: { licenseKey },
  });

  if (!subscription) {
    return {
      success: false,
      error: 'License key not found',
    };
  }

  // Downgrade to FREE tier
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      tier: 'free',
      licenseKey: null,
      ...getTierLimits('free'),
    },
  });

  return { success: true };
}

/**
 * Generate bulk license keys (for enterprise/resellers)
 */
export function generateBulkLicenseKeys(
  tier: SubscriptionTier,
  count: number,
  prefix: string = 'BULK'
): string[] {
  const keys: string[] = [];

  for (let i = 0; i < count; i++) {
    const random = generateRandomString(6);
    const payload = `${prefix}:${i}:${tier}:${random}`;
    const checksum = crypto
      .createHmac('sha256', LICENSE_SECRET)
      .update(payload)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();

    keys.push(`ODAVL-${tier}-${random}-${checksum}`);
  }

  return keys;
}

/**
 * Parse license key to extract tier
 */
export function getLicenseKeyTier(key: string): SubscriptionTier | null {
  const validation = validateLicenseKey(key);
  return validation.valid ? validation.tier! : null;
}

// Helper Functions

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}

function getTierLimits(tier: SubscriptionTier) {
  switch (tier) {
    case 'free':
      return {
        maxProjects: 3,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 1,
      };
    case 'pro':
      return {
        maxProjects: 10,
        maxAnalysesPerMonth: 1000,
        maxStorageGB: 10,
      };
    case 'team':
      return {
        maxProjects: 20,
        maxAnalysesPerMonth: 5000,
        maxStorageGB: 50,
      };
    case 'enterprise':
      return {
        maxProjects: -1, // unlimited
        maxAnalysesPerMonth: -1, // unlimited
        maxStorageGB: 100,
      };
  }
}
