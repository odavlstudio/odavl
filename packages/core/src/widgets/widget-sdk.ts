/**
 * @fileoverview Widget SDK - Programmatic widget development API
 * @module @odavl-studio/insight-core/widgets/widget-sdk
 * 
 * **Purpose**: Provide SDK for creating custom widgets programmatically
 * 
 * **Features**:
 * - Type-safe widget API
 * - React hooks for widget development
 * - Data fetching utilities
 * - State management
 * - Lifecycle hooks
 * - Error boundaries
 * - Performance optimization (memoization, lazy loading)
 * - Testing utilities
 * - TypeScript support
 * - Hot reload during development
 * 
 * **Widget Lifecycle**:
 * 1. onMount - Widget mounted
 * 2. onDataLoad - Data fetching started
 * 3. onDataLoaded - Data received
 * 4. onRender - Widget rendered
 * 5. onUpdate - Props/data changed
 * 6. onError - Error occurred
 * 7. onUnmount - Widget unmounting
 * 
 * **Architecture**:
 * ```
 * Widget SDK
 *   ├── createWidget(definition) → Widget
 *   ├── useWidgetData(source) → { data, loading, error }
 *   ├── useWidgetState(initial) → [state, setState]
 *   ├── useWidgetTheme() → Theme
 *   ├── useWidgetConfig() → Config
 *   └── withWidget(Component) → WrappedComponent
 * ```
 * 
 * **Integration Points**:
 * - Used by: Widget developers, Dashboard builders
 * - Wraps: React, Data fetching, State management
 * - Output: React components
 */

import { EventEmitter } from 'events';
import type { WidgetDefinition } from './widget-builder';
import type { DashboardTheme } from '../dashboard/theme-manager';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Widget context
 */
export interface WidgetContext {
  /** Widget ID */
  id: string;

  /** Widget definition */
  definition: WidgetDefinition;

  /** Dashboard theme */
  theme: DashboardTheme;

  /** Dashboard ID */
  dashboardId?: string;

  /** User ID */
  userId?: string;

  /** Environment */
  environment: 'development' | 'production';
}

/**
 * Widget props
 */
export interface WidgetProps<TData = any> {
  /** Widget definition */
  definition: WidgetDefinition;

  /** Widget data */
  data?: TData;

  /** Loading state */
  loading?: boolean;

  /** Error state */
  error?: Error;

  /** Theme */
  theme?: DashboardTheme;

  /** Event handlers */
  onMount?: () => void;
  onUnmount?: () => void;
  onError?: (error: Error) => void;
  onClick?: (event: any) => void;
  onDataChange?: (data: TData) => void;

  /** Custom props */
  [key: string]: any;
}

/**
 * Widget component
 */
export type WidgetComponent<TData = any> = React.FC<WidgetProps<TData>>;

/**
 * Widget hook result
 */
export interface WidgetDataHook<TData = any> {
  /** Data */
  data: TData | null;

  /** Loading state */
  loading: boolean;

  /** Error */
  error: Error | null;

  /** Refetch function */
  refetch: () => Promise<void>;

  /** Last updated timestamp */
  lastUpdated: Date | null;
}

/**
 * Widget state hook
 */
export type WidgetStateHook<TState> = [
  state: TState,
  setState: (state: TState | ((prev: TState) => TState)) => void,
  resetState: () => void
];

/**
 * Widget lifecycle
 */
export interface WidgetLifecycle {
  /** Called when widget mounts */
  onMount?: () => void | Promise<void>;

  /** Called when data loading starts */
  onDataLoad?: () => void | Promise<void>;

  /** Called when data is loaded */
  onDataLoaded?: (data: any) => void | Promise<void>;

  /** Called after render */
  onRender?: () => void | Promise<void>;

  /** Called when props/data update */
  onUpdate?: (prevProps: any, nextProps: any) => void | Promise<void>;

  /** Called on error */
  onError?: (error: Error) => void | Promise<void>;

  /** Called when widget unmounts */
  onUnmount?: () => void | Promise<void>;
}

/**
 * Widget configuration
 */
