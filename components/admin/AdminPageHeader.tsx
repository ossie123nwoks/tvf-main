import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminPageHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function AdminPageHeader({ 
  title,
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

  const styles = StyleSheet.create({
    header: {
      height: 56 + insets.top,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingTop: insets.top,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    backButton: {
      marginRight: theme.spacing.md,
      padding: theme.spacing.xs,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    rightActionContainer: {
      marginLeft: theme.spacing.md,
    },
  });

  // Handler to go back to dashboard
  const handleBack = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <MaterialIcons name="home" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {rightAction && (
        <View style={styles.rightActionContainer}>
          {rightAction}
        </View>
      )}
    </View>
  );
}

