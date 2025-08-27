import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, ActivityIndicator, Card } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingStatesProps {
  type?: 'content' | 'search' | 'pagination' | 'skeleton' | 'custom';
  message?: string;
  size?: 'small' | 'large';
  showIcon?: boolean;
  iconName?: string;
}

interface ContentSkeletonProps {
  type: 'sermon' | 'article' | 'category';
  count?: number;
}

interface SearchSkeletonProps {
  resultCount?: number;
}

export function LoadingSpinner({ 
  type = 'content', 
  message, 
  size = 'large',
  showIcon = true,
  iconName
}: LoadingStatesProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
      lineHeight: 24,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      opacity: 0.7,
    },
  });

  const getDefaultMessage = () => {
    switch (type) {
      case 'content':
        return 'Loading content...';
      case 'search':
        return 'Searching...';
      case 'pagination':
        return 'Loading more...';
      default:
        return 'Loading...';
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'content':
        return 'content-copy';
      case 'search':
        return 'magnify';
      case 'pagination':
        return 'download';
      default:
        return 'sync';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'content':
        return 'Please wait while we fetch your content';
      case 'search':
        return 'Finding the best results for you';
      case 'pagination':
        return 'Loading additional items';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showIcon && (
          <MaterialIcons
            name={iconName || getDefaultIcon() as any}
            size={size === 'large' ? 48 : 32}
            color={theme.colors.primary}
            style={styles.icon}
          />
        )}
        
        <ActivityIndicator 
          size={size} 
          color={theme.colors.primary} 
        />
        
        <Text style={styles.message}>
          {message || getDefaultMessage()}
        </Text>
        
        {getSubtitle() && (
          <Text style={styles.subtitle}>
            {getSubtitle()}
          </Text>
        )}
      </View>
    </View>
  );
}

export function LoadingPagination({ message = 'Loading more content...' }: { message?: string }) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    message: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

export function ContentSkeleton({ type, count = 3 }: ContentSkeletonProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.md,
    },
    skeleton: {
      marginBottom: theme.spacing.md,
    },
  });

  const renderSermonSkeleton = () => (
    <Card style={styles.skeleton}>
      <Card.Content>
        <View style={{ height: 20, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
        <View style={{ height: 16, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
        <View style={{ height: 16, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
          <View style={{ flex: 1, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
        </View>
      </Card.Content>
    </Card>
  );

  const renderArticleSkeleton = () => (
    <Card style={styles.skeleton}>
      <View style={{ height: 200, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm }} />
      <Card.Content>
        <View style={{ height: 20, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
        <View style={{ height: 16, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
        <View style={{ height: 16, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
          <View style={{ flex: 1, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
        </View>
      </Card.Content>
    </Card>
  );

  const renderCategorySkeleton = () => (
    <Card style={styles.skeleton}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <View style={{ width: 40, height: 40, backgroundColor: theme.colors.surface, borderRadius: 20, marginRight: theme.spacing.sm }} />
          <View style={{ flex: 1 }}>
            <View style={{ height: 18, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.xs, borderRadius: 4 }} />
            <View style={{ height: 14, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
          <View style={{ flex: 1, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
        </View>
      </Card.Content>
    </Card>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'sermon':
        return renderSermonSkeleton();
      case 'article':
        return renderArticleSkeleton();
      case 'category':
        return renderCategorySkeleton();
      default:
        return renderSermonSkeleton();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
}

export function SearchSkeleton({ resultCount = 5 }: SearchSkeletonProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    resultsCount: {
      marginBottom: theme.spacing.md,
    },
    skeleton: {
      marginBottom: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ height: 20, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.md, borderRadius: 4 }} />
        <View style={{ height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
      </View>
      
      {Array.from({ length: resultCount }).map((_, index) => (
        <Card key={index} style={styles.skeleton}>
          <Card.Content>
            <View style={{ height: 18, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
            <View style={{ height: 16, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
            <View style={{ height: 16, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: 4 }} />
            <View style={{ height: 14, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

export function EmptyState({ 
  icon = 'inbox',
  title = 'No content found',
  message = 'There\'s nothing to display at the moment.',
  actionLabel,
  onAction
}: {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    icon: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 24,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons
          name={icon as any}
          size={64}
          color={theme.colors.textSecondary}
          style={styles.icon}
        />
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {actionLabel && onAction && (
          <Text 
            style={[styles.message, { color: theme.colors.primary, textDecorationLine: 'underline' }]}
            onPress={onAction}
          >
            {actionLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ErrorState({ 
  icon = 'error',
  title = 'Something went wrong',
  message = 'We encountered an error while loading your content.',
  actionLabel = 'Try Again',
  onAction
}: {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    icon: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 24,
    },
    action: {
      backgroundColor: theme.colors.error,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons
          name={icon as any}
          size={64}
          color={theme.colors.error}
          style={styles.icon}
        />
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {onAction && (
          <Text 
            style={[styles.message, { color: theme.colors.primary, textDecorationLine: 'underline' }]}
            onPress={onAction}
          >
            {actionLabel}
          </Text>
        )}
      </View>
    </View>
  );
}
