// ============================================================================
// TVF Church App — Design System
// A modern, clean, spiritual aesthetic with consistent tokens
// ============================================================================

export interface TypographyStyle {
  fontSize: number;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight: number;
  letterSpacing?: number;
}

export interface AppTheme {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    surfaceElevated: string;
    onBackground: string;
    onSurface: string;
    onSurfaceVariant: string;
    onPrimary: string;
    disabled: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    outline: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    // Container colors
    primaryContainer: string;
    errorContainer: string;
    warningContainer: string;
    successContainer: string;
    // Content-specific colors
    cardBackground: string;
    cardBorder: string;
    cardShadow: string;
    // Interactive elements
    ripple: string;
    overlay: string;
    // Status colors
    online: string;
    offline: string;
    // Audio player specific
    audioProgress: string;
    audioProgressBackground: string;
    audioControl: string;
    audioSurface: string;
    // Content types
    sermon: string;
    article: string;
    category: string;
    // Skeleton / shimmer
    skeleton: string;
    skeletonHighlight: string;
  };
  typography: {
    displayLarge: TypographyStyle;
    displayMedium: TypographyStyle;
    headlineLarge: TypographyStyle;
    headlineMedium: TypographyStyle;
    headlineSmall: TypographyStyle;
    titleLarge: TypographyStyle;
    titleMedium: TypographyStyle;
    titleSmall: TypographyStyle;
    bodyLarge: TypographyStyle;
    bodyMedium: TypographyStyle;
    bodySmall: TypographyStyle;
    labelLarge: TypographyStyle;
    labelMedium: TypographyStyle;
    labelSmall: TypographyStyle;
    caption: TypographyStyle;
  };
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  iconSizes: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  animation: {
    fast: number;
    normal: number;
    slow: number;
  };
  shadows: {
    none: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    small: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// Shared typography scale (consistent across light/dark)
const typographyScale: AppTheme['typography'] = {
  displayLarge: { fontSize: 34, fontWeight: '700', lineHeight: 42, letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.25 },
  headlineLarge: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  headlineMedium: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  headlineSmall: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  titleLarge: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  titleMedium: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  titleSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  labelLarge: { fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, fontWeight: '500', lineHeight: 16, letterSpacing: 0.5 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};

// Shared spacing – consistent in both themes
const spacingScale: AppTheme['spacing'] = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Shared border radius – consistent in both themes
const borderRadiusScale: AppTheme['borderRadius'] = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

const iconSizes: AppTheme['iconSizes'] = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const animationDurations: AppTheme['animation'] = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// ============================================================================
// LIGHT THEME — Clean, Calm, Spiritual
// Primary: Deep Navy (#1A2B4A) — trustworthy, spiritual depth
// Accent: Warm Gold (#C4953A) — premium, spiritual warmth
// ============================================================================
export const lightTheme: AppTheme = {
  colors: {
    primary: '#1A2B4A',         // Deep navy — spiritual trust
    primaryLight: '#2D4A7A',    // Lighter navy
    primaryDark: '#0F1A30',     // Darker navy
    secondary: '#457B9D',       // Calm blue
    secondaryLight: '#6BA3C7',  // Light calm blue
    accent: '#C4953A',          // Warm gold accent
    background: '#F7F8FA',      // Soft warm white
    surface: '#FFFFFF',         // Pure white surfaces
    surfaceVariant: '#F0F2F5',  // Subtle background variant
    surfaceElevated: '#FFFFFF', // Elevated cards
    onBackground: '#1A1A2E',   // Primary text
    onSurface: '#1A1A2E',      // Surface text
    onSurfaceVariant: '#5A6178',// Secondary text
    onPrimary: '#FFFFFF',       // Text on primary
    disabled: '#B0B7C3',       // Disabled text
    text: '#1A1A2E',           // Primary text
    textSecondary: '#5A6178',  // Secondary text (softer)
    textTertiary: '#8E95A7',   // Tertiary text (muted)
    border: '#E4E7ED',         // Default border
    borderLight: '#F0F2F5',    // Subtle border
    outline: '#CBD0D8',        // Outline
    error: '#DC3545',          // Accessible red
    success: '#28A745',        // Accessible green
    warning: '#E8A317',        // Warm amber
    info: '#1A2B4A',           // Info = primary
    // Containers
    primaryContainer: '#E8EDF5',
    errorContainer: '#FDECEA',
    warningContainer: '#FFF8E6',
    successContainer: '#E6F4EA',
    // Content
    cardBackground: '#FFFFFF',
    cardBorder: '#E4E7ED',
    cardShadow: '#1A2B4A',
    // Interactive
    ripple: 'rgba(26, 43, 74, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    // Status
    online: '#28A745',
    offline: '#DC3545',
    // Audio player
    audioProgress: '#1A2B4A',
    audioProgressBackground: '#E4E7ED',
    audioControl: '#1A2B4A',
    audioSurface: '#F0F2F5',
    // Content types
    sermon: '#1A2B4A',
    article: '#457B9D',
    category: '#C4953A',
    // Skeleton
    skeleton: '#E8EBF0',
    skeletonHighlight: '#F5F6F8',
  },
  typography: typographyScale,
  spacing: spacingScale,
  borderRadius: borderRadiusScale,
  iconSizes,
  animation: animationDurations,
  shadows: {
    none: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#1A2B4A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1A2B4A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#1A2B4A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

// ============================================================================
// DARK THEME — Elegant, Modern, Immersive
// Primary: Bright Sky (#60A5FA) — pops against dark
// Accent: Warm Amber (#F5B041)
// ============================================================================
export const darkTheme: AppTheme = {
  colors: {
    primary: '#60A5FA',          // Bright sky blue
    primaryLight: '#93C5FD',     // Lighter sky blue
    primaryDark: '#2563EB',      // Deeper blue
    secondary: '#8B5CF6',        // Vibrant purple
    secondaryLight: '#A78BFA',   // Light purple
    accent: '#F5B041',           // Warm amber
    background: '#0C1221',       // Deep dark blue-black
    surface: '#162032',          // Dark navy surface
    surfaceVariant: '#1E2D45',   // Slightly lighter surface
    surfaceElevated: '#1E2D45',  // Elevated cards
    onBackground: '#E8ECF1',     // Light text
    onSurface: '#E8ECF1',        // Surface text
    onSurfaceVariant: '#A0AAB8', // Secondary text
    onPrimary: '#0C1221',        // Text on primary
    disabled: '#4A5568',         // Disabled text
    text: '#E8ECF1',             // Primary text
    textSecondary: '#A0AAB8',    // Secondary text
    textTertiary: '#6B7A8D',     // Tertiary text
    border: '#2A3A50',           // Subtle border
    borderLight: '#1E2D45',      // Very subtle border
    outline: '#3D4F65',          // Outline
    error: '#F87171',            // Bright red
    success: '#34D399',          // Bright green
    warning: '#FBBF24',          // Bright amber
    info: '#60A5FA',             // Info = primary
    // Containers
    primaryContainer: '#1E3A5F',
    errorContainer: '#4A1C1C',
    warningContainer: '#4A3519',
    successContainer: '#1A3D2E',
    // Content
    cardBackground: '#162032',
    cardBorder: '#2A3A50',
    cardShadow: '#000000',
    // Interactive
    ripple: 'rgba(96, 165, 250, 0.12)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    // Status
    online: '#34D399',
    offline: '#F87171',
    // Audio player
    audioProgress: '#60A5FA',
    audioProgressBackground: '#2A3A50',
    audioControl: '#60A5FA',
    audioSurface: '#1E2D45',
    // Content types
    sermon: '#60A5FA',
    article: '#A78BFA',
    category: '#F5B041',
    // Skeleton
    skeleton: '#1E2D45',
    skeletonHighlight: '#2A3A50',
  },
  typography: typographyScale,
  spacing: spacingScale,
  borderRadius: borderRadiusScale,
  iconSizes,
  animation: animationDurations,
  shadows: {
    none: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};
