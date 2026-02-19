export interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    onBackground: string;
    onSurface: string;
    onSurfaceVariant: string;
    disabled: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    error: string;
    success: string;
    warning: string;
    info: string;
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
    // Content types
    sermon: string;
    article: string;
    category: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
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

export const lightTheme: AppTheme = {
  colors: {
    primary: '#1d3557', // Dark blue as requested
    secondary: '#457b9d', // Complementary blue variant
    background: '#F8FAFC', // Background from design system
    surface: '#FFFFFF', // Card background
    surfaceVariant: '#F1F5F9', // Light background variant
    onBackground: '#1E293B', // Text primary
    onSurface: '#1E293B', // Text primary
    onSurfaceVariant: '#64748B', // Text secondary
    disabled: '#94A3B8', // Text muted
    text: '#1E293B', // Text primary
    textSecondary: '#64748B', // Text secondary
    textTertiary: '#94A3B8', // Text muted
    border: '#E2E8F0', // Border from design system
    borderLight: '#F1F5F9', // Light border
    error: '#EF4444', // Red for errors
    success: '#10B981', // Green for success
    warning: '#F59E0B', // Amber for warnings
    info: '#1d3557', // Dark blue for info
    // Content-specific colors
    cardBackground: '#FFFFFF', // Card background
    cardBorder: '#E2E8F0', // Card border
    cardShadow: '#000000', // Card shadow
    // Interactive elements
    ripple: '#457b9d', // Blue for ripple
    overlay: '#000000', // Overlay
    // Status colors
    online: '#10B981', // Green for online
    offline: '#EF4444', // Red for offline
    // Audio player specific
    audioProgress: '#1d3557', // Dark blue for progress
    audioProgressBackground: '#457b9d', // Blue for background
    audioControl: '#1d3557', // Dark blue for controls
    // Content types
    sermon: '#1d3557', // Dark blue for sermons
    article: '#457b9d', // Blue for articles
    category: '#457b9d', // Blue for categories
  },
  spacing: {
    xs: 4, // xs from design system
    sm: 8, // sm from design system
    md: 16, // md from design system
    lg: 24, // lg from design system
    xl: 32, // xl from design system
  },
  borderRadius: {
    sm: 8, // sm from design system
    md: 12, // md from design system
    lg: 16, // lg from design system
  },
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export const darkTheme: AppTheme = {
  colors: {
    primary: '#60A5FA', // Bright sky blue - pops against dark background
    secondary: '#8B5CF6', // Vibrant purple for modern contrast
    background: '#0F172A', // Dark background
    surface: '#1E293B', // Dark surface
    surfaceVariant: '#334155', // Dark surface variant
    onBackground: '#F8FAFC', // Light text on dark background
    onSurface: '#F8FAFC', // Light text on dark surface
    onSurfaceVariant: '#CBD5E1', // Light text on dark surface variant
    disabled: '#64748B', // Muted text
    text: '#F8FAFC', // Primary text
    textSecondary: '#CBD5E1', // Secondary text
    textTertiary: '#94A3B8', // Tertiary text
    border: '#334155', // Dark border
    borderLight: '#475569', // Light dark border
    error: '#F87171', // Red for errors
    success: '#34D399', // Green for success
    warning: '#FBBF24', // Amber for warnings
    info: '#60A5FA', // Bright sky blue for info
    // Content-specific colors
    cardBackground: '#1E293B', // Dark card background
    cardBorder: '#334155', // Dark card border
    cardShadow: '#000000', // Card shadow
    // Interactive elements
    ripple: '#8B5CF6', // Vibrant purple for ripple
    overlay: '#000000', // Overlay
    // Status colors
    online: '#34D399', // Green for online
    offline: '#F87171', // Red for offline
    // Audio player specific
    audioProgress: '#60A5FA', // Bright sky blue for progress
    audioProgressBackground: '#8B5CF6', // Vibrant purple for background
    audioControl: '#60A5FA', // Bright sky blue for controls
    // Content types
    sermon: '#60A5FA', // Bright sky blue for sermons
    article: '#A78BFA', // Lighter purple for articles
    category: '#A78BFA', // Lighter purple for categories
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};
