/**
 * error-parser.ts
 * Parses error messages from build/runtime output and extracts structured data
 */

export interface ParsedError {
    timestamp: string;
    project: string;
    file: string;
    line: number;
    type: string;
    message: string;
}

export class ErrorParser {
    /**
     * Parse error text and extract file, line, type, message
     */
    static parse(errorText: string, project = "odavl-website-v2"): ParsedError | null {
        // Pattern 1: TypeScript/ESLint format: "path/to/file.ts(line,col): Error: message"
        const tsPattern = /([^\s]+)\((\d+),\d+\):\s*(\w+):\s*(.+)/;
        const tsMatch = tsPattern.exec(errorText);

        if (tsMatch) {
            return {
                timestamp: new Date().toISOString(),
                project,
                file: tsMatch[1],
                line: Number.parseInt(tsMatch[2], 10),
                type: tsMatch[3],
                message: tsMatch[4].trim(),
            };
        }

        // Pattern 2: Standard Error format: "Error: message at file:line:col"
        const stackPattern = /(\w+Error):\s*(.+?)\s+at\s+(.+?):(\d+):\d+/;
        const stackMatch = stackPattern.exec(errorText);

        if (stackMatch) {
            return {
                timestamp: new Date().toISOString(),
                project,
                file: stackMatch[3],
                line: Number.parseInt(stackMatch[4], 10),
                type: stackMatch[1],
                message: stackMatch[2].trim(),
            };
        }

        // Pattern 3: Next.js format: "file:line:col - error message"
        const nextPattern = /(.+?):(\d+):\d+\s*-\s*(.+?):\s*(.+)/;
        const nextMatch = nextPattern.exec(errorText);

        if (nextMatch) {
            return {
                timestamp: new Date().toISOString(),
                project,
                file: nextMatch[1],
                line: Number.parseInt(nextMatch[2], 10),
                type: nextMatch[3],
                message: nextMatch[4].trim(),
            };
        }

        return null;
    }
}
