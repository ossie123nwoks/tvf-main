import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from './AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminDashboardSection } from '@/types/admin';
import { AdminService } from '@/lib/supabase/admin';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Section accent colors
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

interface AdminDashboardProps {
  initialSection?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialSection = 'overview' }) => {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sections, setSections] = useState<AdminDashboardSection[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role) {
      const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
      const availableSections = getAvailableSections(mappedRole as any);
      const updatedSections = availableSections.map(section => ({
        ...section,
        component: section.id,
        isExpanded: false,
      }));
      setSections(updatedSections);
    }
  }, [user?.role]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        const isAdmin = await AdminService.isCurrentUserAdmin();
        if (!isAdmin) {
          setError('Access denied: Admin privileges required');
          return;
        }
        const stats = await AdminService.getAdminStats();
        setAdminStats(stats);
      } catch (err) {
        console.error('Failed to load admin data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const getSectionRoute = (sectionId: string): string => {
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
    return routeMap[sectionId] || `/admin/${sectionId}`;
  };

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

  const userInitials = React.useMemo(() => {
    const f = user?.firstName?.charAt(0) || '';
    const l = user?.lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'A';
  }, [user?.firstName, user?.lastName]);

  return (
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
          <Text style={{ ...theme.typography.titleLarge, color: '#FFFFFF' }}>Admin Panel</Text>
        </View>
        <Avatar.Text
          size={36}
          label={userInitials}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          labelStyle={{ color: '#FFFFFF', ...theme.typography.labelMedium }}
        />
      </View>

      {/* Section list */}
      <ScrollView
        style={staticStyles.scrollView}
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {sections.length === 0 ? (
          <View style={[staticStyles.emptyState, { padding: theme.spacing.xl }]}>
            <MaterialIcons name="hourglass-empty" size={48} color={theme.colors.textTertiary} />
            <Text
              style={{
                ...theme.typography.bodyMedium,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.sm,
              }}
            >
              Loading admin sections...
            </Text>
          </View>
        ) : (
          sections.map(section => {
            const accentColor = SECTION_COLORS[section.id] || theme.colors.primary;
            return (
              <Pressable
                key={section.id}
                onPress={() => router.push(getSectionRoute(section.id))}
                style={({ pressed }) => [
                  staticStyles.sectionCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: pressed ? accentColor + '50' : theme.colors.cardBorder,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.sm,
                    opacity: pressed ? 0.9 : 1,
                    ...theme.shadows.small,
                  },
                ]}
              >
                <View
                  style={[
                    staticStyles.iconCircle,
                    { backgroundColor: accentColor + '15', borderRadius: theme.borderRadius.md },
                  ]}
                >
                  <MaterialIcons name={getIconName(section.icon)} size={24} color={accentColor} />
                </View>
                <View style={staticStyles.sectionContent}>
                  <Text
                    style={{ ...theme.typography.titleSmall, color: theme.colors.text }}
                    numberOfLines={1}
                  >
                    {section.title}
                  </Text>
                  <Text
                    style={{
                      ...theme.typography.caption,
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    {section.description}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default AdminDashboard;

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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
