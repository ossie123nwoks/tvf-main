import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import ActionButton from './ActionButton';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  icon = 'folder-open',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.borderRadius.full,
          },
        ]}
      >
        <MaterialIcons name={icon} size={48} color={theme.colors.textTertiary} />
      </View>
      <Text
        style={[
          styles.title,
          {
            ...theme.typography.titleLarge,
            color: theme.colors.text,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            ...theme.typography.bodyMedium,
            color: theme.colors.textSecondary,
          },
        ]}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <ActionButton
          label={actionLabel}
          onPress={onAction}
          icon="add"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    flex: 1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  actionButton: {
    marginTop: 8,
  },
});
