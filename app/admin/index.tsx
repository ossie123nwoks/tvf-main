import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard, useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminRole } from '@/types/admin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminIndex() {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  const [availableSections, setAvailableSections] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role) {
      // Map 'admin' role to 'super_admin' for compatibility
      const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
      const sections = getAvailableSections(mappedRole as AdminRole);
      setAvailableSections(sections);
    }
  }, [user?.role]);

  const getIconName = (icon: string): keyof typeof MaterialIcons.glyphMap => {
    const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
      dashboard: 'dashboard',
      description: 'description',
      label: 'label',
      people: 'people',
      folder: 'folder',
      'trending-up': 'trending-up',
      notifications: 'notifications',
      image: 'image',
    };
    return iconMap[icon] || 'dashboard';
  };

  const handleNavigation = (sectionId: string) => {
    // Handle nested routes
    const routeMap: Record<string, string> = {
      'overview': '/admin/overview',
      'content': '/admin/content',
      'topics-series': '/admin/topics-series',
      'users': '/admin/users',
      'analytics': '/admin/analytics',
      'notifications': '/admin/notifications',
      'carousel': '/admin/carousel',
    };
    
    const route = routeMap[sectionId] || `/admin/${sectionId}`;
    router.push(route);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleHelpPress = () => {
    // Placeholder for help functionality
    console.log('Help pressed');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
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
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    helpButton: {
      marginLeft: theme.spacing.md,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingBottom: theme.spacing.xl * 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    rowContent: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs / 2,
    },
    rowDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    chevron: {
      marginLeft: theme.spacing.sm,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      padding: theme.spacing.xl,
    },
  });

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        {/* Settings-style Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={handleHelpPress}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="help-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* List Content */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {availableSections.length === 0 ? (
            <Text style={styles.emptyText}>
              Loading admin sections... Please wait.
            </Text>
          ) : (
            availableSections.map((section) => (
              <Pressable
                key={section.id}
                onPress={() => handleNavigation(section.id)}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name={getIconName(section.icon)}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{section.title}</Text>
                  <Text style={styles.rowDescription} numberOfLines={2}>
                    {section.description}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.chevron}
                />
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}
