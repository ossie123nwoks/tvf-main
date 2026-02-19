import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from './AdminAuthGuard';
import { getAvailableSections } from '@/lib/admin/rolePermissions';
import { AdminDashboardSection } from '@/types/admin';
import { AdminService } from '@/lib/supabase/admin';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminDashboardProps {
  initialSection?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialSection = 'overview'
}) => {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  // Dashboard data state (kept for potential future use in overview page)
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard sections state
  const [sections, setSections] = useState<AdminDashboardSection[]>([]);

  // Update sections when user role changes
  useEffect(() => {
    if (user?.role) {
      // Map 'admin' role to 'super_admin' for compatibility
      const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
      const availableSections = getAvailableSections(mappedRole as any);
      const updatedSections = availableSections.map(section => ({
        ...section,
        component: section.id,
        isExpanded: false
      }));
      setSections(updatedSections);
    }
  }, [user?.role]);

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is admin first
        const isAdmin = await AdminService.isCurrentUserAdmin();
        if (!isAdmin) {
          setError('Access denied: Admin privileges required');
          return;
        }

        // Load admin statistics
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

  // Map section IDs to routes
  const getSectionRoute = (sectionId: string): string => {
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
    return routeMap[sectionId] || `/admin/${sectionId}`;
  };

  const handleSectionPress = (sectionId: string) => {
    const route = getSectionRoute(sectionId);
    router.push(route);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleHelpPress = () => {
    // Placeholder for help functionality
    console.log('Help pressed');
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

  const renderListRow = (section: AdminDashboardSection) => {
        return (
      <Pressable
            key={section.id} 
        onPress={() => handleSectionPress(section.id)}
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
    );
  };

  const renderListLayout = () => {
    return (
        <ScrollView 
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
        {sections.length === 0 ? (
          <Text style={styles.emptyText}>
            Loading admin sections... Please wait.
              </Text>
        ) : (
          sections.map(renderListRow)
        )}
        </ScrollView>
    );
  };

  return (
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
      {renderListLayout()}
    </View>
  );
};

export default AdminDashboard;
