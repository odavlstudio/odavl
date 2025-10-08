/*
 * ODAVL WAVE X-1 - Modern Theme Tokens
 * Current Design Analysis:
 * - Colors: Blue-based palette (primary #3b82f6, secondary sky, accent cyan)
 * - Typography: Inter font with display variants
 * - Layout: shadcn/ui with Tailwind, dark/light mode support
 * - Animation: Framer Motion with floating orbs, gradient text
 */

export const modernTheme = {
  // Enhanced Color Palette - Deeper, more sophisticated
  colors: {
    // Core brand colors - evolved from current blue palette
    brand: {
      primary: '#1e40af', // Deeper blue (was #3b82f6)
      primaryLight: '#3b82f6',
      accent: '#06b6d4', // Evolved cyan
      gradient: 'linear-gradient(135deg, #1e40af 0%, #06b6d4 100%)',
      pulse: '#22d3ee', // New pulse color for logo
    },
    
    // Semantic colors for modern UI
    surface: {
      glass: 'rgba(255, 255, 255, 0.1)',
      glow: 'rgba(30, 64, 175, 0.15)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    
    // Enhanced gradients for depth
    gradients: {
      hero: 'radial-gradient(ellipse at top, #1e40af 0%, #0c4a6e 50%, #020617 100%)',
      card: 'linear-gradient(145deg, rgba(30, 64, 175, 0.05), rgba(6, 182, 212, 0.05))',
      text: 'linear-gradient(135deg, #1e40af, #06b6d4, #22d3ee)',
    }
  },

  // Enhanced Typography Scale
  typography: {
    scale: {
      hero: 'clamp(3rem, 8vw, 8rem)', // Responsive hero text
      display: 'clamp(2rem, 5vw, 4rem)',
      heading: 'clamp(1.5rem, 3vw, 2.5rem)',
      body: 'clamp(1rem, 2vw, 1.25rem)',
    },
    
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    }
  },

  // Motion & Animation
  motion: {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    easeOut: [0.25, 0.46, 0.45, 0.94],
    durations: { fast: 0.2, normal: 0.4, slow: 0.8 },
    
    // Signature ODAVL animations
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    },
    
    float: {
      y: [-10, 10, -10],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
    }
  },

  // Modern spacing system
  spacing: {
    container: 'clamp(1rem, 5vw, 6rem)',
    section: 'clamp(4rem, 10vw, 8rem)',
    element: 'clamp(1rem, 3vw, 2rem)',
  }
} as const;