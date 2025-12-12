/**
 * @fileoverview Swift detector suite - exports all Swift-specific detectors
 */

export { SwiftBaseDetector, type SwiftDetectorOptions, type SwiftIssue } from './swift-base-detector';
export { SwiftLintDetector } from './swiftlint-detector';

// DISABLED for Wave 7: Moved to broken/ due to literal \n corruption
// Stub classes to maintain API compatibility
export class MemoryDetector { detect() { return []; } }
export class OptionalsDetector { detect() { return []; } }
export class ConcurrencyDetector { detect() { return []; } }
