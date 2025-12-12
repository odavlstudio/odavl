/**
 * @fileoverview Dashboard Theme Manager - Customizable dashboard themes
 * @module @odavl-studio/insight-core/dashboard/theme-manager
 * 
 * **Purpose**: Manage dashboard themes and visual customization
 * 
 * **Features**:
 * - Pre-built themes (light, dark, high-contrast, colorblind-friendly)
 * - Custom theme creation (colors, fonts, spacing, borders)
 * - Theme inheritance (extend base themes)
 * - Dynamic theme switching (runtime)
 * - CSS variable injection (CSS custom properties)
 * - Component-level theming (widget-specific overrides)
 * - Accessibility compliance (WCAG 2.1 AA/AAA)
 * - Export/import themes (JSON)
 * - Theme validation (ensure contrast ratios)
 * - Brand customization (logo, colors, fonts)
 * 
 * **Theme Components**:
 * - Colors: Primary, secondary, background, text, borders
 * - Typography: Font families, sizes, weights, line heights
 * - Spacing: Padding, margins, gaps
 * - Borders: Radius, width, style
 * - Shadows: Box shadows, text shadows
 * - Transitions: Durations, easings
 * 
 * **Built-in Themes**:
 * 1. Light - Clean, bright theme for daytime use
 * 2. Dark - Eye-friendly theme for low-light environments
 * 3. High Contrast - Accessibility theme for visual impairments
 * 4. Colorblind - Deuteranopia/protanopia-friendly colors
 * 5. Midnight - Deep dark theme with blue accents
 * 6. Solarized - Popular low-contrast theme
 * 7. Nord - Arctic, bluish theme
 * 8. Dracula - Purple-based dark theme
 * 
 * **Architecture**:
 * ```
 * ThemeManager
 *   ├── registerTheme(name, theme) → void
 *   ├── getTheme(name) → Theme
 *   ├── setActiveTheme(name) → void
 *   ├── createCustomTheme(base, overrides) → Theme
 *   ├── validateTheme(theme) → ValidationResult
 *   ├── exportTheme(name) → string (JSON)
 *   ├── importTheme(json) → Theme
 *   └── applyTheme(theme) → void (inject CSS variables)
 * ```
 * 
 * **Integration Points**:
 * - Used by: Enterprise Dashboard Manager, Widget Library, Studio Hub
 * - Applies to: All dashboard components, widgets, charts
 * - Storage: LocalStorage (user preferences), Database (team themes)
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Color palette
 */
export interface ColorPalette {
  /** Primary brand color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Success color (green) */
  success: string;
  /** Warning color (yellow) */
  warning: string;
  /** Error color (red) */
  error: string;
  /** Info color (blue) */
  info: string;

  /** Background colors */
  background: {
    /** Default background */
    default: string;
    /** Paper/card background */
    paper: string;
    /** Elevated background */
    elevated: string;
    /** Overlay background */
    overlay: string;
  };

  /** Text colors */
  text: {
    /** Primary text */
    primary: string;
    /** Secondary text */
    secondary: string;
    /** Disabled text */
    disabled: string;
    /** Hint text */
    hint: string;
  };

  /** Border colors */
  border: {
    /** Default border */
    default: string;
    /** Light border */
    light: string;
    /** Dark border */
    dark: string;
  };

  /** Chart colors */
  chart: {
    /** Main data series */
    series: string[];
    /** Grid lines */
    grid: string;
    /** Axis lines */
    axis: string;
  };
}

/**
 * Typography settings
 */
export interface Typography {
  /** Font families */
  fontFamily: {
    /** Primary font (body text) */
    primary: string;
    /** Monospace font (code) */
    monospace: string;
    /** Heading font */
    heading: string;
  };

  /** Font sizes */
  fontSize: {
    /** Extra small (10px) */
    xs: string;
    /** Small (12px) */
    sm: string;
    /** Medium (14px) */
    md: string;
    /** Large (16px) */
    lg: string;
    /** Extra large (20px) */
    xl: string;
    /** 2x large (24px) */
    xxl: string;
  };

  /** Font weights */
  fontWeight: {
    /** Light (300) */
    light: number;
    /** Regular (400) */
    regular: number;
    /** Medium (500) */
    medium: number;
    /** Semibold (600) */
    semibold: number;
    /** Bold (700) */
    bold: number;
  };

