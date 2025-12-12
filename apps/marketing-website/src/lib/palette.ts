/**
 * ODAVL Studio Brand Color Palette
 * 
 * Primary Colors: Blue and Purple (trust, intelligence, innovation)
 * Accent: Green (success, growth, quality)
 * Neutrals: Dark slate and light gray (professionalism, clarity)
 */

export const palette = {
  // Primary Brand Colors
  blue: {
    DEFAULT: '#3b82f6',   // Primary blue - main brand color
    light: '#60a5fa',     // Light blue - hover states
    dark: '#2563eb',      // Dark blue - active states
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },

  purple: {
    DEFAULT: '#8b5cf6',   // Primary purple - secondary brand color
    light: '#a78bfa',     // Light purple - hover states
    dark: '#7c3aed',      // Dark purple - active states
    50: '#faf5ff',
    100: '#f3e8ff',
    500: '#8b5cf6',
    600: '#7c3aed',
    900: '#581c87',
  },

  // Accent Colors
  green: {
    DEFAULT: '#10b981',   // Success green - positive states
    light: '#34d399',     // Light green - hover
    dark: '#059669',      // Dark green - active
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    900: '#064e3b',
  },

  // Neutral Colors
  dark: {
    DEFAULT: '#1e293b',   // Primary dark - backgrounds
    light: '#334155',     // Light dark - secondary backgrounds
    lighter: '#475569',   // Lighter dark - tertiary backgrounds
  },

  light: {
    DEFAULT: '#f8fafc',   // Primary light - light backgrounds
    dark: '#f1f5f9',      // Dark light - hover states
    darker: '#e2e8f0',    // Darker light - borders
  },

  // Semantic Colors
  error: '#ef4444',       // Error states
  warning: '#f59e0b',     // Warning states
  info: '#3b82f6',        // Info states (uses blue)
  success: '#10b981',     // Success states (uses green)

  // Text Colors
  text: {
    primary: '#0f172a',   // Primary text
    secondary: '#475569', // Secondary text
    tertiary: '#94a3b8',  // Tertiary text
    inverse: '#ffffff',   // Inverse text (on dark backgrounds)
  },

  // Background Colors
  background: {
    primary: '#ffffff',   // Primary background
    secondary: '#f8fafc', // Secondary background
    tertiary: '#f1f5f9',  // Tertiary background
    dark: '#1e293b',      // Dark background
  },

  // Border Colors
  border: {
    light: '#e2e8f0',     // Light borders
    DEFAULT: '#cbd5e1',   // Default borders
    dark: '#94a3b8',      // Dark borders
  },
};

/**
 * Usage Examples:
 * 
 * CSS: background-color: var(--color-blue-500);
 * Tailwind: bg-brand-blue text-brand-purple
 * TypeScript: palette.blue.DEFAULT
 */

export type BrandColor = keyof typeof palette;
export type ColorShade = keyof typeof palette.blue;
