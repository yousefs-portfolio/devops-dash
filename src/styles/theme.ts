import { createTheme } from '@mui/material/styles';

// OLED-optimized color palette
export const colors = {
  // True black for OLED optimization
  background: {
    primary: '#000000',
    secondary: '#0A0A0A',
    tertiary: '#141414',
    elevated: '#1A1A1A',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  // Neon accent colors for critical data visualization
  accent: {
    critical: '#FF0040', // Piercing Red
    warning: '#39FF14', // Cyber Lime
    success: '#00D4FF', // Electric Blue
    info: '#8B5CF6', // Gradient Purple
  },
  
  // Neutral colors
  neutral: {
    50: '#FFFFFF',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#2D2D2D',
    900: '#1A1A1A',
  },
  
  // Glassmorphism effects
  glass: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.08)',
    heavy: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Severity colors for monitoring
  severity: {
    critical: '#FF0040',
    high: '#FF4444',
    medium: '#FFA500',
    low: '#39FF14',
    info: '#00D4FF',
  },
};

// Typography configuration
export const typography = {
  fontFamily: {
    primary: 'Inter var, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Courier, monospace',
  },
  sizes: {
    xs: 'clamp(0.75rem, 1vw, 0.875rem)',
    sm: 'clamp(0.875rem, 1.2vw, 1rem)',
    base: 'clamp(1rem, 1.4vw, 1.125rem)',
    lg: 'clamp(1.125rem, 1.6vw, 1.25rem)',
    xl: 'clamp(1.25rem, 2vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 2.5vw, 1.875rem)',
    '3xl': 'clamp(1.875rem, 3vw, 2.25rem)',
    '4xl': 'clamp(2.25rem, 4vw, 3rem)',
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// Material-UI theme configuration
export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.accent.info,
      light: '#A78BFA',
      dark: '#6D28D9',
    },
    secondary: {
      main: colors.accent.success,
      light: '#22D3EE',
      dark: '#0891B2',
    },
    error: {
      main: colors.accent.critical,
      light: '#FF4444',
      dark: '#CC0033',
    },
    warning: {
      main: colors.accent.warning,
      light: '#4ADE19',
      dark: '#16A34A',
    },
    success: {
      main: colors.accent.success,
      light: '#22D3EE',
      dark: '#0891B2',
    },
    background: {
      default: colors.background.primary,
      paper: colors.background.secondary,
    },
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[300],
    },
  },
  typography: {
    fontFamily: typography.fontFamily.primary,
    h1: {
      fontSize: typography.sizes['4xl'],
      fontWeight: typography.weights.bold,
    },
    h2: {
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.semibold,
    },
    h3: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.semibold,
    },
    h4: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.medium,
    },
    h5: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.medium,
    },
    h6: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
    },
    body1: {
      fontSize: typography.sizes.base,
    },
    body2: {
      fontSize: typography.sizes.sm,
    },
    caption: {
      fontSize: typography.sizes.xs,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.background.elevated,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.glass.border}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.glass.light,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.glass.border}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: typography.weights.medium,
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Animation durations
export const animations = {
  durations: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  easings: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// Spacing system
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
};

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
};

export default muiTheme;