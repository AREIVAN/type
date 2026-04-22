// Theme configuration for TypeLearn

export const theme = {
  colors: {
    background: '#0a0a0a',
    surface: '#18181b',
    surfaceElevated: '#1f1f23',
    border: '#27272a',
    borderLight: '#3f3f46',
    
    accent: '#3b82f6',
    accentHover: '#2563eb',
    
    success: '#22c55e',
    successDim: 'rgba(34, 197, 94, 0.15)',
    
    error: '#ef4444',
    errorDim: 'rgba(239, 68, 68, 0.15)',
    
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    
    caret: '#fafafa',
    caretBackground: 'rgba(250, 250, 250, 0.1)',
  },
  
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },
  
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
    24: '96px',
  },
  
  radii: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
  
  layout: {
    maxWidth: '800px',
    headerHeight: '64px',
    sidebarWidth: '320px',
  },
} as const;

export type Theme = typeof theme;