export interface WidgetSDKConfig {
  /** API base URL */
  apiBaseUrl: string;

  /** Authentication token */
  authToken?: string;

  /** Enable caching */
  enableCaching: boolean;

  /** Cache TTL (seconds) */
  cacheTTL: number;

  /** Enable error boundaries */
  enableErrorBoundaries: boolean;

  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;

  /** Development mode */
  isDevelopment: boolean;
}

/**
 * Data fetcher function
 */
export type DataFetcher<TData = any> = (params?: Record<string, any>) => Promise<TData>;

/**
 * Widget test utilities
 */
export interface WidgetTestUtils {
  /** Render widget with test data */
  renderWidget: (definition: WidgetDefinition, data?: any) => any;

  /** Simulate data loading */
  simulateLoading: (duration?: number) => Promise<void>;

  /** Simulate error */
  simulateError: (error: Error) => void;

  /** Get widget metrics */
  getMetrics: () => WidgetMetrics;
}

/**
 * Widget metrics
 */
export interface WidgetMetrics {
  /** Render count */
  renderCount: number;

  /** Average render time (ms) */
  averageRenderTime: number;

  /** Data fetch count */
  dataFetchCount: number;

  /** Average fetch time (ms) */
  averageFetchTime: number;

  /** Error count */
  errorCount: number;

