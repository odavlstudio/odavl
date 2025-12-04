/**
 * Account Lockout Middleware
 * 
 * Week 12: Beta Launch - Security Enhancement
 * 
 * Implements account lockout after failed login attempts.
 * - Locks account for 15 minutes after 5 failed attempts
 * - Tracks failed attempts in database
 * - Resets counter on successful login
 */

import { prisma } from '@/lib/prisma';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if account is currently locked
 * @param email - User email
 * @returns { isLocked: boolean; remainingTime?: number }
 */
export async function isAccountLocked(email: string): Promise<{
    isLocked: boolean;
    remainingTime?: number;
}> {
    const member = await prisma.member.findFirst({
        where: { email },
        select: {
            lockedUntil: true,
            failedLoginAttempts: true,
        },
    });

    if (!member) {
        return { isLocked: false };
    }

    // Check if account is locked
    if (member.lockedUntil && member.lockedUntil > new Date()) {
        const remainingTime = member.lockedUntil.getTime() - Date.now();
        return {
            isLocked: true,
            remainingTime,
        };
    }

    // Lockout expired - reset counter
    if (member.lockedUntil && member.lockedUntil <= new Date()) {
        await prisma.member.updateMany({
            where: { email },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
    }

    return { isLocked: false };
}

/**
 * Record a failed login attempt
 * @param email - User email
 * @returns { locked: boolean; attemptsRemaining: number }
 */
export async function recordFailedLoginAttempt(email: string): Promise<{
    locked: boolean;
    attemptsRemaining: number;
}> {
    const member = await prisma.member.findFirst({
        where: { email },
        select: {
            id: true,
            failedLoginAttempts: true,
        },
    });

    if (!member) {
        return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }

    const newAttemptCount = (member.failedLoginAttempts || 0) + 1;

    // Check if we should lock the account
    if (newAttemptCount >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);

        await prisma.member.update({
            where: { id: member.id },
            data: {
                failedLoginAttempts: newAttemptCount,
                lockedUntil: lockoutUntil,
            },
        });

        return {
            locked: true,
            attemptsRemaining: 0,
        };
    }

    // Increment failed attempts
    await prisma.member.update({
        where: { id: member.id },
        data: {
            failedLoginAttempts: newAttemptCount,
        },
    });

    return {
        locked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttemptCount,
    };
}

/**
 * Reset failed login attempts on successful login
 * @param email - User email
 */
export async function resetFailedLoginAttempts(email: string): Promise<void> {
    await prisma.member.updateMany({
        where: { email },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastActive: new Date(),
        },
    });
}

/**
 * Format remaining lockout time for display
 * @param remainingMs - Remaining time in milliseconds
 * @returns Human-readable time string
 */
export function formatLockoutTime(remainingMs: number): string {
    const minutes = Math.ceil(remainingMs / 60000);
    if (minutes === 1) {
        return '1 minute';
    }
    return `${minutes} minutes`;
}
