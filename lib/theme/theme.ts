export interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
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
    primary: '#1976D2',
    secondary: '#424242',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceVariant: '#FAFAFA',
    text: '#212121',
    textSecondary: '#757575',
    textTertiary: '#9E9E9E',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    info: '#1976D2',
    // Content-specific colors
    cardBackground: '#FFFFFF',
    cardBorder: '#E0E0E0',
    cardShadow: '#000000',
    // Interactive elements
    ripple: '#E3F2FD',
    overlay: '#000000',
    // Status colors
    online: '#4CAF50',
    offline: '#F44336',
    // Audio player specific
    audioProgress: '#1976D2',
    audioProgressBackground: '#E3F2FD',
    audioControl: '#1976D2',
    // Content types
    sermon: '#2196F3',
    article: '#4CAF50',
    category: '#FF9800',
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
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
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
    primary: '#90CAF9',
    secondary: '#BDBDBD',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#BDBDBD',
    textTertiary: '#757575',
    border: '#424242',
    borderLight: '#2A2A2A',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFB74D',
    info: '#64B5F6',
    // Content-specific colors
    cardBackground: '#1E1E1E',
    cardBorder: '#424242',
    cardShadow: '#000000',
    // Interactive elements
    ripple: '#1A237E',
    overlay: '#000000',
    // Status colors
    online: '#81C784',
    offline: '#E57373',
    // Audio player specific
    audioProgress: '#90CAF9',
    audioProgressBackground: '#1A237E',
    audioControl: '#90CAF9',
    // Content types
    sermon: '#64B5F6',
    article: '#81C784',
    category: '#FFB74D',
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
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
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
