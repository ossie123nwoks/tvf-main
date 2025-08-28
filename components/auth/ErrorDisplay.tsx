import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { mapAuthError, getErrorSeverityColor, AuthErrorInfo } from '@/lib/auth/errorHandler';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  showActionButton?: boolean;
  showDismissButton?: boolean;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showActionButton = true,
  showDismissButton = true,
  compact = false,
}) => {
  const { theme } = useTheme();

  if (!error) return null;

  const errorInfo: AuthErrorInfo = mapAuthError(error);
  const severityColor = getErrorSeverityColor(errorInfo.severity);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: severityColor,
    },
    compactCard: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: severityColor,
      padding: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: compact ? theme.spacing.xs : theme.spacing.sm,
    },
    severityIcon: {
      marginRight: theme.spacing.sm,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    message: {
      fontSize: compact ? 12 : 14,
      color: theme.colors.textSecondary,
      lineHeight: compact ? 16 : 20,
      marginBottom: compact ? theme.spacing.xs : theme.spacing.sm,
    },
    actionRequired: {
      fontSize: compact ? 11 : 12,
      color: severityColor,
      fontStyle: 'italic',
      marginBottom: compact ? theme.spacing.xs : theme.spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    retryButton: {
      minWidth: 80,
    },
    dismissButton: {
      minWidth: 80,
    },
    compactActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    compactRetryButton: {
      minWidth: 60,
      height: 32,
    },
    compactDismissButton: {
      minWidth: 60,
      height: 32,
    },
  });

  const getSeverityIcon = () => {
    switch (errorInfo.severity) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'alert-circle';
    }
  };

  const getSeverityTitle = () => {
    switch (errorInfo.severity) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  if (compact) {
    return (
      <View style={styles.container}>
        <Card style={styles.compactCard}>
          <View style={styles.header}>
            <IconButton
              icon={getSeverityIcon()}
              size={16}
              iconColor={severityColor}
              style={styles.severityIcon}
            />
            <Text style={styles.title}>{getSeverityTitle()}</Text>
          </View>

          <Text style={styles.message}>{errorInfo.userMessage}</Text>

          {errorInfo.actionRequired && (
            <Text style={styles.actionRequired}>{errorInfo.actionRequired}</Text>
          )}

          <View style={styles.compactActions}>
            {showActionButton && errorInfo.retryable && onRetry && (
              <Button
                mode="outlined"
                onPress={onRetry}
                style={styles.compactRetryButton}
                labelStyle={{ fontSize: 11 }}
              >
                Retry
              </Button>
            )}

            {showDismissButton && onDismiss && (
              <Button
                mode="text"
                onPress={onDismiss}
                style={styles.compactDismissButton}
                labelStyle={{ fontSize: 11 }}
              >
                Dismiss
              </Button>
            )}
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <IconButton
              icon={getSeverityIcon()}
              size={20}
              iconColor={severityColor}
              style={styles.severityIcon}
            />
            <Text style={styles.title}>{getSeverityTitle()}</Text>
          </View>

          <Text style={styles.message}>{errorInfo.userMessage}</Text>

          {errorInfo.actionRequired && (
            <Text style={styles.actionRequired}>{errorInfo.actionRequired}</Text>
          )}

          <View style={styles.actions}>
            {showActionButton && errorInfo.retryable && onRetry && (
              <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
                Try Again
              </Button>
            )}

            {showDismissButton && onDismiss && (
              <Button mode="outlined" onPress={onDismiss} style={styles.dismissButton}>
                Dismiss
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

// Inline error display for form fields
export const InlineError: React.FC<{ error?: string }> = ({ error }) => {
  const { theme } = useTheme();

  if (!error) return null;

  const styles = StyleSheet.create({
    container: {
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    text: {
      color: theme.colors.error,
      fontSize: 12,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{error}</Text>
    </View>
  );
};

// Success message display
export const SuccessMessage: React.FC<{
  message: string;
  onDismiss?: () => void;
  compact?: boolean;
}> = ({ message, onDismiss, compact = false }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.success,
      borderLeftWidth: 4,
      borderLeftColor: '#2e7d32',
    },
    compactCard: {
      backgroundColor: theme.colors.success,
      borderLeftWidth: 3,
      borderLeftColor: '#2e7d32',
      padding: theme.spacing.sm,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    message: {
      color: '#FFFFFF',
      fontSize: compact ? 12 : 14,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    dismissButton: {
      minWidth: compact ? 60 : 80,
      height: compact ? 32 : 40,
    },
  });

  return (
    <View style={styles.container}>
      <Card style={compact ? styles.compactCard : styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.message}>{message}</Text>

          {onDismiss && (
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.dismissButton}
              textColor="#FFFFFF"
              buttonColor="transparent"
              labelStyle={{ fontSize: compact ? 11 : 12 }}
            >
              Dismiss
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};
