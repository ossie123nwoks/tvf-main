import React, { Component, ReactNode } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { errorHandler } from '@/lib/utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  onReport?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isNetworkError: boolean;
  retryCount: number;
}

export default class NetworkErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isNetworkError: errorHandler.isNetworkError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (__DEV__) {
      console.error('NetworkErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for network errors
    if (errorHandler.isNetworkError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      hasError: false,
      error: null,
      errorInfo: null,
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleReportError = () => {
    if (this.props.onReport) {
      this.props.onReport();
    } else {
      // Default error reporting
      Alert.alert(
        'Report Error',
        'Thank you for reporting this issue. Our team will investigate and fix it as soon as possible.',
        [{ text: 'OK' }]
      );
    }
  };

  private handleGoBack = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <NetworkErrorFallback
          error={this.state.error}
          isNetworkError={this.state.isNetworkError}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.handleRetry}
          onReport={this.handleReportError}
          onGoBack={this.handleGoBack}
        />
      );
    }

    return this.props.children;
  }
}

interface NetworkErrorFallbackProps {
  error: Error | null;
  isNetworkError: boolean;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReport: () => void;
  onGoBack: () => void;
}

function NetworkErrorFallback({
  error,
  isNetworkError,
  retryCount,
  maxRetries,
  onRetry,
  onReport,
  onGoBack,
}: NetworkErrorFallbackProps) {
  const { theme } = useTheme();

  const getErrorIcon = () => {
    if (isNetworkError) {
      return 'wifi-off';
    }
    return 'error-outline';
  };

  const getErrorTitle = () => {
    if (isNetworkError) {
      return 'Network Connection Error';
    }
    return 'Something went wrong';
  };

  const getErrorMessage = () => {
    if (isNetworkError) {
      if (retryCount >= maxRetries) {
        return 'Unable to connect to the server after multiple attempts. Please check your internet connection and try again.';
      }
      return "We're having trouble connecting to our servers. This might be due to a poor internet connection or server maintenance.";
    }
    return "We're sorry, but something unexpected happened. Please try again or report this issue if it persists.";
  };

  const getRetryButtonText = () => {
    if (isNetworkError && retryCount < maxRetries) {
      return `Try Again (${retryCount + 1}/${maxRetries})`;
    }
    return 'Try Again';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
    card: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      maxWidth: 400,
      width: '100%',
    },
    icon: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.error,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
      lineHeight: 24,
    },
    errorDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
      fontFamily: 'monospace',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      maxWidth: '100%',
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
    },
    reportButton: {
      borderColor: theme.colors.primary,
    },
    backButton: {
      borderColor: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons
          name={getErrorIcon() as any}
          size={64}
          color={theme.colors.error}
          style={styles.icon}
        />

        <Text style={styles.title}>{getErrorTitle()}</Text>
        <Text style={styles.message}>{getErrorMessage()}</Text>

        {__DEV__ && error && (
          <Text style={styles.errorDetails} numberOfLines={5}>
            {error.message}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.retryButton}
            textColor={theme.colors.onPrimary}
            disabled={isNetworkError && retryCount >= maxRetries}
          >
            {getRetryButtonText()}
          </Button>

          <Button
            mode="outlined"
            onPress={onReport}
            style={styles.reportButton}
            textColor={theme.colors.primary}
          >
            Report Issue
          </Button>

          <Button
            mode="outlined"
            onPress={onGoBack}
            style={styles.backButton}
            textColor={theme.colors.textSecondary}
          >
            Go Back
          </Button>
        </View>
      </Card>
    </View>
  );
}