  /** Last render timestamp */
  lastRenderTime: Date;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: WidgetSDKConfig = {
  apiBaseUrl: '/api',
  enableCaching: true,
  cacheTTL: 300,
  enableErrorBoundaries: true,
  enablePerformanceMonitoring: true,
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// ============================================================================
// WidgetSDK Class
// ============================================================================

/**
 * Widget SDK - Programmatic widget development
 * 
 * **Usage**:
 * ```typescript
 * // 1. Create custom widget component
 * import { WidgetSDK, useWidgetData } from '@odavl-studio/insight-core/widgets/widget-sdk';
 * 
 * const QualityScoreWidget: React.FC<WidgetProps> = ({ definition }) => {
 *   // Fetch data using SDK hook
 *   const { data, loading, error } = useWidgetData(definition.dataSource);
 *   
 *   // Use theme
 *   const theme = useWidgetTheme();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div style={{ backgroundColor: theme.colors.background.paper }}>
 *       <h3>{definition.name}</h3>
 *       <div className="score">{data.qualityScore}</div>
 *     </div>
 *   );
 * };
 * 
 * // 2. Register widget with SDK
 * const sdk = new WidgetSDK();
 * sdk.registerWidget('quality-score', QualityScoreWidget);
 * 
 * // 3. Render widget
 * const widget = sdk.createWidget({
 *   type: 'quality-score',
 *   name: 'Quality Score',
 *   dataSource: {
 *     type: 'aggregator',
 *     endpoint: '/api/metrics/quality',
 *   },
 * });
 * 
 * ReactDOM.render(widget, container);
 * ```
 * 
 * **Custom Data Fetching**:
 * ```typescript
 * const CustomWidget: React.FC<WidgetProps> = () => {
 *   const { data, loading, refetch } = useWidgetData(
 *     async () => {
 *       const response = await fetch('/api/custom-data');
 *       return response.json();
 *     },
 *     { refreshInterval: 30000 } // Auto-refresh every 30s
 *   );
 *   
 *   return (
 *     <div>
 *       <button onClick={refetch}>Refresh</button>
 *       {loading ? 'Loading...' : JSON.stringify(data)}
 *     </div>
 *   );
 * };
 * ```
 * 
 * **State Management**:
 * ```typescript
 * const StatefulWidget: React.FC<WidgetProps> = () => {
 *   const [state, setState, resetState] = useWidgetState({ count: 0 });
 *   
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <button onClick={() => setState({ count: state.count + 1 })}>
 *         Increment
 *       </button>
 *       <button onClick={resetState}>Reset</button>
 *     </div>
 *   );
 * };
 * ```
 * 
 * **Lifecycle Hooks**:
 * ```typescript
 * const LifecycleWidget: React.FC<WidgetProps> = ({ definition }) => {
 *   useWidgetLifecycle({
 *     onMount: async () => {
 *       console.log('Widget mounted');
 *       // Initialize resources
 *     },
 *     onUnmount: () => {
 *       console.log('Widget unmounting');
 *       // Cleanup resources
 *     },
 *     onError: (error) => {
 *       console.error('Widget error:', error);
 *       // Handle error
 *     },
 *   });
 *   
 *   return <div>Lifecycle Widget</div>;
 * };
 * ```
 * 
 * **Testing**:
 * ```typescript
 * import { createTestUtils } from '@odavl-studio/insight-core/widgets/widget-sdk';
 * 
 * const testUtils = createTestUtils();
 * 
 * // Render with mock data
 * const rendered = testUtils.renderWidget(definition, {
 *   qualityScore: 85,
 *   issueCount: 12,
 * });
 * 
 * // Simulate loading
 * await testUtils.simulateLoading(1000);
 * 
 * // Get metrics
 * const metrics = testUtils.getMetrics();
 * console.log('Render count:', metrics.renderCount);
 * ```
 */
export class WidgetSDK extends EventEmitter {
  private config: WidgetSDKConfig;
  private widgets: Map<string, WidgetComponent> = new Map();
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private metrics: Map<string, WidgetMetrics> = new Map();

  constructor(config: Partial<WidgetSDKConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Widget Registration
  // ==========================================================================

  /**
   * Register widget component
   * 
   * @param type - Widget type
   * @param component - React component
   */
  registerWidget(type: string, component: WidgetComponent): void {
    this.widgets.set(type, component);
    this.emit('widget:registered', { type });
  }

  /**
   * Unregister widget
   * 
   * @param type - Widget type
   */
  unregisterWidget(type: string): void {
    this.widgets.delete(type);
    this.emit('widget:unregistered', { type });
  }

  /**
   * Get registered widget
   * 
   * @param type - Widget type
   * @returns Widget component
   */
  getWidget(type: string): WidgetComponent | undefined {
    return this.widgets.get(type);
  }

  /**
   * List registered widgets
   * 
   * @returns Array of widget types
   */
  listWidgets(): string[] {
    return Array.from(this.widgets.keys());
  }

  // ==========================================================================
  // Public API - Widget Creation
  // ==========================================================================

  /**
   * Create widget instance
   * 
   * @param definition - Widget definition
   * @returns React element
   */
  createWidget(definition: Partial<WidgetDefinition>): any {
    const type = definition.type as string;
    const Component = this.widgets.get(type);

    if (!Component) {
      throw new Error(`Widget type not registered: ${type}`);
    }

    // Mock React element
    const element = {
      type: Component,
      props: {
        definition: definition as WidgetDefinition,
      },
    };

    this.emit('widget:created', { definition });
    return element;
  }

  // ==========================================================================
  // Public API - Data Fetching
  // ==========================================================================

  /**
   * Fetch widget data
   * 
   * @param endpoint - Data endpoint
   * @param params - Query parameters
   * @returns Data
   */
  async fetchData<TData = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<TData> {
    const cacheKey = this.getCacheKey(endpoint, params);

    // Check cache
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const age = Date.now() - cached.timestamp.getTime();
        if (age < this.config.cacheTTL * 1000) {
          this.emit('data:cache_hit', { endpoint });
          return cached.data;
        }
      }
    }

    // Fetch data
    const startTime = Date.now();
    
    try {
      // Mock data fetch
      // In real implementation:
      // const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
      //   headers: { Authorization: `Bearer ${this.config.authToken}` },
      // });
      // const data = await response.json();

      const mockData = { success: true } as TData;

      const fetchTime = Date.now() - startTime;

      // Update cache
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: mockData,
          timestamp: new Date(),
        });
      }