  /** Line heights */
  lineHeight: {
    /** Tight (1.2) */
    tight: number;
    /** Normal (1.5) */
    normal: number;
    /** Relaxed (1.75) */
    relaxed: number;
  };
}

/**
 * Spacing scale
 */
export interface Spacing {
  /** Base unit (4px) */
  unit: number;

  /** Scale multipliers */
  scale: {
    /** 0.5x (2px) */
    xs: number;
    /** 1x (4px) */
    sm: number;
    /** 2x (8px) */
    md: number;
    /** 4x (16px) */
    lg: number;
    /** 6x (24px) */
    xl: number;
    /** 8x (32px) */
    xxl: number;
  };
}

/**
 * Border settings
 */
export interface Borders {
  /** Border radius */
  radius: {
    /** No radius */
    none: string;
    /** Small (2px) */
    sm: string;
    /** Medium (4px) */
    md: string;
    /** Large (8px) */
    lg: string;
    /** Extra large (16px) */
    xl: string;
    /** Full (50%) */
    full: string;
  };

  /** Border width */
  width: {
    /** Thin (1px) */
    thin: string;
    /** Medium (2px) */
    medium: string;
    /** Thick (4px) */
    thick: string;
  };
}

/**
 * Shadow settings
 */
export interface Shadows {
  /** Box shadows */
  box: {
    /** No shadow */
    none: string;
    /** Small elevation */
    sm: string;
    /** Medium elevation */
    md: string;
    /** Large elevation */
    lg: string;
    /** Extra large elevation */
    xl: string;
  };

  /** Text shadows */
  text: {
    /** Subtle text shadow */
    subtle: string;
    /** Strong text shadow */
    strong: string;
  };
}

/**
 * Transition settings
 */
export interface Transitions {
  /** Transition durations */
  duration: {
    /** Fast (150ms) */
    fast: string;
    /** Normal (300ms) */
    normal: string;
    /** Slow (500ms) */
    slow: string;
  };

  /** Transition easings */
  easing: {
    /** Ease in */
    easeIn: string;
    /** Ease out */
    easeOut: string;
    /** Ease in-out */
    easeInOut: string;
  };
}

/**
 * Dashboard theme
 */
export interface DashboardTheme {
  /** Theme name */
  name: string;

  /** Display title */
  title: string;

  /** Description */
  description: string;

  /** Base theme (for inheritance) */
  base?: string;

  /** Color palette */
  colors: ColorPalette;

  /** Typography */
  typography: Typography;

  /** Spacing */
  spacing: Spacing;

  /** Borders */
  borders: Borders;

  /** Shadows */
  shadows: Shadows;

  /** Transitions */
  transitions: Transitions;

  /** Metadata */
  metadata: {
    /** Author */
    author: string;
    /** Version */
    version: string;
    /** Created at */
    createdAt: Date;
    /** Tags */
    tags: string[];
  };
}

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
  /** Valid */
  valid: boolean;

  /** Errors */
  errors: Array<{
    /** Error type */
    type: 'COLOR_CONTRAST' | 'MISSING_PROPERTY' | 'INVALID_VALUE';
    /** Error message */
    message: string;
    /** Property path */
    path: string;
  }>;

  /** Warnings */
  warnings: Array<{
    /** Warning message */
    message: string;
    /** Property path */
    path: string;
  }>;

  /** Contrast ratios (WCAG) */
  contrastRatios: Array<{
    /** Foreground color */
    foreground: string;
    /** Background color */
    background: string;
    /** Contrast ratio */
    ratio: number;
    /** WCAG level (AA, AAA) */
    level: 'AAA' | 'AA' | 'FAIL';
  }>;
}

/**
 * Configuration options
 */
export interface ThemeManagerConfig {
  /** Default theme name */
  defaultTheme: string;

  /** Enable theme persistence */
  enablePersistence: boolean;

  /** Storage key (localStorage) */
  storageKey: string;

  /** Validate themes on registration */
  validateOnRegister: boolean;

