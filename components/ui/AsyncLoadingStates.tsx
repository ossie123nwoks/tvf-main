import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export interface AsyncLoadingState {
  isLoading: boolean;
  error: string | null;
  retry?: () => void;
}

export interface AsyncLoadingProps {
  state: AsyncLoadingState;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  retryLabel?: string;
  children: React.ReactNode;
}

export const AsyncLoadingWrapper: React.FC<AsyncLoadingProps> = ({
  state,
  loadingMessage = 'Loading...',
  errorTitle = 'Something went wrong',
  errorMessage = 'We encountered an error. Please try again.',
  retryLabel = 'Try Again',
  children,
}) => {
  const theme = useTheme();

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons
          name="sync"
          size={48}
          color={theme.colors.primary}
          style={styles.loadingIcon}
        />
        <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>
          {loadingMessage}
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.errorContainer}>
        <Card style={[styles.errorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.errorContent}>
            <MaterialIcons
              name="error-outline"
              size={64}
              color={theme.colors.error}
              style={styles.errorIcon}
            />
            <Text style={[styles.errorTitle, { color: theme.colors.error }]}>{errorTitle}</Text>
            <Text style={[styles.errorMessage, { color: theme.colors.secondary }]}>
              {errorMessage}
            </Text>
            {state.retry && (
              <Button
                mode="contained"
                onPress={state.retry}
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                textColor={theme.colors.onPrimary}
              >
                {retryLabel}
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  }

  return <>{children}</>;
};

export const InlineLoadingSpinner: React.FC<{
  isLoading: boolean;
  size?: 'small' | 'large';
  message?: string;
}> = ({ isLoading, size = 'small', message }) => {
  const theme = useTheme();

  if (!isLoading) return null;

  return (
    <View style={styles.inlineContainer}>
      <MaterialIcons
        name="sync"
        size={size === 'large' ? 24 : 16}
        color={theme.colors.primary}
        style={styles.inlineIcon}
      />
      {message && (
        <Text style={[styles.inlineText, { color: theme.colors.secondary }]}>{message}</Text>
      )}
    </View>
  );
};

export const ButtonLoadingState: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}> = ({ isLoading, loadingText = 'Loading...', children }) => {
  if (isLoading) {
    return (
      <View style={styles.buttonLoadingContainer}>
        <MaterialIcons name="sync" size={16} color="#FFFFFF" style={styles.buttonLoadingIcon} />
        <Text style={styles.buttonLoadingText}>{loadingText}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export const FormLoadingState: React.FC<{
  isLoading: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
}> = ({ isLoading, loadingMessage = 'Saving...', children }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.formLoadingContainer}>
        <View style={styles.formLoadingOverlay}>
          <MaterialIcons
            name="save"
            size={48}
            color={theme.colors.primary}
            style={styles.formLoadingIcon}
          />
          <Text style={[styles.formLoadingText, { color: theme.colors.secondary }]}>
            {loadingMessage}
          </Text>
        </View>
        {children}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    maxWidth: 400,
    width: '100%',
  },
  errorContent: {
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    minWidth: 120,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineIcon: {
    // Note: CSS animations don't work in React Native
    // This is a placeholder for future animation implementation
  },
  inlineText: {
    fontSize: 14,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonLoadingIcon: {
    // Note: CSS animations don't work in React Native
    // This is a placeholder for future animation implementation
  },
  buttonLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  formLoadingContainer: {
    position: 'relative',
  },
  formLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  formLoadingIcon: {
    marginBottom: 16,
  },
  formLoadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
