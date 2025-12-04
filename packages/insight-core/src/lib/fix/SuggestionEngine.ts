import type { RootCause } from "../root/RootCauseDetector";
import { FixPatterns } from "./FixPatterns";

export interface FixSuggestion {
    error: string;
    suggestion: string;
    confidence: number;
}

export class SuggestionEngine {
    private readonly patterns: FixPatterns;

    constructor() {
        this.patterns = new FixPatterns();
    }

    generateSuggestion(rootCause: RootCause): FixSuggestion {
        const errorType = this.detectErrorType(rootCause.error);
        const pattern = this.patterns.getPattern(errorType);

        const suggestion = pattern
            ? this.customizeSuggestion(rootCause, pattern.template)
            : rootCause.suggestion;

        return {
            error: rootCause.error,
            suggestion,
            confidence: rootCause.confidence,
        };
    }

    private detectErrorType(error: string): string {
        if (error.includes("is not defined") || error.includes("not found")) {
            return "ReferenceError";
        }
        if (error.includes("Cannot find module") || error.includes("Module not found")) {
            return "ModuleNotFound";
        }
        if (error.includes("Cannot read property") || error.includes("undefined")) {
            return "TypeError";
        }
        return "Unknown";
    }

    private customizeSuggestion(rootCause: RootCause, template: string): string {
        return rootCause.suggestion || template;
    }
}