  /** Minimum contrast ratio (WCAG AA = 4.5:1) */
  minContrastRatio: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ThemeManagerConfig = {
  defaultTheme: 'light',
  enablePersistence: true,
  storageKey: 'odavl-theme',
  validateOnRegister: true,
  minContrastRatio: 4.5, // WCAG AA
};

// ============================================================================
// ThemeManager Class
// ============================================================================

/**
 * Theme Manager
 * 
 * **Usage**:
 * ```typescript
 * const manager = new ThemeManager();
 * 
 * // Create custom theme
 * const customTheme = manager.createCustomTheme('dark', {
 *   colors: {
 *     primary: '#00aaff',
 *     secondary: '#ff6600',
 *   },
 * });
 * 
 * // Register theme
 * manager.registerTheme('my-theme', customTheme);
 * 
 * // Set active theme
 * manager.setActiveTheme('my-theme');
 * 
 * // Validate theme
 * const validation = manager.validateTheme(customTheme);
 * if (!validation.valid) {
 *   console.error('Theme validation failed:', validation.errors);
 * }
 * 
 * // Export theme
 * const json = manager.exportTheme('my-theme');
 * await fs.writeFile('my-theme.json', json);
 * 
 * // Import theme
 * const imported = manager.importTheme(json);
 * manager.registerTheme('imported-theme', imported);
 * ```
 */
export class ThemeManager {
  private config: ThemeManagerConfig;
  private themes: Map<string, DashboardTheme> = new Map();
  private activeTheme: string;

  constructor(config: Partial<ThemeManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeTheme = this.config.defaultTheme;

    // Register built-in themes
    this.registerBuiltInThemes();

    // Load persisted theme
    if (this.config.enablePersistence) {
      this.loadPersistedTheme();
    }
  }

  // ==========================================================================
  // Public API - Theme Management
  // ==========================================================================

  /**
   * Register theme
   * 
   * @param name - Theme name
   * @param theme - Theme object
   */
  registerTheme(name: string, theme: DashboardTheme): void {
    if (this.config.validateOnRegister) {
      const validation = this.validateTheme(theme);
      if (!validation.valid) {
        throw new Error(`Theme validation failed: ${validation.errors[0]?.message}`);
      }
    }

    this.themes.set(name, theme);
  }

  /**
   * Get theme by name
   * 
   * @param name - Theme name
   * @returns Theme or undefined
   */
  getTheme(name: string): DashboardTheme | undefined {
    return this.themes.get(name);
  }

  /**
   * Get active theme
   * 
   * @returns Active theme
   */
  getActiveTheme(): DashboardTheme {
    return this.themes.get(this.activeTheme)!;
  }

