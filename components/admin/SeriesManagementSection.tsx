import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  IconButton,
  ActivityIndicator,
  FAB,
  Chip,
  SegmentedButtons,
  Searchbar,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { useAdminAuth } from './AdminAuthGuard';
import { useRouter } from 'expo-router';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Sermon, Series, Topic } from '@/types/content';

interface Series {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  sermon_count?: number;
}

interface SeriesManagementSectionProps {
  onNavigate?: (section: string) => void;
}

const SeriesManagementSection: React.FC<SeriesManagementSectionProps> = ({
  onNavigate
}) => {
  const { theme } = useTheme();
  const { checkPermission } = useAdminAuth();
  const router = useRouter();
  
  // Series state
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'manage' | 'assign'>('manage');

  // Sermon assignment state
  const [sermons, setSermons] = useState<(Sermon & { series?: Series; topics?: Topic[] })[]>([]);
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [sermonsLoading, setSermonsLoading] = useState(false);
  const [sermonsError, setSermonsError] = useState<string | null>(null);
  const [sermonSearchQuery, setSermonSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [savingSermonId, setSavingSermonId] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    searchInput: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    seriesList: {
      flex: 1,
    },
    seriesListContent: {
      paddingBottom: theme.spacing.xl * 2,
    },
    seriesCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    seriesHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    seriesInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    seriesName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: 22,
    },
    seriesDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    seriesMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    seriesIcon: {
      marginRight: theme.spacing.sm,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    paginationButton: {
      marginHorizontal: theme.spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl * 2,
      minHeight: 200,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
      lineHeight: 24,
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.lg,
      right: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
    },
    tabContainer: {
      marginBottom: theme.spacing.lg,
    },
    sermonCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    sermonCardContent: {
      padding: theme.spacing.md,
    },
    sermonHeader: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
    },
    errorCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    errorContent: {
      padding: theme.spacing.lg,
    },
    sermonThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: theme.spacing.sm,
    },
    sermonInfo: {
      flex: 1,
    },
    sermonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    sermonMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    sermonDropdown: {
      marginTop: theme.spacing.sm,
    },
    savingIndicator: {
      position: 'absolute',
      right: theme.spacing.md,
      top: theme.spacing.md,
    },
  });

  // Load series
  const loadSeries = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use a mock implementation since series table might not exist yet
      // In a real implementation, this would call AdminService.getSeries()
      const mockSeries: Series[] = [
        {
          id: '1',
          name: 'The Gospel of John',
          description: 'A deep dive into the Gospel of John',
          color: '#1976D2',
          icon: 'book',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sermon_count: 5,
        },
        {
          id: '2',
          name: 'Prayer and Worship',
          description: 'Understanding prayer and worship in our daily lives',
          color: '#388E3C',
          icon: 'church',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sermon_count: 3,
        },
        {
          id: '3',
          name: 'Christian Living',
          description: 'Practical teachings for Christian living',
          color: '#D32F2F',
          icon: 'home',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sermon_count: 8,
        },
      ];

      // Filter by search query
      const filteredSeries = search 
        ? mockSeries.filter(series => 
            series.name.toLowerCase().includes(search.toLowerCase()) ||
            series.description?.toLowerCase().includes(search.toLowerCase())
          )
        : mockSeries;

      setSeries(filteredSeries);
      setTotalPages(1); // Mock pagination
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    
    try {
      await loadSeries(1, query);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle delete series
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Series',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement actual delete when AdminService.getSeries() is available
              setSeries(prev => prev.filter(s => s.id !== id));
              Alert.alert('Success', 'Series deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete series');
            }
          },
        },
      ]
    );
  };

  // Load sermons for assignment
  const loadSermons = async () => {
    try {
      setSermonsLoading(true);
      setSermonsError(null);
      const sermonsData = await AdminService.getSermonsForAssignment(200, sermonSearchQuery || undefined);
      setSermons(sermonsData);
    } catch (err) {
      setSermonsError(err instanceof Error ? err.message : 'Failed to load sermons');
    } finally {
      setSermonsLoading(false);
      setRefreshing(false);
    }
  };

  // Load all series for dropdown
  const loadAllSeries = async () => {
    try {
      const seriesData = await AdminService.getAllSeries();
      setAllSeries(seriesData);
    } catch (err) {
      console.error('Failed to load series:', err);
    }
  };

  // Handle series assignment
  const handleSeriesAssignment = async (sermonId: string, seriesId: string | null) => {
    try {
      setSavingSermonId(sermonId);
      await AdminService.assignSermonToSeries(sermonId, seriesId);
      
      // Update local state
      setSermons(prev => prev.map(sermon => 
        sermon.id === sermonId 
          ? { ...sermon, series_id: seriesId || undefined, series: seriesId ? allSeries.find(s => s.id === seriesId) : undefined }
          : sermon
      ));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign series');
    } finally {
      setSavingSermonId(null);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSermons(), loadAllSeries()]);
  };

  // Load series on mount
  useEffect(() => {
    loadSeries(1, searchQuery);
  }, []);

  // Load sermons and series when assignment tab is active
  useEffect(() => {
    if (activeTab === 'assign') {
      loadSermons();
      loadAllSeries();
    }
  }, [activeTab, sermonSearchQuery]);

  const canCreate = checkPermission('series.create');
  const canEdit = checkPermission('series.manage');
  const canDelete = checkPermission('series.manage');

  // Render sermon assignment view
  const renderSermonAssignment = () => (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <Searchbar
        placeholder="Search sermons..."
        onChangeText={setSermonSearchQuery}
        value={sermonSearchQuery}
        style={{ marginBottom: theme.spacing.md }}
      />

      {sermonsLoading && sermons.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading sermons...</Text>
        </View>
      ) : sermonsError ? (
        <Card style={styles.sermonCard}>
          <Card.Content>
            <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
              {sermonsError}
            </Text>
            <Button 
              mode="outlined" 
              onPress={loadSermons}
              style={{ marginTop: theme.spacing.md }}
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      ) : sermons.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons 
            name="music-note" 
            size={48} 
            color={theme.colors.textSecondary} 
          />
          <Text style={styles.emptyText}>
            No sermons found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sermons}
          keyExtractor={(item) => item.id}
          renderItem={({ item: sermon }) => (
            <Card style={styles.sermonCard} elevation={2}>
              <Card.Content style={styles.sermonCardContent}>
                {savingSermonId === sermon.id && (
                  <View style={styles.savingIndicator}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                )}
                <View style={styles.sermonHeader}>
                  {sermon.thumbnail_url && (
                    <Image
                      source={{ uri: sermon.thumbnail_url }}
                      style={styles.sermonThumbnail}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={2}>
                      {sermon.title}
                    </Text>
                    <Text style={styles.sermonMeta}>
                      {sermon.preacher} • {new Date(sermon.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.sermonDropdown}>
                  <CustomDropdown
                    options={[
                      { id: 'none', label: 'No Series', value: null },
                      ...allSeries.map(s => ({ id: s.id, label: s.name, value: s.id }))
                    ]}
                    selectedValue={sermon.series_id || null}
                    onSelect={(value) => handleSeriesAssignment(sermon.id, value)}
                    placeholder="Select Series"
                    variant="light"
                  />
                </View>
              </Card.Content>
            </Card>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Series Management</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'manage' | 'assign')}
          buttons={[
            { value: 'manage', label: 'Manage Series' },
            { value: 'assign', label: 'Assign Sermons' },
          ]}
        />
      </View>

      {activeTab === 'assign' ? (
        renderSermonAssignment()
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search series..."
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.searchInput}
              right={
                searchLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <TextInput.Icon icon="magnify" />
                )
              }
            />
          </View>

      {/* Series List */}
      <ScrollView 
        style={styles.seriesList} 
        contentContainerStyle={styles.seriesListContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && series.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.emptyText}>Loading series...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard} elevation={1}>
            <View style={styles.errorContent}>
              <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.md }}>
                {error}
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => loadSeries(currentPage, searchQuery)}
                style={{ alignSelf: 'center' }}
              >
                Retry
              </Button>
            </View>
          </Card>
        ) : series.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="book" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.emptyText}>
              No series found. {canCreate && 'Create your first one!'}
            </Text>
          </View>
        ) : (
          series.map((seriesItem) => (
            <Card key={seriesItem.id} style={styles.seriesCard} elevation={2}>
              <Card.Content style={{ padding: theme.spacing.md }}>
                <View style={styles.seriesHeader}>
                  <View style={styles.seriesInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons 
                        name={seriesItem.icon as any} 
                        size={20} 
                        color={seriesItem.color}
                        style={styles.seriesIcon}
                      />
                      <Text style={styles.seriesName}>{seriesItem.name}</Text>
                    </View>
                    {seriesItem.description && (
                      <Text style={styles.seriesDescription}>{seriesItem.description}</Text>
                    )}
                    <Text style={styles.seriesMeta}>
                      {seriesItem.sermon_count || 0} sermons • Created {new Date(seriesItem.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <Chip
                      style={{ backgroundColor: seriesItem.color + '20' }}
                      textStyle={{ color: seriesItem.color }}
                    >
                      {seriesItem.sermon_count || 0} sermons
                    </Chip>
                    {canEdit && (
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => router.push(`/admin/series-edit/${seriesItem.id}`)}
                      />
                    )}
                    {canDelete && (
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => handleDelete(seriesItem.id, seriesItem.name)}
                      />
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Button
              mode="outlined"
              onPress={() => loadSeries(currentPage - 1, searchQuery)}
              disabled={currentPage === 1}
              style={styles.paginationButton}
            >
              Previous
            </Button>
            <Text style={{ marginHorizontal: theme.spacing.md }}>
              {currentPage} of {totalPages}
            </Text>
            <Button
              mode="outlined"
              onPress={() => loadSeries(currentPage + 1, searchQuery)}
              disabled={currentPage === totalPages}
              style={styles.paginationButton}
            >
              Next
            </Button>
          </View>
        )}
      </ScrollView>

          {/* Create FAB */}
          {canCreate && (
            <FAB
              icon="plus"
              style={styles.fab}
              onPress={() => router.push('/admin/series-create')}
              label="Create Series"
            />
          )}
        </>
      )}
    </View>
  );
};

export default SeriesManagementSection;
