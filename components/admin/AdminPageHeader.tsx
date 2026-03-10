import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  subtitle,
  rightAction
}: AdminPageHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Don't show header on tablet (sidebar handles navigation)
  if (isTablet) {
    return null;
  }

  return (
    <View
      style={[
        staticStyles.header,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.cardBorder,
          paddingTop: Platform.select({
            ios: Math.max(insets.top, 20) + 4,
            android: 12,
          }),
          ...theme.shadows.small,
        },
      ]}
    >
      <TouchableOpacity
        style={[staticStyles.backButton, { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.borderRadius.sm }]}
        onPress={() => router.push('/(tabs)/dashboard')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="home" size={20} color={theme.colors.primary} />
      </TouchableOpacity>

      <View style={staticStyles.titleContainer}>
        <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 1 }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightAction ? (
        <View style={staticStyles.rightAction}>
          {rightAction}
        </View>
      ) : (
        // Spacer to keep title centered
        <View style={staticStyles.spacer} />
      )}
    </View>
  );
}

const staticStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 56,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  rightAction: {
    marginLeft: 12,
  },
  spacer: {
    width: 36,
  },
});
