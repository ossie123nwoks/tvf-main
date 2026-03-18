import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export default function DashboardCard({
  title,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  rightAction,
  children,
  style,
  contentStyle,
  onPress,
}: DashboardCardProps) {
  const { theme } = useTheme();

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.cardBorder,
          borderRadius: theme.borderRadius.lg,
          ...theme.shadows.small,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {(title || rightAction) && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: iconBgColor || theme.colors.primaryContainer,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
              >
                <MaterialIcons name={icon} size={20} color={iconColor || theme.colors.primary} />
              </View>
            )}
            <View>
              {title && (
                <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text }}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {rightAction && <View>{rightAction}</View>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    padding: 16,
  },
});
