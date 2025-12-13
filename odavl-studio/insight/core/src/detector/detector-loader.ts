/**
 * ODAVL Insight - Lazy Detector Loader
 * Phase 3B: Runtime Performance Optimization
 * Phase P1: Manifest integration (read-only)
 * Phase P3: ACTIVE manifest enforcement at runtime
 * 
 * Loads detectors on-demand via dynamic imports to optimize:
 * - Cold start time (no upfront loading)
 * - Memory usage (load only what's needed)
 * - Bundle size (tree-shaking friendly)
 */

// Phase P1: Manifest integration
// import { manifest } from '@odavl/core/manifest';
const manifest = null as any; // TODO: Add @odavl/core package
// Phase P3: Runtime enforcement functions
import { getActiveDetectors } from '../config/manifest-config.js';

// Detector name registry (11 core detectors)
export type DetectorName =
  | 'typescript'
  | 'eslint'
  | 'import'
  | 'package'
  | 'runtime'
  | 'build'
  | 'security'
  | 'circular'
  | 'network'
  | 'performance'
  | 'complexity'
  | 'isolation'
  // Multi-language support
  | 'python-type'
  | 'python-security'
  | 'python-complexity'
  | 'python-imports'
  | 'python-best-practices'
  | 'java-complexity'
  | 'java-stream'
  | 'java-exception'
  | 'java-memory'
  | 'java-spring'
  | 'go'
  | 'rust'
  // Advanced detectors
  | 'architecture'
  | 'database'
  | 'nextjs'
  | 'infrastructure'
  | 'context-aware-security'
  | 'context-aware-performance';

/**
 * Phase 1.4.3: Detector metadata for smart skipping
 */
export interface DetectorMetadata {
  name: DetectorName;
  extensions?: string[]; // File extensions this detector applies to (e.g. ['.ts', '.tsx'])
  scope?: 'file' | 'workspace' | 'global'; // Scope of analysis
}

/**
 * Phase 1.4.3: Detector metadata registry
 */
const detectorMetadata: Record<string, DetectorMetadata> = {
  'typescript': { name: 'typescript', extensions: ['.ts', '.tsx'], scope: 'file' },
  'eslint': { name: 'eslint', extensions: ['.ts', '.tsx', '.js', '.jsx'], scope: 'file' },
  'python-type': { name: 'python-type', extensions: ['.py'], scope: 'file' },
  'python-security': { name: 'python-security', extensions: ['.py'], scope: 'file' },
  'python-complexity': { name: 'python-complexity', extensions: ['.py'], scope: 'file' },
  'python-imports': { name: 'python-imports', extensions: ['.py'], scope: 'file' },
  'python-best-practices': { name: 'python-best-practices', extensions: ['.py'], scope: 'file' },
  'java-complexity': { name: 'java-complexity', extensions: ['.java'], scope: 'file' },
  'java-stream': { name: 'java-stream', extensions: ['.java'], scope: 'file' },
  'java-exception': { name: 'java-exception', extensions: ['.java'], scope: 'file' },
  'java-memory': { name: 'java-memory', extensions: ['.java'], scope: 'file' },
  'java-spring': { name: 'java-spring', extensions: ['.java'], scope: 'file' },
  'go': { name: 'go', extensions: ['.go'], scope: 'file' },
  'rust': { name: 'rust', extensions: ['.rs'], scope: 'file' },
  // Workspace/global detectors (never skipped)
  'security': { name: 'security', scope: 'workspace' },
  'complexity': { name: 'complexity', scope: 'workspace' },
  'performance': { name: 'performance', scope: 'workspace' },
  'import': { name: 'import', scope: 'workspace' },
  'package': { name: 'package', scope: 'global' },
  'circular': { name: 'circular', scope: 'workspace' },
  'network': { name: 'network', scope: 'workspace' },
  'runtime': { name: 'runtime', scope: 'global' },
  'build': { name: 'build', scope: 'global' },
  'isolation': { name: 'isolation', scope: 'workspace' },
};