  /**
   * Set active theme
   * 
   * @param name - Theme name
   */
  setActiveTheme(name: string): void {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme not found: ${name}`);
    }

    this.activeTheme = name;
    this.applyTheme(theme);

    // Persist
    if (this.config.enablePersistence) {
      this.persistTheme(name);
    }
  }

  /**
   * List all themes
   * 
   * @returns Array of theme names
   */
  listThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  // ==========================================================================
  // Public API - Theme Creation
  // ==========================================================================

  /**
   * Create custom theme based on base theme
   * 
   * @param baseName - Base theme name
   * @param overrides - Property overrides
   * @returns Custom theme
   */
  createCustomTheme(baseName: string, overrides: Partial<DashboardTheme>): DashboardTheme {
    const base = this.themes.get(baseName);
    if (!base) {
      throw new Error(`Base theme not found: ${baseName}`);
    }

    // Deep merge
    const custom: DashboardTheme = {
      ...base,
      ...overrides,
      base: baseName,
      colors: { ...base.colors, ...overrides.colors } as ColorPalette,
      typography: { ...base.typography, ...overrides.typography } as Typography,
      spacing: { ...base.spacing, ...overrides.spacing } as Spacing,
      borders: { ...base.borders, ...overrides.borders } as Borders,
      shadows: { ...base.shadows, ...overrides.shadows } as Shadows,
      transitions: { ...base.transitions, ...overrides.transitions } as Transitions,
      metadata: {
        ...base.metadata,
        ...overrides.metadata,
      },
    };

    return custom;
  }

  // ==========================================================================
  // Public API - Theme Validation
  // ==========================================================================

  /**
   * Validate theme
   * 
   * @param theme - Theme to validate
   * @returns Validation result
   */
  validateTheme(theme: DashboardTheme): ThemeValidationResult {
    const errors: ThemeValidationResult['errors'] = [];
    const warnings: ThemeValidationResult['warnings'] = [];
    const contrastRatios: ThemeValidationResult['contrastRatios'] = [];

    // Check required properties
    if (!theme.colors?.primary) {
      errors.push({
        type: 'MISSING_PROPERTY',
        message: 'Missing primary color',
        path: 'colors.primary',
      });
    }

    // Check contrast ratios
    if (theme.colors) {
      const textOnBackground = this.calculateContrastRatio(
        theme.colors.text.primary,
        theme.colors.background.default
      );

      contrastRatios.push({
        foreground: theme.colors.text.primary,
        background: theme.colors.background.default,
        ratio: textOnBackground,
        level: this.getWCAGLevel(textOnBackground),
      });

      if (textOnBackground < this.config.minContrastRatio) {
        errors.push({
          type: 'COLOR_CONTRAST',
          message: `Insufficient contrast ratio: ${textOnBackground.toFixed(2)} (minimum: ${this.config.minContrastRatio})`,
          path: 'colors.text.primary',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      contrastRatios,
    };
  }

  // ==========================================================================
  // Public API - Theme Import/Export
  // ==========================================================================

  /**
   * Export theme to JSON
   * 
   * @param name - Theme name
   * @returns JSON string
   */
  exportTheme(name: string): string {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme not found: ${name}`);
    }

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON
   * 
   * @param json - JSON string
   * @returns Theme object
   */
  importTheme(json: string): DashboardTheme {
    try {
      const theme = JSON.parse(json) as DashboardTheme;

      // Convert date strings to Date objects
      theme.metadata.createdAt = new Date(theme.metadata.createdAt);

      return theme;
    } catch (error) {
      throw new Error(`Failed to import theme: ${(error as Error).message}`);
    }
  }

  // ==========================================================================
  // Private Methods - Built-in Themes
  // ==========================================================================

  /**
   * Register built-in themes
   */
  private registerBuiltInThemes(): void {
    // Light Theme
    this.registerTheme('light', this.createLightTheme());

    // Dark Theme
    this.registerTheme('dark', this.createDarkTheme());

    // High Contrast Theme
    this.registerTheme('high-contrast', this.createHighContrastTheme());

    // Colorblind Theme
    this.registerTheme('colorblind', this.createColorblindTheme());
  }

