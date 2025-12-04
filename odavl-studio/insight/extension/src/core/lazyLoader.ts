/**
 * Lazy Module Loader for ODAVL Insight Extension
 * Defers heavy module imports until first use
 */

export interface LazyModules {
  InsightAnalyzer: any;
  OptimizedTypeScriptDetector: any;
  OptimizedESLintDetector: any;
  ParallelExecutor: any;
  IncrementalAnalyzer: any;
  ResultCache: any;
  MemoryManager: any;
}

let modules: Partial<LazyModules> = {};
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export function isModulesInitialized(): boolean {
  return isInitialized;
}

export async function ensureInitialized(): Promise<LazyModules> {
  if (isInitialized) {
    return modules as LazyModules;
  }

  if (initializationPromise) {
    await initializationPromise;
    return modules as LazyModules;
  }

  initializationPromise = loadModules();
  await initializationPromise;
  return modules as LazyModules;
}

async function loadModules(): Promise<void> {
  try {
    console.log('🔄 ODAVL Insight: Loading heavy modules...');
    const startTime = Date.now();

    // Parallel import for faster loading
    const [
      analyzer,
      tsDetector,
      eslintDetector,
      executor,
      incremental,
      cache,
      memory
    ] = await Promise.all([
      import('@odavl-studio/insight-core'),
      import('@odavl-studio/insight-core/detector').then(m => m.TypeScriptDetector),
      import('@odavl-studio/insight-core/detector').then(m => m.ESLintDetector),
      import('@odavl-studio/insight-core').then(m => m.ParallelExecutor),
      import('@odavl-studio/insight-core').then(m => m.IncrementalAnalyzer),
      import('@odavl-studio/insight-core').then(m => m.ResultCache),
      import('@odavl-studio/insight-core').then(m => m.MemoryManager)
    ]);

    modules = {
      InsightAnalyzer: analyzer,
      OptimizedTypeScriptDetector: tsDetector,
      OptimizedESLintDetector: eslintDetector,
      ParallelExecutor: executor,
      IncrementalAnalyzer: incremental,
      ResultCache: cache,
      MemoryManager: memory
    };

    isInitialized = true;
    const duration = Date.now() - startTime;
    console.log(`✅ ODAVL Insight: Modules loaded in ${duration}ms`);
  } catch (error) {
    console.error('❌ ODAVL Insight: Failed to load modules', error);
    throw error;
  }
}

export function resetModules(): void {
  isInitialized = false;
  initializationPromise = null;
  modules = {};
}
