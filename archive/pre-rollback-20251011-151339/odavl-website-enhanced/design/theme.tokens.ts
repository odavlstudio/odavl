/*
 * ODAVL WAVE X-1 - Modern Theme Tokens
 * Current Design Analysis:
 * - Colors: Blue-based palette (primary #3b82f6, secondary sky, accent cyan)
 * - Typography: Inter font with display variants
 * - Layout: shadcn/ui with Tailwind, dark/light mode support
 * - Animation: Framer Motion with floating orbs, gradient text
 */

export const modernTheme = {
  // Enhanced Color Palette - Enterprise-grade sophistication
  colors: {
    // Core brand colors - ODAVL signature navy with electric accents
    brand: {
      navy: '#0f3460',        // ODAVL signature navy
      primary: '#1e40af',     // Enhanced primary blue
      primaryLight: '#3b82f6', // Lighter blue for interactive states
      accent: '#00d4ff',      // Electric cyan for intelligence/AI
      accentSoft: '#06b6d4',  // Softer cyan for secondary elements
      pulse: '#22d3ee',       // Pulse animation color
      gradient: 'linear-gradient(135deg, #0f3460 0%, #1e40af 50%, #00d4ff 100%)',
    },
    
    // Enterprise semantic colors
    semantic: {
      success: '#10b981',   // Green for positive outcomes
      warning: '#f59e0b',   // Amber for caution states
      error: '#ef4444',     // Red for error states
      info: '#0ea5e9',      // Blue for informational content
    },
    
    // Glass morphism and surface colors
    surface: {
      glass: 'rgba(255, 255, 255, 0.08)',
      glassHover: 'rgba(255, 255, 255, 0.12)',
      glassBorder: 'rgba(255, 255, 255, 0.16)',
      glow: 'rgba(15, 52, 96, 0.2)',
      shadow: 'rgba(0, 0, 0, 0.15)',
      overlay: 'rgba(15, 52, 96, 0.85)',
    },
    
    // Enhanced gradients for sophisticated depth
    gradients: {
      hero: 'radial-gradient(ellipse at top, #0f3460 0%, #1e40af 35%, #0c4a6e 70%, #020617 100%)',
      heroOverlay: 'linear-gradient(135deg, rgba(15, 52, 96, 0.9) 0%, rgba(30, 64, 175, 0.8) 50%, rgba(0, 212, 255, 0.1) 100%)',
      card: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(0, 212, 255, 0.02))',
      cardHover: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(0, 212, 255, 0.05))',
      text: 'linear-gradient(135deg, #0f3460, #1e40af, #00d4ff)',
      cta: 'linear-gradient(135deg, #00d4ff 0%, #1e40af 100%)',
      ctaHover: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
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