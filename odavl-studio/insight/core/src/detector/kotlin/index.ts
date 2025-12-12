/**
 * @fileoverview Kotlin detector suite - exports all Kotlin-specific detectors
 */

export { KotlinBaseDetector, type KotlinDetectorOptions, type KotlinIssue } from './kotlin-base-detector';
export { DetektDetector } from './detekt-detector';

// DISABLED for Wave 7: Moved to broken/ due to literal \n corruption
// Stub classes to maintain API compatibility
export class CoroutinesDetector { detect() { return []; } }
export class NullabilityDetector { detect() { return []; } }
export class InteropDetector { detect() { return []; } }