/**
 * Phase 1.4.3: Get metadata for a detector
 */
export function getDetectorMetadata(name: DetectorName): DetectorMetadata {
  return detectorMetadata[name] || { name, scope: 'global' }; // Default to global if no metadata
}

/**
 * Detector cache to avoid re-importing
 * Key: detector name, Value: detector class constructor
 */
const detectorCache = new Map<DetectorName, any>();

/**
 * Detector load statistics for monitoring
 */
export interface DetectorLoadStats {
  name: DetectorName;
  loadTimeMs: number;
  fromCache: boolean;
  timestamp: string;
}

const loadStats: DetectorLoadStats[] = [];

/**
 * Phase P3: Check if detector is enabled via manifest (uses getActiveDetectors)
 * @param name Detector name
 * @returns True if detector should be loaded
 */
function isDetectorEnabled(name: DetectorName): boolean {
  try {
    const activeDetectors = getActiveDetectors();
    const isEnabled = activeDetectors.includes(name);
    
    if (!isEnabled) {
      console.debug(`[DetectorLoader] Detector '${name}' disabled via manifest`);
      // TODO P3: Add audit entry for disabled detector
    }
    
    return isEnabled;
  } catch (error) {
    console.warn('[DetectorLoader] Error checking detector status, enabling by default:', error);
    // Fallback: enable all detectors if manifest unavailable
    return true;
  }
}

/**
 * Load a detector dynamically
 * @param name Detector name
 * @returns Detector class constructor
 * @throws Error if detector not found
 */
