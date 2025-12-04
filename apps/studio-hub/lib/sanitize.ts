/**
 * Input Sanitization & Validation Utilities for ODAVL Studio Hub
 *
 * Prevents XSS, SQL Injection, and other input-based attacks.
 *
 * Features:
 * - HTML escaping for XSS prevention
 * - SQL injection prevention (via Prisma)
 * - Path traversal prevention
 * - Email validation
 * - URL validation
 * - Command injection prevention
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "code", "pre", "p", "br"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Escape HTML special characters
 * Use this for user-generated content displayed in HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize URL
 * Only allows https:// and http:// protocols
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Prevent path traversal attacks
 * Removes ../, ..\, and other path traversal patterns
 */
export function sanitizePath(path: string): string {
  // Remove path traversal patterns
  const sanitized = path
    .replace(/\.\./g, "")
    .replace(/[\/\\]{2,}/g, "/")
    .trim();

  // Remove leading slashes
  return sanitized.replace(/^[\/\\]+/, "");
}

/**
 * Sanitize filename (for file uploads)
 * Removes special characters and limits length
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[\/\\]/).pop() || "file";

  // Only allow alphanumeric, dash, underscore, and dot
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  return sanitized.slice(0, 255);
}

/**
 * Prevent command injection
 * Escapes shell metacharacters
 */
export function sanitizeShellArg(arg: string): string {
  // Escape shell metacharacters
  return arg.replace(/([;&|`$()\\<>!])/g, "\\$1");
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJson<T = unknown>(input: string): T | null {
  try {
    const parsed = JSON.parse(input);

    // Reject if contains dangerous patterns
    const stringified = JSON.stringify(parsed);
    if (
      stringified.includes("<script") ||
      stringified.includes("javascript:") ||
      stringified.includes("onerror=")
    ) {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize user input (general purpose)
 * Trims whitespace, removes null bytes, limits length
 */
export function sanitizeInput(
  input: string,
  maxLength: number = 1000
): string {
  return input
    .replace(/\0/g, "") // Remove null bytes
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate GitHub repository URL
 */
export function sanitizeGithubUrl(url: string): string | null {
  const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/i;

  if (!githubRegex.test(url)) {
    return null;
  }

  return url;
}

/**
 * Sanitize workspace name (alphanumeric + dash/underscore only)
 */
export function sanitizeWorkspaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 50);
}

/**
 * Middleware: Sanitize request body
 * Use this in API routes to auto-sanitize all string fields
 */
export function sanitizeRequestBody<T extends Record<string, unknown>>(
  body: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
