/**
 * Stack Frame data model for ODAVL Insight Stack Analyzer
 */

export interface StackFrame {
    file: string;
    line: number;
    function?: string;
    type: string;
    message: string;
    context?: string[];
    timestamp: string;
}

export interface StackAnalysis {
    frames: StackFrame[];
    totalFrames: number;
    analyzedAt: string;
}
