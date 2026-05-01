import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard, useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminRole } from '@/types/admin';
import { AdminLayout, HeaderBar, DashboardCard, EmptyState, Skeleton } from '@/components/admin/ui';

const SECTION_COLORS: Record<string, string> = {
  overview: '#3B82F6',
  content: '#10B981',
  'topics-series': '#8B5CF6',
  users: '#F59E0B',
  media: '#EC4899',
  analytics: '#06B6D4',
  notifications: '#EF4444',
  carousel: '#F97316',
};

export default function AdminIndex() {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const router = useRouter();

  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
      const sections = getAvailableSections(mappedRole as AdminRole);
      setAvailableSections(sections);
      setLoading(false);
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
    const routeMap: Record<string, string> = {
      overview: '/admin/overview',
      content: '/admin/content',
      'topics-series': '/admin/topics-series',
      users: '/admin/users',
      media: '/admin/media',
      analytics: '/admin/analytics',
      notifications: '/admin/notifications',
      carousel: '/admin/carousel',
    };
    const route = routeMap[sectionId] || `/admin/${sectionId}`;
    router.push(route);
  };

  return (
    <AdminAuthGuard>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <HeaderBar
          title="Admin Dashboard"
          subtitle={user?.role === 'admin' ? 'Super Admin' : 'Moderator'}
          backButton
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DashboardCard style={styles.welcomeCard}>
            <Text style={{ ...theme.typography.headlineMedium, color: theme.colors.text }}>
              Welcome back, {user?.firstName || 'Admin'} 👋
            </Text>
            <Text
              style={{
                ...theme.typography.bodyMedium,
                color: theme.colors.textSecondary,
                marginTop: 4,
              }}
            >
              Manage app content, users, media, and settings from this central dashboard.
            </Text>
          </DashboardCard>

          <Text
            style={[
              styles.sectionTitle,
              { ...theme.typography.titleMedium, color: theme.colors.textSecondary },
            ]}
          >
            Available Modules
          </Text>

          {loading ? (
            <View style={styles.grid}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={styles.skeletonCard}>
                  <Skeleton width={48} height={48} borderRadius={12} style={{ marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" height={14} />
                  </View>
                </View>
              ))}
            </View>
          ) : availableSections.length === 0 ? (
            <EmptyState
              icon="lock-outline"
              title="No Access"
              description="You do not have permission to view any admin modules."
            />
          ) : (
            <View style={styles.grid}>
              {availableSections.map(section => {
                const accentColor = SECTION_COLORS[section.id] || theme.colors.primary;
                return (
                  <Pressable
                    key={section.id}
                    onPress={() => handleNavigation(section.id)}
                    style={({ pressed }) => [
                      styles.sectionCard,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: pressed ? accentColor : theme.colors.cardBorder,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        opacity: pressed ? 0.9 : 1,
                        ...theme.shadows.small,
                      },
                    ]}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
                      <MaterialIcons
                        name={getIconName(section.icon)}
                        size={28}
                        color={accentColor}
                      />
                    </View>
                    <View style={styles.sectionContent}>
                      <Text
                        style={{ ...theme.typography.titleMedium, color: theme.colors.text }}
                        numberOfLines={1}
                      >
                        {section.title}
                      </Text>
                      <Text
                        style={{
                          ...theme.typography.bodySmall,
                          color: theme.colors.textSecondary,
                          marginTop: 4,
                        }}
                        numberOfLines={2}
                      >
                        {section.description}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={theme.colors.border} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  welcomeCard: {
    marginBottom: 24,
    borderWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    gap: 12,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
    marginRight: 16,
  },
});
