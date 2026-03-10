import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from './AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminRole } from '@/types/admin';

// Section accent colors (matching the index page)
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

export default function AdminSidebar() {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

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

  const isActive = (sectionId: string): boolean => {
    if (pathname === '/admin' || pathname === '/admin/') {
      return sectionId === 'overview';
    }
    const sectionPath = `/admin/${sectionId}`;
    return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);
  };

  const handleNavigation = (sectionId: string) => {
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

  const userInitials = React.useMemo(() => {
    const f = user?.firstName?.charAt(0) || '';
    const l = user?.lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'A';
  }, [user?.firstName, user?.lastName]);

  const sidebarWidth = width >= 1024 ? 300 : 260;

  return (
    <View
      style={[
        staticStyles.sidebar,
        {
          width: sidebarWidth,
          backgroundColor: theme.colors.surfaceElevated,
          borderRightWidth: 1,
          borderRightColor: theme.colors.cardBorder,
        },
      ]}
    >
      {/* Sidebar Header */}
      <View
        style={[
          staticStyles.sidebarHeader,
          {
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.lg,
            paddingTop: theme.spacing.xl,
          },
        ]}
      >
        <View style={staticStyles.headerRow}>
          <Avatar.Text
            size={42}
            label={userInitials}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            labelStyle={{ color: '#FFFFFF', ...theme.typography.titleMedium }}
          />
          <View style={staticStyles.headerInfo}>
            <Text style={{ ...theme.typography.titleSmall, color: '#FFFFFF' }} numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
            <View style={[staticStyles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: theme.borderRadius.xs }]}>
              <Text style={{ ...theme.typography.labelSmall, color: 'rgba(255,255,255,0.9)' }}>
                {user?.role === 'admin' ? 'Super Admin' : 'Moderator'}
              </Text>
            </View>
          </View>
        </View>

        {/* Home button */}
        <TouchableOpacity
          style={[staticStyles.homeButton, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: theme.borderRadius.md }]}
          onPress={() => router.push('/(tabs)/dashboard')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="home" size={18} color="#FFFFFF" />
          <Text style={{ ...theme.typography.labelMedium, color: '#FFFFFF' }}>Back to App</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <ScrollView style={staticStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Admin Home */}
        <TouchableOpacity
          style={[
            staticStyles.navItem,
            {
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm + 2,
              borderLeftWidth: 3,
              borderLeftColor: pathname === '/admin' ? theme.colors.primary : 'transparent',
              backgroundColor: pathname === '/admin' ? theme.colors.primaryContainer : 'transparent',
            },
          ]}
          onPress={() => router.push('/admin')}
          activeOpacity={0.7}
        >
          <View style={[staticStyles.navIcon, { backgroundColor: (pathname === '/admin' ? theme.colors.primary : theme.colors.textTertiary) + '15', borderRadius: theme.borderRadius.sm }]}>
            <MaterialIcons
              name="apps"
              size={20}
              color={pathname === '/admin' ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
          <View style={staticStyles.navContent}>
            <Text style={{ ...theme.typography.titleSmall, color: pathname === '/admin' ? theme.colors.primary : theme.colors.text }}>
              Admin Home
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
              All sections
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={[staticStyles.navDivider, { backgroundColor: theme.colors.borderLight, marginHorizontal: theme.spacing.md, marginVertical: theme.spacing.xs }]} />

        {/* Section Items */}
        {availableSections.map((section) => {
          const active = isActive(section.id);
          const accentColor = SECTION_COLORS[section.id] || theme.colors.primary;
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                staticStyles.navItem,
                {
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm + 2,
                  borderLeftWidth: 3,
                  borderLeftColor: active ? accentColor : 'transparent',
                  backgroundColor: active ? accentColor + '10' : 'transparent',
                },
              ]}
              onPress={() => handleNavigation(section.id)}
              activeOpacity={0.7}
            >
              <View style={[staticStyles.navIcon, { backgroundColor: accentColor + '15', borderRadius: theme.borderRadius.sm }]}>
                <MaterialIcons
                  name={getIconName(section.icon)}
                  size={20}
                  color={active ? accentColor : theme.colors.textSecondary}
                />
              </View>
              <View style={staticStyles.navContent}>
                <Text
                  style={{ ...theme.typography.titleSmall, color: active ? accentColor : theme.colors.text }}
                  numberOfLines={1}
                >
                  {section.title}
                </Text>
                <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }} numberOfLines={1}>
                  {section.description}
                </Text>
              </View>
              {active && (
                <View style={[staticStyles.activeDot, { backgroundColor: accentColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const staticStyles = StyleSheet.create({
  sidebar: {},
  sidebarHeader: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  navIcon: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navContent: {
    flex: 1,
  },
  navDivider: {
    height: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
