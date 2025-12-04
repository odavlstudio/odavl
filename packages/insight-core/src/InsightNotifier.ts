/**
 * InsightNotifier.ts
 * Formats and prints colored terminal notifications for errors
 */

import type { ParsedError } from "./error-parser";
import { logger } from './utils/logger';

export class InsightNotifier {
    /**
     * Print formatted error message to terminal
     */
    static notify(error: ParsedError): void {
        const RED = "\x1b[31m";
        const YELLOW = "\x1b[33m";
        const RESET = "\x1b[0m";
        const BOLD = "\x1b[1m";

        logger.debug(
            `\n${BOLD}🧠 [ODAVL Insight]${RESET} ${RED}Error detected${RESET} in ${YELLOW}${error.file}${RESET} line ${error.line}`
        );
        logger.debug(`${BOLD}→${RESET} ${error.type}: ${error.message}\n`);
    }
}
