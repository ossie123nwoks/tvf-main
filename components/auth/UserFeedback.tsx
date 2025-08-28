import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface UserFeedbackProps {
  type: 'loading' | 'success' | 'info' | 'progress';
  message: string;
  subMessage?: string;
  progress?: number; // 0-100
  showIcon?: boolean;
  compact?: boolean;
  autoHide?: boolean;
  onComplete?: () => void;
}

export const UserFeedback: React.FC<UserFeedbackProps> = ({
  type,
  message,
  subMessage,
  progress,
  showIcon = true,
  compact = false,
  autoHide = false,
  onComplete,
}) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (type === 'success' && autoHide) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [type, autoHide, fadeAnim, scaleAnim, onComplete]);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: getTypeColor(),
    },
    compactCard: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: getTypeColor(),
      padding: theme.spacing.sm,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      marginRight: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
    },
    message: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: subMessage ? (compact ? 2 : 4) : 0,
    },
    subMessage: {
      fontSize: compact ? 12 : 14,
      color: theme.colors.textSecondary,
      lineHeight: compact ? 16 : 20,
    },
    progressContainer: {
      marginTop: theme.spacing.sm,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: getTypeColor(),
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
  });

  function getTypeColor(): string {
    switch (type) {
      case 'loading':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'info':
        return theme.colors.info;
      case 'progress':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  }

  function getTypeIcon(): string {
    switch (type) {
      case 'loading':
        return 'loading';
      case 'success':
        return 'check-circle';
      case 'info':
        return 'information';
      case 'progress':
        return 'progress-clock';
      default:
        return 'information';
    }
  }

  function renderIcon() {
    if (!showIcon) return null;

    if (type === 'loading') {
      return (
        <View style={styles.iconContainer}>
          <ActivityIndicator size={compact ? 20 : 24} color={getTypeColor()} />
        </View>
      );
    }

    return (
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getTypeIcon() as any}
          size={compact ? 20 : 24}
          color={getTypeColor()}
        />
      </View>
    );
  }

  function renderProgress() {
    if (type !== 'progress' || progress === undefined) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    );
  }

  const cardStyle = compact ? styles.compactCard : styles.card;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Card style={cardStyle}>
        <Card.Content style={styles.content}>
          {renderIcon()}

          <View style={styles.textContainer}>
            <Text style={styles.message}>{message}</Text>
            {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
          </View>
        </Card.Content>

        {renderProgress()}
      </Card>
    </Animated.View>
  );
};

// Loading overlay for full-screen operations
export const LoadingOverlay: React.FC<{
  visible: boolean;
  message?: string;
  subMessage?: string;
}> = ({ visible, message = 'Loading...', subMessage }) => {
  const { theme } = useTheme();

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.xl,
      alignItems: 'center',
      maxWidth: 300,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    message: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: subMessage ? theme.spacing.sm : 0,
    },
    subMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size={48} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
        {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
      </View>
    </View>
  );
};

// Toast notification for quick feedback
export const Toast: React.FC<{
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onHide: () => void;
}> = ({ visible, message, type, duration = 3000, onHide }) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 50,
      left: theme.spacing.md,
      right: theme.spacing.md,
      zIndex: 1001,
    },
    toast: {
      backgroundColor: getToastColor(),
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    message: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    closeButton: {
      marginLeft: theme.spacing.sm,
    },
  });

  function getToastColor(): string {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'info':
        return theme.colors.info;
      case 'warning':
        return '#f57c00';
      default:
        return theme.colors.primary;
    }
  }

  function getToastIcon(): string {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
        return 'information';
      case 'warning':
        return 'alert';
      default:
        return 'information';
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toast}>
        <MaterialCommunityIcons
          name={getToastIcon() as any}
          size={20}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
        <MaterialCommunityIcons
          name="close"
          size={20}
          color="#FFFFFF"
          style={styles.closeButton}
          onPress={hideToast}
        />
      </View>
    </Animated.View>
  );
};
