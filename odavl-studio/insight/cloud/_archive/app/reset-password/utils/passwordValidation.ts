/**
 * Password validation utilities
 */

export interface PasswordStrengthResult {
  score: number;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else if (password.length > 0) {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else if (password.length > 0) {
    feedback.push('One uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else if (password.length > 0) {
    feedback.push('One lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else if (password.length > 0) {
    feedback.push('One number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else if (password.length > 0) {
    feedback.push('One special character');
  }

  return { score, feedback };
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

export function validatePasswordStrength(score: number): string | null {
  if (score < 5) {
    return 'Password does not meet requirements';
  }
  return null;
}
