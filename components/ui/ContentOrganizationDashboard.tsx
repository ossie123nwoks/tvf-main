import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  IconButton,
  Chip,
  Divider,
  Badge,
  FAB,
  Menu,
  List,
  ProgressBar,
  DataTable,
  Searchbar,
  SegmentedButtons
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { CategorizationService, CategoryHierarchy, ContentCollection } from '@/lib/services/categorization';
import { ContentService } from '@/lib/supabase/content';
import { Category, ContentStats } from '@/types/content';

interface ContentOrganizationDashboardProps {
  onNavigateToCategory?: (categoryId: string) => void;
  onNavigateToCollection?: (collectionId: string) => void;
  showCreateOptions?: boolean;
}

export default function ContentOrganizationDashboard({
  onNavigateToCategory,
  onNavigateToCollection,
  showCreateOptions = true
}: ContentOrganizationDashboardProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'collections' | 'analytics'>('overview');
  
  // Data states
  const [categories, setCategories] = useState<CategoryHierarchy[]>([]);
  const [collections, setCollections] = useState<ContentCollection[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{ type: string; action: string; timestamp: string }>>([]);
  
  // Menu states
  const [createMenuVisible, setCreateMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    viewSelector: {
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.md,
    },
    searchContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    content: {
      padding: theme.spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: 150,
      elevation: 2,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    statIcon: {
      marginRight: theme.spacing.sm,
    },
    statTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statChange: {
      fontSize: 12,
      color: theme.colors.success,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    categoryCard: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    categoryInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    categoryDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    categoryMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    collectionCard: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    collectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    collectionInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    collectionName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    collectionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    collectionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    analyticsCard: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    chartContainer: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    chartPlaceholder: {
      width: 200,
      height: 150,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chartText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    recentActivity: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.md,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    activityIcon: {
      marginRight: theme.spacing.sm,
    },
    activityContent: {
      flex: 1,
    },
    activityText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    activityTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    quickActionButton: {
      flex: 1,
      minWidth: 120,
    },
    metaText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoryHierarchy, stats, userCollections] = await Promise.all([
        CategorizationService.getCategoryHierarchy(),
        ContentService.getContentStats(),
        CategorizationService.getUserCollections('current-user-id') // TODO: Get actual user ID
      ]);
      
      setCategories(categoryHierarchy);
      setContentStats(stats);
      setCollections(userCollections);
      
      // Mock recent activity data
      setRecentActivity([
        { type: 'sermon', action: 'New sermon uploaded', timestamp: '2 hours ago' },
        { type: 'article', action: 'Article published', timestamp: '4 hours ago' },
        { type: 'category', action: 'Category created', timestamp: '1 day ago' },
        { type: 'collection', action: 'Playlist updated', timestamp: '2 days ago' }
      ]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    // TODO: Navigate to category creation
    Alert.alert('Coming Soon', 'Category creation will be implemented in the next phase.');
  };

  const handleCreateCollection = () => {
    // TODO: Navigate to collection creation
    Alert.alert('Coming Soon', 'Collection creation will be implemented in the next phase.');
  };

  const handleCreateSeries = () => {
    // TODO: Navigate to series creation
    Alert.alert('Coming Soon', 'Series creation will be implemented in the next phase.');
  };

  const handleCategoryPress = (categoryId: string) => {
    if (onNavigateToCategory) {
      onNavigateToCategory(categoryId);
    }
  };

  const handleCollectionPress = (collectionId: string) => {
    if (onNavigateToCollection) {
      onNavigateToCollection(collectionId);
    }
  };

  const renderOverview = () => (
    <View>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          mode="outlined"
          icon="folder-plus"
          onPress={handleCreateCategory}
          style={styles.quickActionButton}
        >
          New Category
        </Button>
        <Button
          mode="outlined"
          icon="playlist-plus"
          onPress={handleCreateCollection}
          style={styles.quickActionButton}
        >
          New Collection
        </Button>
        <Button
          mode="outlined"
          icon="format-list-numbered"
          onPress={handleCreateSeries}
          style={styles.quickActionButton}
        >
          New Series
        </Button>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <MaterialIcons
                name="content-copy"
                size={24}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statTitle}>Total Content</Text>
            </View>
            <Text style={styles.statValue}>
              {(contentStats?.totalSermons || 0) + (contentStats?.totalArticles || 0)}
            </Text>
            <Text style={styles.statChange}>+12 this week</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <MaterialIcons
                name="folder"
                size={24}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statTitle}>Categories</Text>
            </View>
            <Text style={styles.statValue}>{contentStats?.totalCategories || 0}</Text>
            <Text style={styles.statChange}>+2 this month</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <MaterialIcons
                name="visibility"
                size={24}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statTitle}>Total Views</Text>
            </View>
            <Text style={styles.statValue}>{contentStats?.totalViews || 0}</Text>
            <Text style={styles.statChange}>+8.5% this week</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <MaterialIcons
                name="download"
                size={24}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statTitle}>Downloads</Text>
            </View>
            <Text style={styles.statValue}>{contentStats?.totalDownloads || 0}</Text>
            <Text style={styles.statChange}>+15% this week</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.recentActivity}>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <MaterialIcons
                name={activity.type === 'sermon' ? 'headphones' : 
                      activity.type === 'article' ? 'article' :
                      activity.type === 'category' ? 'folder' : 'playlist-play'}
                size={20}
                color={theme.colors.primary}
                style={styles.activityIcon}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.action}</Text>
                <Text style={styles.activityTime}>{activity.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View>
      {categories.map(category => (
        <Card
          key={category.id}
          style={styles.categoryCard}
          onPress={() => handleCategoryPress(category.id)}
        >
          <View style={styles.categoryHeader}>
            <MaterialIcons
              name={category.icon as any}
              size={24}
              color={category.color}
            />
            
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
              
              <View style={styles.categoryMeta}>
                <Chip icon="content-copy">
                  {category.contentCount} items
                </Chip>
                {category.subcategoryCount > 0 && (
                  <Chip icon="folder">
                    {category.subcategoryCount} subcategories
                  </Chip>
                )}
                {!category.is_active && (
                  <Badge size={16}>Inactive</Badge>
                )}
              </View>
            </View>

            <IconButton
              icon="chevron-right"
              onPress={() => handleCategoryPress(category.id)}
            />
          </View>
        </Card>
      ))}
    </View>
  );

  const renderCollections = () => (
    <View>
      {collections.map(collection => (
        <Card
          key={collection.id}
          style={styles.collectionCard}
          onPress={() => handleCollectionPress(collection.id)}
        >
          <View style={styles.collectionHeader}>
            <MaterialIcons
              name={collection.type === 'playlist' ? 'playlist-play' :
                    collection.type === 'study' ? 'school' :
                    collection.type === 'curriculum' ? 'book' : 'favorite'}
              size={24}
              color={theme.colors.primary}
            />
            
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionDescription} numberOfLines={2}>
                {collection.description}
              </Text>
              
              <View style={styles.collectionMeta}>
                <Chip icon="content-copy">
                  {collection.totalItems} items
                </Chip>
                <Chip icon={collection.isPublic ? 'public' : 'lock'}>
                  {collection.isPublic ? 'Public' : 'Private'}
                </Chip>
                <Chip icon="person">
                  {collection.createdBy}
                </Chip>
              </View>
            </View>

            <IconButton
              icon="chevron-right"
              onPress={() => handleCollectionPress(collection.id)}
            />
          </View>
        </Card>
      ))}
    </View>
  );

  const renderAnalytics = () => (
    <View>
      <Card style={styles.analyticsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Content Distribution</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Chart Placeholder</Text>
              <Text style={styles.chartText}>Content distribution by category</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.analyticsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Growth Trends</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Chart Placeholder</Text>
              <Text style={styles.chartText}>Content growth over time</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.analyticsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Chart Placeholder</Text>
              <Text style={styles.chartText}>Most viewed categories</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return renderOverview();
      case 'categories':
        return renderCategories();
      case 'collections':
        return renderCollections();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.metaText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons 
          name="error" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadDashboardData}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Organization</Text>
        <Text style={styles.subtitle}>
          Manage and organize your content effectively
        </Text>
      </View>

      <View style={styles.viewSelector}>
        <SegmentedButtons
          value={selectedView}
          onValueChange={setSelectedView as (value: string) => void}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'categories', label: 'Categories' },
            { value: 'collections', label: 'Collections' },
            { value: 'analytics', label: 'Analytics' }
          ]}
        />
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search content, categories, or collections..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          icon="magnify"
        />
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Create Menu */}
      <Menu
        visible={createMenuVisible}
        onDismiss={() => setCreateMenuVisible(false)}
        anchor={<View />}
      >
        <Menu.Item
          leadingIcon="folder-plus"
          title="New Category"
          onPress={() => {
            setCreateMenuVisible(false);
            handleCreateCategory();
          }}
        />
        <Menu.Item
          leadingIcon="playlist-plus"
          title="New Collection"
          onPress={() => {
            setCreateMenuVisible(false);
            handleCreateCollection();
          }}
        />
        <Menu.Item
          leadingIcon="format-list-numbered"
          title="New Series"
          onPress={() => {
            setCreateMenuVisible(false);
            handleCreateSeries();
          }}
        />
      </Menu>

      {showCreateOptions && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setCreateMenuVisible(true)}
        />
      )}
    </View>
  );
}
