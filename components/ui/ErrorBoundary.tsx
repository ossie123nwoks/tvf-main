import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    // TODO: Implement error reporting service
    console.log('Error reported:', this.state.error);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onReport={this.handleReportError}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onReport: () => void;
}

function ErrorFallback({ error, onRetry, onReport }: ErrorFallbackProps) {
  const { theme } = useTheme();

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
    },
  });

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          We're sorry, but something unexpected happened. Please try again or report this issue if
          it persists.
        </Text>

        {__DEV__ && error && (
          <Text style={styles.errorDetails} numberOfLines={5}>
            {error.message}
          </Text>
        )}

        <View style={styles.actions}>
          <Button mode="contained" onPress={onRetry}>
            Try Again
          </Button>
          <Button mode="outlined" onPress={onReport}>
            Report Issue
          </Button>
        </View>
      </Card>
    </View>
  );
}
