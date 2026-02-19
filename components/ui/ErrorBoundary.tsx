import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

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

// Static styles that don't depend on theme context
const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    maxWidth: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
});

function ErrorFallback({ error, onRetry, onReport }: ErrorFallbackProps) {
  return (
    <View style={fallbackStyles.container}>
      <View style={fallbackStyles.card}>
        <Text style={fallbackStyles.title}>Something went wrong</Text>
        <Text style={fallbackStyles.message}>
          We're sorry, but something unexpected happened. Please try again or report this issue if
          it persists.
        </Text>

        {__DEV__ && error && (
          <Text style={fallbackStyles.errorDetails} numberOfLines={5}>
            {error.message}
          </Text>
        )}

        <View style={fallbackStyles.actions}>
          <Button mode="contained" onPress={onRetry}>
            Try Again
          </Button>
          <Button mode="outlined" onPress={onReport}>
            Report Issue
          </Button>
        </View>
      </View>
    </View>
  );
}
