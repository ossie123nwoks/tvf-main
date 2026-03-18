import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useRouter } from 'expo-router';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export default function HeaderBar({
  title,
  subtitle,
  backButton = false,
  rightAction,
  onBack,
}: HeaderBarProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/admin');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.leftContainer}>
        {backButton && (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.sm },
            ]}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightContainer}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    justifyContent: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
