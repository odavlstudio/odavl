/**
 * Java Detector Index
 * Phase 2 - Week 10: Java Language Support
 */

// Detectors
export { JavaComplexityDetector } from './java-complexity-detector.js';
export { JavaStreamDetector } from './java-stream-detector.js';
export { JavaExceptionDetector } from './java-exception-detector.js';
export { JavaMemoryDetector } from './java-memory-detector.js';
export { JavaSpringDetector } from './java-spring-detector.js';

// Base
export { BaseJavaDetector } from './base-java-detector.js';

// Types
export interface JavaIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    code?: string;
    recommendation?: string;
    codeSnippet?: string;
    autoFix?: {
        description: string;
        replacement: string;
    };
}

export interface JavaClass {
    name: string;
    modifiers: string[];
    methods: JavaMethod[];
    fields: JavaField[];
    isInterface: boolean;
    isEnum: boolean;
    isAnnotation: boolean;
}

export interface JavaMethod {
    name: string;
    modifiers: string[];
    parameters: JavaParameter[];
    returnType: string;
    annotations: string[];
}

export interface JavaField {
    name: string;
    type: string;
    modifiers: string[];
}

export interface JavaParameter {
    name: string;
    type: string;
}
