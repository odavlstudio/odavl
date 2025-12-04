export interface FixPattern {
    errorType: string;
    template: string;
    priority: number;
}

export class FixPatterns {
    private readonly patterns: Map<string, FixPattern>;

    constructor() {
        this.patterns = new Map([
            ["ReferenceError", { errorType: "ReferenceError", template: "Check if the variable or component is imported correctly.", priority: 1 }],
            ["ImportError", { errorType: "ImportError", template: "Install or import the missing module.", priority: 2 }],
            ["TypeError", { errorType: "TypeError", template: "Verify the variable type or function parameters.", priority: 3 }],
            ["SyntaxError", { errorType: "SyntaxError", template: "Fix syntax issues in the code.", priority: 4 }],
            ["DependencyMismatch", { errorType: "DependencyMismatch", template: "Run pnpm update <package>.", priority: 5 }],
            ["ModuleNotFound", { errorType: "ModuleNotFound", template: "Install the missing dependency or fix the import path.", priority: 2 }],
        ]);
    }

    getPattern(errorType: string): FixPattern | undefined {
        return this.patterns.get(errorType);
    }

    getAllPatterns(): FixPattern[] {
        return Array.from(this.patterns.values()).sort((a, b) => a.priority - b.priority);
    }
}
