/**
 * @fileoverview PHP detector suite - exports all PHP-specific detectors
 */

export { PhpBaseDetector, type PhpDetectorOptions, type PhpIssue } from './php-base-detector';
export { PHPStanDetector } from './phpstan-detector';
export { SecurityDetector } from './security-detector';
export { PerformanceDetector } from './performance-detector';
