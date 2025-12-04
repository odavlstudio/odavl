// ODAVL CLI logPhase implementation
/**
 * Logs phase activity for audit and debugging.
 * @param phase - The phase name
 * @param message - The log message
 * @param level - Log level (optional)
 */
export function logPhase(phase: string, message: string, level: string = "info") {
    // Simple console log for now; can be extended for file or structured logging
    const tag = `[${phase}]`;
    if (level === "error") {
        console.error(tag, message);
    } else if (level === "warn") {
        console.warn(tag, message);
    } else {
        console.log(tag, message);
    }
}
