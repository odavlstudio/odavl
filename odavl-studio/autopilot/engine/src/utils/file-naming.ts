/**
 * File Naming Utilities
 * Helpers for creating human-readable, sortable filenames
 */

/**
 * Format timestamp as filename-safe string: YYYY-MM-DDTHH-mm-ss
 * Example: 2024-11-24T14-30-45
 */
export function formatTimestampForFilename(date: Date = new Date()): string {
  return date
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, '-');
}

/**
 * Sanitize string for use in filename (remove special chars)
 * Example: "fix-typescript-errors!" → "fix-typescript-errors"
 */
export function sanitizeForFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50); // Max 50 chars
}

/**
 * Generate human-readable run ID with timestamp and optional recipe name
 * Format: YYYY-MM-DDTHH-mm-ss-recipe-name
 * Example: 2024-11-24T14-30-45-fix-typescript-errors
 * 
 * @param recipeName - Optional recipe name to include
 * @returns Human-readable run ID
 */
export function generateRunId(recipeName?: string): string {
  const timestamp = formatTimestampForFilename();

  if (recipeName) {
    const sanitized = sanitizeForFilename(recipeName);
    return `${timestamp}-${sanitized}`;
  }

  return timestamp;
}

/**
 * Parse run ID to extract timestamp and recipe name
 * Example: "2024-11-24T14-30-45-fix-typescript-errors" → { timestamp: Date, recipeName: "fix-typescript-errors" }
 */
export function parseRunId(runId: string): { timestamp: Date | null; recipeName: string | null } {
  // Try new format first: YYYY-MM-DDTHH-mm-ss-recipe-name
  const match = runId.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})(?:-(.+))?$/);

  if (match) {
    const timestampStr = match[1].replace(/T/g, ' ').replace(/-/g, ':');
    const [date, time] = timestampStr.split(' ');
    const [year, month, day] = date.split(':');
    const [hour, minute, second] = time.split(':');

    const timestamp = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );

    return {
      timestamp,
      recipeName: match[2] || null
    };
  }

  // Fallback: Legacy format run-<timestamp>
  const legacyMatch = runId.match(/^run-(\d+)$/);
  if (legacyMatch) {
    const timestamp = new Date(parseInt(legacyMatch[1]));
    return { timestamp, recipeName: null };
  }

  return { timestamp: null, recipeName: null };
}

/**
 * Generate metrics filename with timestamp and run info
 * Format: YYYY-MM-DDTHH-mm-ss-recipe-name.json
 * Example: 2024-11-24T14-30-45-fix-typescript-errors.json
 */
export function generateMetricsFilename(runId: string): string {
  return `${runId}.json`;
}

/**
 * Generate ledger filename with timestamp
 * Format: YYYY-MM-DDTHH-mm-ss-recipe-name.json
 * Example: 2024-11-24T14-30-45-fix-typescript-errors.json
 */
export function generateLedgerFilename(runId: string): string {
  return `${runId}.json`;
}

/**
 * Generate undo snapshot filename with timestamp
 * Format: YYYY-MM-DDTHH-mm-ss.json
 * Example: 2024-11-24T14-30-45.json
 */
export function generateUndoFilename(): string {
  return `${formatTimestampForFilename()}.json`;
}

export default {
  formatTimestampForFilename,
  sanitizeForFilename,
  generateRunId,
  parseRunId,
  generateMetricsFilename,
  generateLedgerFilename,
  generateUndoFilename
};