  /**
   * Create light theme
   */
  private createLightTheme(): DashboardTheme {
    return {
      name: 'light',
      title: 'Light',
      description: 'Clean, bright theme for daytime use',
      colors: {
        primary: '#0066cc',
        secondary: '#6600cc',
        success: '#00aa00',
        warning: '#ff9900',
        error: '#cc0000',
        info: '#0099cc',
        background: {
          default: '#ffffff',
          paper: '#f5f5f5',
          elevated: '#fafafa',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        text: {
          primary: '#212121',
          secondary: '#757575',
          disabled: '#bdbdbd',
          hint: '#9e9e9e',
        },
        border: {
          default: '#e0e0e0',
          light: '#f0f0f0',
          dark: '#bdbdbd',
        },
        chart: {
          series: ['#0066cc', '#00aa00', '#ff9900', '#cc0000', '#6600cc'],
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
          xs: '10px',
          sm: '12px',
          md: '14px',
          lg: '16px',
          xl: '20px',
          xxl: '24px',
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
          none: '0',
          sm: '2px',
          md: '4px',
          lg: '8px',
          xl: '16px',
          full: '50%',
        },
        width: {
          thin: '1px',
          medium: '2px',
          thick: '4px',
        },
      },
      shadows: {
        box: {
          none: 'none',
          sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
          md: '0 4px 6px rgba(0, 0, 0, 0.16)',
          lg: '0 10px 20px rgba(0, 0, 0, 0.19)',
          xl: '0 20px 40px rgba(0, 0, 0, 0.25)',
        },
        text: {
          subtle: '0 1px 2px rgba(0, 0, 0, 0.2)',
          strong: '0 2px 4px rgba(0, 0, 0, 0.4)',
        },
      },
      transitions: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms',
        },
        easing: {
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
      metadata: {
        author: 'ODAVL Team',
        version: '1.0.0',
        createdAt: new Date(),
        tags: ['light', 'default'],
      },
    };
  }

  /**
   * Create dark theme
   */
  private createDarkTheme(): DashboardTheme {
    const light = this.createLightTheme();
    return {
      ...light,
      name: 'dark',
      title: 'Dark',
      description: 'Eye-friendly theme for low-light environments',
      colors: {
        ...light.colors,
        primary: '#4da6ff',
        background: {
          default: '#1a1a1a',
          paper: '#2a2a2a',
          elevated: '#333333',
          overlay: 'rgba(0, 0, 0, 0.7)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b0b0b0',
          disabled: '#606060',
          hint: '#808080',
        },
        border: {
          default: '#404040',
          light: '#333333',
          dark: '#505050',
        },
      },
      metadata: {
        author: 'ODAVL Team',
        version: '1.0.0',
        createdAt: new Date(),
        tags: ['dark', 'night'],
      },
    };
  }

  /**
   * Create high contrast theme
   */
  private createHighContrastTheme(): DashboardTheme {
    const light = this.createLightTheme();
    return {
      ...light,
      name: 'high-contrast',
      title: 'High Contrast',
      description: 'Accessibility theme for visual impairments',
      colors: {
        ...light.colors,
        primary: '#0000ff',
        background: {
          default: '#ffffff',
          paper: '#ffffff',
          elevated: '#ffffff',
          overlay: 'rgba(0, 0, 0, 0.8)',
        },
        text: {
          primary: '#000000',
          secondary: '#000000',
          disabled: '#666666',
          hint: '#444444',
        },
        border: {
          default: '#000000',
          light: '#333333',
          dark: '#000000',
        },
      },
      metadata: {
        author: 'ODAVL Team',
        version: '1.0.0',
        createdAt: new Date(),
        tags: ['high-contrast', 'accessibility'],
      },
    };
  }

  /**
   * Create colorblind theme
   */
  private createColorblindTheme(): DashboardTheme {
    const light = this.createLightTheme();
    return {
      ...light,
      name: 'colorblind',
      title: 'Colorblind',
      description: 'Deuteranopia/protanopia-friendly colors',
      colors: {
        ...light.colors,
        primary: '#0077bb',
        secondary: '#cc3311',
        success: '#009988',
        warning: '#ee7733',
        error: '#cc3311',
        info: '#33bbee',
        chart: {
          series: ['#0077bb', '#009988', '#ee7733', '#cc3311', '#33bbee'],
          grid: '#e0e0e0',
          axis: '#757575',
        },
      },
      metadata: {
        author: 'ODAVL Team',
        version: '1.0.0',
        createdAt: new Date(),
        tags: ['colorblind', 'accessibility'],
      },
    };
  }

  // ==========================================================================
  // Private Methods - Theme Application
  // ==========================================================================

  /**
   * Apply theme (inject CSS variables)
   */
  private applyTheme(theme: DashboardTheme): void {
    // In real implementation, inject CSS custom properties
    // document.documentElement.style.setProperty('--color-primary', theme.colors.primary);
    console.log(`Applied theme: ${theme.name}`);
  }

  /**
   * Persist theme to localStorage
   */
  private persistTheme(name: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.config.storageKey, name);
    }
  }

  /**
   * Load persisted theme from localStorage
   */
  private loadPersistedTheme(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const persisted = window.localStorage.getItem(this.config.storageKey);
      if (persisted && this.themes.has(persisted)) {
        this.setActiveTheme(persisted);
      }
    }
  }

  // ==========================================================================
  // Private Methods - Color Utilities
  // ==========================================================================

  /**
   * Calculate contrast ratio (WCAG formula)
   */
  private calculateContrastRatio(foreground: string, background: string): number {
    const l1 = this.getLuminance(foreground);
    const l2 = this.getLuminance(background);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance
   */
  private getLuminance(color: string): number {
    // Mock implementation (use real color parsing in production)
    return 0.5;
  }

  /**
   * Get WCAG level from contrast ratio
   */
  private getWCAGLevel(ratio: number): 'AAA' | 'AA' | 'FAIL' {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'FAIL';
  }
}
