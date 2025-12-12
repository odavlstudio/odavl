/**
 * @fileoverview Go detector suite - exports all Go-specific detectors
 */

export { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
export { GolangciLintDetector } from './golangci-lint-detector';
export { StaticcheckDetector } from './staticcheck-detector';
export { GoroutineLeakDetector } from './goroutine-leak-detector';
export { ChannelMisuseDetector } from './channel-misuse-detector';
export { ContextMisuseDetector } from './context-misuse-detector';
export { ErrorHandlingDetector } from './error-handling-detector';
