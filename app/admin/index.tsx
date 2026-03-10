import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard, useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminRole } from '@/types/admin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Section accent colors for visual differentiation
const SECTION_COLORS: Record<string, string> = {
  overview: '#3B82F6',    // Blue
  content: '#10B981',     // Emerald
  'topics-series': '#8B5CF6', // Purple
  users: '#F59E0B',       // Amber
  media: '#EC4899',       // Pink
  analytics: '#06B6D4',   // Cyan
  notifications: '#EF4444', // Red
  carousel: '#F97316',    // Orange
};

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

  const userInitials = React.useMemo(() => {
    const f = user?.firstName?.charAt(0) || '';
    const l = user?.lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'A';
  }, [user?.firstName, user?.lastName]);

  return (
    <AdminAuthGuard>
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View
          style={[
            staticStyles.header,
            {
              backgroundColor: theme.colors.primary,
              paddingTop: Platform.select({
                ios: Math.max(insets.top, 20) + 8,
                android: 16,
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={staticStyles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={staticStyles.headerCenter}>
            <Text style={{ ...theme.typography.titleLarge, color: '#FFFFFF' }}>
              Admin Panel
            </Text>
            <Text style={{ ...theme.typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {user?.role === 'admin' ? 'Super Admin' : 'Moderator'}
            </Text>
          </View>

          <Avatar.Text
            size={36}
            label={userInitials}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            labelStyle={{ color: '#FFFFFF', ...theme.typography.labelMedium }}
          />
        </View>

        {/* Section Cards */}
        <ScrollView
          style={staticStyles.scrollView}
          contentContainerStyle={[
            staticStyles.scrollContent,
            { padding: theme.spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome card */}
          <View
            style={[
              staticStyles.welcomeCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.lg,
                ...theme.shadows.small,
              },
            ]}
          >
            <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text }}>
              👋 Welcome, {user?.firstName || 'Admin'}
            </Text>
            <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
              Manage your app's content, users, and settings from here.
            </Text>
          </View>

          {/* Section title */}
          <Text style={{ ...theme.typography.labelLarge, color: theme.colors.textTertiary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
            Sections
          </Text>

          {availableSections.length === 0 ? (
            <View style={[staticStyles.emptyContainer, { padding: theme.spacing.xl }]}>
              <MaterialIcons name="hourglass-empty" size={48} color={theme.colors.textTertiary} />
              <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
                Loading admin sections...
              </Text>
            </View>
          ) : (
            <View style={[staticStyles.grid, { gap: theme.spacing.sm }]}>
              {availableSections.map((section) => {
                const accentColor = SECTION_COLORS[section.id] || theme.colors.primary;
                return (
                  <Pressable
                    key={section.id}
                    onPress={() => handleNavigation(section.id)}
                    style={({ pressed }) => [
                      staticStyles.sectionCard,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderRadius: theme.borderRadius.lg,
                        borderWidth: 1,
                        borderColor: pressed ? accentColor + '50' : theme.colors.cardBorder,
                        padding: theme.spacing.md,
                        opacity: pressed ? 0.9 : 1,
                        ...theme.shadows.small,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    {/* Icon circle */}
                    <View
                      style={[
                        staticStyles.iconCircle,
                        {
                          backgroundColor: accentColor + '15',
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={getIconName(section.icon)}
                        size={24}
                        color={accentColor}
                      />
                    </View>

                    {/* Content */}
                    <View style={staticStyles.sectionContent}>
                      <Text
                        style={{ ...theme.typography.titleSmall, color: theme.colors.text }}
                        numberOfLines={1}
                      >
                        {section.title}
                      </Text>
                      <Text
                        style={{ ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 }}
                        numberOfLines={2}
                      >
                        {section.description}
                      </Text>
                    </View>

                    {/* Chevron */}
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Bottom spacer */}
          <View style={{ height: theme.spacing.xxl }} />
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  welcomeCard: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'column',
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sectionContent: {
    flex: 1,
    marginRight: 8,
  },
});
