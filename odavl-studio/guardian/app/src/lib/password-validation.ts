/**
 * Password Validation Utility
 * 
 * Week 12: Beta Launch - Security Enhancement
 * 
 * Provides password strength validation and complexity requirements.
 */

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    score: number; // 0-100
}

/**
 * Password complexity requirements
 */
export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Validate password against complexity requirements
 * @param password - Password to validate
 * @returns PasswordValidationResult
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    } else {
        score += 20;
    }

    // Check maximum length
    if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
        errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
    }

    // Check for uppercase letters
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
        score += 20;
    }

    // Check for lowercase letters
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
        score += 20;
    }

    // Check for numbers
    if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    } else if (/[0-9]/.test(password)) {
        score += 20;
    }

    // Check for special characters
    const specialCharsRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !specialCharsRegex.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*...)');
    } else if (specialCharsRegex.test(password)) {
        score += 20;
    }

    // Bonus points for length
    if (password.length >= 12) {
        score += 10;
    }
    if (password.length >= 16) {
        score += 10;
    }

    // Determine strength
    let strength: PasswordValidationResult['strength'] = 'weak';
    if (score >= 90) {
        strength = 'very-strong';
    } else if (score >= 70) {
        strength = 'strong';
    } else if (score >= 50) {
        strength = 'medium';
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score: Math.min(100, score),
    };
}

/**
 * Check if password contains common patterns (weak passwords)
 * @param password - Password to check
 * @returns boolean - True if password is weak
 */
export function isCommonPassword(password: string): boolean {
    const commonPatterns = [
        /^password/i,
        /^123456/,
        /^qwerty/i,
        /^abc123/i,
        /^letmein/i,
        /^welcome/i,
        /^admin/i,
        /^guardian/i,
        /^test/i,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
}

/**
 * Check if password contains user information (email, name)
 * @param password - Password to check
 * @param userInfo - User information to check against
 * @returns boolean - True if password contains user info
 */
export function containsUserInfo(
    password: string,
    userInfo: { email?: string; name?: string }
): boolean {
    const lowerPassword = password.toLowerCase();

    if (userInfo.email) {
        const emailParts = userInfo.email.split('@')[0].toLowerCase();
        if (lowerPassword.includes(emailParts)) {
            return true;
        }
    }

    if (userInfo.name) {
        const nameParts = userInfo.name.toLowerCase().split(' ');
        if (nameParts.some(part => part.length > 2 && lowerPassword.includes(part))) {
            return true;
        }
    }

    return false;
}

/**
 * Generate password strength color for UI
 * @param strength - Password strength
 * @returns CSS color class
 */
export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
    switch (strength) {
        case 'very-strong':
            return 'text-green-600';
        case 'strong':
            return 'text-green-500';
        case 'medium':
            return 'text-yellow-500';
        case 'weak':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

/**
 * Get password strength label
 * @param strength - Password strength
 * @returns Human-readable strength label
 */
export function getStrengthLabel(strength: PasswordValidationResult['strength']): string {
    switch (strength) {
        case 'very-strong':
            return 'Very Strong';
        case 'strong':
            return 'Strong';
        case 'medium':
            return 'Medium';
        case 'weak':
            return 'Weak';
        default:
            return 'Unknown';
    }
}