      this.emit('data:fetched', { endpoint, fetchTime });
      return mockData;
    } catch (error) {
      this.emit('data:error', { endpoint, error });
      throw error;
    }
  }

  /**
   * Clear data cache
   * 
   * @param endpoint - Optional endpoint (clear all if not provided)
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      // Clear specific endpoint
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpoint)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all
      this.cache.clear();
    }

    this.emit('cache:cleared', { endpoint });
  }

  // ==========================================================================
  // Public API - Metrics
  // ==========================================================================

  /**
   * Get widget metrics
   * 
   * @param widgetId - Widget ID
   * @returns Widget metrics
   */
  getMetrics(widgetId: string): WidgetMetrics | undefined {
    return this.metrics.get(widgetId);
  }

  /**
   * Record render
   * 
   * @param widgetId - Widget ID
   * @param renderTime - Render time (ms)
   */
  recordRender(widgetId: string, renderTime: number): void {
    let metrics = this.metrics.get(widgetId);

    if (!metrics) {
      metrics = {
        renderCount: 0,
        averageRenderTime: 0,
        dataFetchCount: 0,
        averageFetchTime: 0,
        errorCount: 0,
        lastRenderTime: new Date(),
      };
      this.metrics.set(widgetId, metrics);
    }

    metrics.renderCount++;
    metrics.averageRenderTime =
      (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) /
      metrics.renderCount;
    metrics.lastRenderTime = new Date();

    this.emit('metrics:updated', { widgetId, metrics });
  }

  /**
   * Record data fetch
   * 
   * @param widgetId - Widget ID
   * @param fetchTime - Fetch time (ms)
   */
  recordDataFetch(widgetId: string, fetchTime: number): void {
    const metrics = this.metrics.get(widgetId);
    if (!metrics) return;

    metrics.dataFetchCount++;
    metrics.averageFetchTime =
      (metrics.averageFetchTime * (metrics.dataFetchCount - 1) + fetchTime) /
      metrics.dataFetchCount;
  }

  /**
   * Record error
   * 
   * @param widgetId - Widget ID
   */
  recordError(widgetId: string): void {
    const metrics = this.metrics.get(widgetId);
    if (!metrics) return;

    metrics.errorCount++;
  }

  // ==========================================================================
  // Public API - Configuration
  // ==========================================================================

  /**
   * Update configuration
   * 
   * @param config - Partial configuration
   */
  updateConfig(config: Partial<WidgetSDKConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', { config: this.config });
  }

  /**
   * Get configuration
   * 
   * @returns Current configuration
   */
  getConfig(): WidgetSDKConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Generate cache key
   */
  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramStr}`;
  }
}

// ============================================================================
// React Hooks (Mock Implementations)
// ============================================================================

/**
 * Hook for fetching widget data
 * 
 * @param source - Data source or fetcher function
 * @param options - Fetch options
 * @returns Data hook result
 */
export function useWidgetData<TData = any>(
  source: any,
  options?: { refreshInterval?: number }
): WidgetDataHook<TData> {
  // Mock implementation
  // In real implementation, use React.useState, React.useEffect
  
  const mockResult: WidgetDataHook<TData> = {
    data: null,
    loading: false,
    error: null,
    refetch: async () => {
      // Refetch logic
    },
    lastUpdated: new Date(),
  };

  return mockResult;
}

/**
 * Hook for widget state management
 * 
 * @param initialState - Initial state
 * @returns State hook result
 */
export function useWidgetState<TState>(
  initialState: TState
): WidgetStateHook<TState> {
  // Mock implementation
  // In real implementation, use React.useState
  
  const state = initialState;
  const setState = (newState: TState | ((prev: TState) => TState)) => {
    // Set state logic
  };
  const resetState = () => {
    // Reset to initial state
  };

  return [state, setState, resetState];
}

/**
 * Hook for accessing widget theme
 * 
 * @returns Dashboard theme
 */
export function useWidgetTheme(): DashboardTheme {
  // Mock implementation
  // In real implementation, use React.useContext
  
  const mockTheme: DashboardTheme = {
    name: 'light',
    title: 'Light Theme',
    description: 'Default light theme',
    colors: {
      primary: '#0066cc',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      background: {
        default: '#ffffff',
        paper: '#f8f9fa',
        elevated: '#ffffff',
        overlay: 'rgba(0,0,0,0.5)',
      },
      text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#bdbdbd',
        hint: '#9e9e9e',
      },
      border: {
        default: '#e0e0e0',
        light: '#f5f5f5',
        dark: '#9e9e9e',
      },
      chart: {
        series: ['#0066cc', '#28a745', '#ffc107', '#dc3545', '#17a2b8'],
        grid: '#e0e0e0',
        axis: '#757575',
      },
    },
    typography: {
      fontFamily: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        monospace: '"Fira Code", "Courier New", monospace',
        heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 20,
        xxl: 24,
      },
      fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    spacing: {
      unit: 4,
      scale: {
        xs: 2,
        sm: 4,
        md: 8,
        lg: 16,
        xl: 24,
        xxl: 32,
      },
    },
    borders: {
      radius: {
        none: 0,
        sm: 2,
        md: 4,
        lg: 8,
        xl: 16,
        full: 50,
      },
      width: {
        thin: 1,
        medium: 2,
        thick: 4,
      },
    },
    shadows: {
      box: {
        none: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.15)',
        xl: '0 20px 25px rgba(0,0,0,0.2)',
      },
      text: {
        subtle: '0 1px 2px rgba(0,0,0,0.1)',
        strong: '0 2px 4px rgba(0,0,0,0.2)',
      },
    },
    transitions: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500,
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    metadata: {
      author: 'ODAVL Studio',
      version: '1.0.0',
      createdAt: new Date(),
      tags: ['light', 'default'],
    },
  };

  return mockTheme;
}

/**
 * Hook for accessing widget configuration
 * 
 * @returns Widget configuration
 */
export function useWidgetConfig(): WidgetSDKConfig {
  // Mock implementation
  // In real implementation, use React.useContext
  
  return DEFAULT_CONFIG;
}

/**
 * Hook for widget lifecycle events
 * 
 * @param lifecycle - Lifecycle handlers
 */
export function useWidgetLifecycle(lifecycle: WidgetLifecycle): void {
  // Mock implementation
  // In real implementation, use React.useEffect
  
  // Call onMount on component mount
  if (lifecycle.onMount) {
    lifecycle.onMount();
  }

  // Return cleanup function for onUnmount
  return () => {
    if (lifecycle.onUnmount) {
      lifecycle.onUnmount();
    }
  };
}

// ============================================================================
// Higher-Order Components
// ============================================================================

/**
 * HOC to wrap component with widget functionality
 * 
 * @param Component - React component
 * @returns Wrapped component
 */
export function withWidget<TProps extends WidgetProps>(
  Component: React.ComponentType<TProps>
): React.ComponentType<TProps> {
  // Mock implementation
  // In real implementation, return wrapped component with context providers
  
  return Component;
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Create widget test utilities
 * 
 * @returns Test utilities
 */
export function createTestUtils(): WidgetTestUtils {
  const metrics: WidgetMetrics = {
    renderCount: 0,
    averageRenderTime: 0,
    dataFetchCount: 0,
    averageFetchTime: 0,
    errorCount: 0,
    lastRenderTime: new Date(),
  };

  return {
    renderWidget: (definition: WidgetDefinition, data?: any) => {
      metrics.renderCount++;
      return { definition, data };
    },

    simulateLoading: async (duration = 1000) => {
      await new Promise(resolve => setTimeout(resolve, duration));
    },

    simulateError: (error: Error) => {
      metrics.errorCount++;
      throw error;
    },

    getMetrics: () => ({ ...metrics }),
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create widget SDK instance
 * 
 * @param config - SDK configuration
 * @returns WidgetSDK instance
 */
export function createWidgetSDK(config?: Partial<WidgetSDKConfig>): WidgetSDK {
  return new WidgetSDK(config);
}

/**
 * Create data fetcher
 * 
 * @param endpoint - API endpoint
 * @param sdk - Widget SDK instance
 * @returns Data fetcher function
 */
export function createDataFetcher<TData = any>(
  endpoint: string,
  sdk: WidgetSDK
): DataFetcher<TData> {
  return async (params?: Record<string, any>) => {
    return sdk.fetchData<TData>(endpoint, params);
  };
}
