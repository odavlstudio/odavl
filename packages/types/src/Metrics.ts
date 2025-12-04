// @generated stub
/**
 * Metrics interface for ODAVL CLI phases
 */
export interface Metrics {
    phase: string;
    duration: number;
    status: "ok" | "fail";
    eslintWarnings: number;
    typeErrors: number;
}

