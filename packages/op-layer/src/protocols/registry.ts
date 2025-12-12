/**
 * ODAVL Protocol Layer - Global Adapter Registry
 * 
 * Solves the module instance isolation problem by using globalThis + Symbol.for()
 * to ensure ONE shared adapter instance across ALL module boundaries.
 * 
 * Problem: When service.ts and autopilot-engine both import AnalysisProtocol,
 * they may get DIFFERENT class instances due to module caching.
 * 
 * Solution: Store adapter in globalThis using a unique Symbol that's shared
 * across all modules in the same Node.js process.
 * 
 * @module protocols/registry
 */

import type { AnalysisAdapter } from './analysis.js';

/**
 * Global symbol key - shared across ALL modules via Symbol.for()
 * This ensures the SAME adapter is accessible from service AND engine
 */
const GLOBAL_ADAPTER_KEY = Symbol.for('odavl.analysis.adapter');

/**
 * TypeScript helper to type globalThis with our custom symbol
 */
type GlobalWithAdapter = typeof globalThis & {
  [GLOBAL_ADAPTER_KEY]?: AnalysisAdapter | null;
};

/**
 * AdapterRegistry - Global singleton for AnalysisAdapter storage
 * 
 * Uses globalThis to bypass module instance isolation issues.
 * All calls to register/get/clear operate on the SAME global state.
 */
export class AdapterRegistry {
  /**
   * Register an adapter globally
   * Accessible from ANY module in the process
   */
  static register(adapter: AnalysisAdapter): void {
    const g = globalThis as GlobalWithAdapter;
    g[GLOBAL_ADAPTER_KEY] = adapter;
    console.log('[AdapterRegistry] Adapter registered globally via Symbol.for()');
  }

  /**
   * Get the globally registered adapter
   * Returns null if not registered
   */
  static get(): AnalysisAdapter | null {
    const g = globalThis as GlobalWithAdapter;
    return g[GLOBAL_ADAPTER_KEY] ?? null;
  }

  /**
   * Clear the global adapter registration
   * Useful for testing or cleanup
   */
  static clear(): void {
    const g = globalThis as GlobalWithAdapter;
    g[GLOBAL_ADAPTER_KEY] = null;
    console.log('[AdapterRegistry] Adapter cleared from global registry');
  }

  /**
   * Check if an adapter is registered
   * Works across ALL module instances
   */
  static isRegistered(): boolean {
    const g = globalThis as GlobalWithAdapter;
    return !!g[GLOBAL_ADAPTER_KEY];
  }
}
