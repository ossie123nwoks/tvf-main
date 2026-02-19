import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from './AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminRole } from '@/types/admin';

export default function AdminSidebar() {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  
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

  const isActive = (sectionId: string): boolean => {
    if (pathname === '/admin' || pathname === '/admin/') {
      return sectionId === 'overview';
    }
    // Handle nested routes (users/index.tsx -> /admin/users)
    const sectionPath = `/admin/${sectionId}`;
    return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);
  };

  const handleNavigation = (sectionId: string) => {
    // Handle nested routes
    const routeMap: Record<string, string> = {
      'overview': '/admin/overview',
      'content': '/admin/content',
      'topics-series': '/admin/topics-series',
      'users': '/admin/users',
      'media': '/admin/media',
      'analytics': '/admin/analytics',
      'notifications': '/admin/notifications',
      'carousel': '/admin/carousel',
    };
    
    const route = routeMap[sectionId] || `/admin/${sectionId}`;
    router.push(route);
  };

  const styles = StyleSheet.create({
    sidebar: {
      width: width >= 1024 ? 320 : 280,
      backgroundColor: theme.colors.surface,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    header: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    userInfo: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    userName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    roleBadge: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
    },
    roleText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    sectionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
      minHeight: 56,
    },
    sectionItemActive: {
      backgroundColor: theme.colors.primary + '10',
      borderLeftColor: theme.colors.primary,
    },
    sectionIcon: {
      marginRight: theme.spacing.md,
      width: 24,
      alignItems: 'center',
    },
    sectionContent: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    sectionDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    homeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
    },
    homeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  return (
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your app</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'admin' ? 'Super Admin' : 'Moderator'}
              </Text>
            </View>
          </View>
        )}
        {/* Home button */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/(tabs)/dashboard')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="home" size={20} color={theme.colors.primary} />
          <Text style={styles.homeButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Admin Home Section */}
        <TouchableOpacity
          style={[styles.sectionItem, pathname === '/admin' && styles.sectionItemActive]}
          onPress={() => router.push('/admin')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionIcon}>
            <MaterialIcons
              name="apps"
              size={24}
              color={pathname === '/admin' ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionTitle, pathname === '/admin' && { color: theme.colors.primary }]}>
              Admin Home
            </Text>
            <Text style={styles.sectionDescription}>View all sections</Text>
          </View>
        </TouchableOpacity>

        {/* Section Items */}
        {availableSections.map((section) => {
          const active = isActive(section.id);
          return (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionItem, active && styles.sectionItemActive]}
              onPress={() => handleNavigation(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionIcon}>
                <MaterialIcons
                  name={getIconName(section.icon)}
                  size={24}
                  color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionTitle, active && { color: theme.colors.primary }]}>
                  {section.title}
                </Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