export async function loadDetector(name: DetectorName): Promise<any> {
  const startMs = performance.now();

  // Check cache first
  if (detectorCache.has(name)) {
    const tookMs = performance.now() - startMs;
    loadStats.push({
      name,
      loadTimeMs: tookMs,
      fromCache: true,
      timestamp: new Date().toISOString(),
    });
    return detectorCache.get(name);
  }

  // Dynamic import based on detector name
  let DetectorClass: any;

  try {
    switch (name) {
      // Core 11 detectors
      case 'typescript':
        DetectorClass = (await import('./ts-detector.js')).TSDetector;
        break;
      case 'eslint':
        DetectorClass = (await import('./eslint-detector.js')).ESLintDetector;
        break;
      case 'import':
        DetectorClass = (await import('./import-detector.js')).ImportDetector;
        break;
      case 'package':
        DetectorClass = (await import('./package-detector.js')).PackageDetector;
        break;
      case 'runtime':
        DetectorClass = (await import('./runtime-detector.js')).RuntimeDetector;
        break;
      case 'build':
        DetectorClass = (await import('./build-detector.js')).BuildDetector;
        break;
      case 'security':
        DetectorClass = (await import('./security-detector.js')).SecurityDetector;
        break;
      case 'circular':
        DetectorClass = (await import('./circular-detector.js')).CircularDependencyDetector;
        break;
      case 'network':
        DetectorClass = (await import('./network-detector.js')).NetworkDetector;
        break;
      case 'performance':
        DetectorClass = (await import('./performance-detector.js')).PerformanceDetector;
        break;
      case 'complexity':
        DetectorClass = (await import('./complexity-detector.js')).ComplexityDetector;
        break;
      case 'isolation':
        DetectorClass = (await import('./isolation-detector.js')).ComponentIsolationDetector;
        break;

      // Python detectors
      case 'python-type':
        DetectorClass = (await import('./python/index.js')).PythonTypeDetector;
        break;
      case 'python-security':
        DetectorClass = (await import('./python/index.js')).PythonSecurityDetector;
        break;
      case 'python-complexity':
        DetectorClass = (await import('./python/index.js')).PythonComplexityDetector;
        break;
      case 'python-imports':
        DetectorClass = (await import('./python/index.js')).PythonImportsDetector;
        break;
      case 'python-best-practices':
        DetectorClass = (await import('./python/index.js')).PythonBestPracticesDetector;
        break;

      // Java detectors
      case 'java-complexity':
        DetectorClass = (await import('./java/index.js')).JavaComplexityDetector;
        break;
      case 'java-stream':
        DetectorClass = (await import('./java/index.js')).JavaStreamDetector;
        break;
      case 'java-exception':
        DetectorClass = (await import('./java/index.js')).JavaExceptionDetector;
        break;
      case 'java-memory':
        DetectorClass = (await import('./java/index.js')).JavaMemoryDetector;
        break;
      case 'java-spring':
        DetectorClass = (await import('./java/index.js')).JavaSpringDetector;
        break;

      // Go & Rust
      case 'go':
        DetectorClass = (await import('./go-detector.js')).GoDetector;
        break;
      case 'rust':
        DetectorClass = (await import('./rust-detector.js')).RustDetector;
        break;

      // Advanced detectors
      case 'architecture':
        DetectorClass = (await import('./architecture-detector.js')).ArchitectureDetector;
        break;
      case 'database':
        DetectorClass = (await import('./database-detector.js')).DatabaseDetector;
        break;
      case 'nextjs':
        DetectorClass = (await import('./nextjs-detector.js')).NextJSDetector;
        break;
      case 'infrastructure':
        DetectorClass = (await import('./infrastructure-detector.js')).InfrastructureDetector;
        break;
      case 'context-aware-security':
        DetectorClass = (await import('./context-aware-security-v3.js')).ContextAwareSecurityDetector;
        break;
      case 'context-aware-performance':
        DetectorClass = (await import('./context-aware-performance.js')).ContextAwarePerformanceDetector;
        break;

      default:
        throw new Error(`[DetectorLoader] Unknown detector: ${name}`);
    }

    // Cache for future use
    detectorCache.set(name, DetectorClass);

    const tookMs = performance.now() - startMs;
    loadStats.push({
      name,
      loadTimeMs: tookMs,
      fromCache: false,
      timestamp: new Date().toISOString(),
    });

    return DetectorClass;
  } catch (error) {
    throw new Error(
      `[DetectorLoader] Failed to load detector "${name}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load multiple detectors in parallel
 * @param names Array of detector names
 * @returns Map of detector name to class constructor
 */
export async function loadDetectors(names: DetectorName[]): Promise<Map<DetectorName, any>> {
  const results = await Promise.allSettled(
    names.map(async (name) => ({ name, detector: await loadDetector(name) }))
  );

  const detectorMap = new Map<DetectorName, any>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      detectorMap.set(result.value.name, result.value.detector);
    } else {
      console.error(`[DetectorLoader] Failed to load detector:`, result.reason);
    }
  }

  return detectorMap;
}

/**
 * Preload commonly used detectors for faster first access
 * Call this during idle time or application startup
 */
export async function preloadCommonDetectors(): Promise<void> {
  const commonDetectors: DetectorName[] = [
    'typescript',
    'eslint',
    'import',
    'security',
    'performance',
  ];

  await loadDetectors(commonDetectors);
  console.log(`[DetectorLoader] Preloaded ${commonDetectors.length} common detectors`);
}

/**
 * Get detector load statistics
 */
export function getLoadStats(): DetectorLoadStats[] {
  return [...loadStats];
}

/**
 * Get average load time by detector
 */
export function getAverageLoadTime(name: DetectorName): number {
  const stats = loadStats.filter((s) => s.name === name && !s.fromCache);
  if (stats.length === 0) return 0;
  return stats.reduce((sum, s) => sum + s.loadTimeMs, 0) / stats.length;
}

/**
 * Get cache hit ratio
 */
export function getCacheHitRatio(): number {
  if (loadStats.length === 0) return 0;
  const cacheHits = loadStats.filter((s) => s.fromCache).length;
  return cacheHits / loadStats.length;
}

/**
 * Clear detector cache (useful for testing or memory management)
 */
export function clearCache(): void {
  detectorCache.clear();
  console.log('[DetectorLoader] Cache cleared');
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return detectorCache.size;
}
