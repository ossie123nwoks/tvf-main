import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  icon,
  compact = false,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Ionicons name={icon} size={28} color={theme.colors.primary} />
        </View>
      )}
      <Text
        style={[
          styles.title,
          { color: theme.colors.text },
          compact && styles.titleCompact,
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  containerCompact: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});

export default AuthHeader;
