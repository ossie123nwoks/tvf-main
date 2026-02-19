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
import { Sermon, Series } from '@/types/content';

interface Topic {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface TopicManagementSectionProps {
  onNavigate?: (section: string) => void;
}

const TopicManagementSection: React.FC<TopicManagementSectionProps> = ({
  onNavigate
}) => {
  const { theme } = useTheme();
  const { checkPermission } = useAdminAuth();
  const router = useRouter();

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);
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
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
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
    topicsList: {
      flex: 1,
    },
    topicsListContent: {
      paddingBottom: theme.spacing.xl * 2,
    },
    topicCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    topicHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    topicInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    topicName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: 22,
    },
    topicDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    topicMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    topicIcon: {
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
    topicsBadge: {
      marginTop: theme.spacing.xs,
    },
  });

  // Load topics
  const loadTopics = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use a mock implementation since topics table might not exist yet
      // In a real implementation, this would call AdminService.getTopics()
      const mockTopics: Topic[] = [
        {
          id: '1',
          name: 'Faith',
          description: 'Sermons about faith and belief',
          color: '#1976D2',
          icon: 'favorite',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Hope',
          description: 'Messages of hope and encouragement',
          color: '#388E3C',
          icon: 'lightbulb',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Love',
          description: 'Teachings about love and relationships',
          color: '#D32F2F',
          icon: 'favorite',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Filter by search query
      const filteredTopics = search
        ? mockTopics.filter(topic =>
          topic.name.toLowerCase().includes(search.toLowerCase()) ||
          topic.description?.toLowerCase().includes(search.toLowerCase())
        )
        : mockTopics;

      setTopics(filteredTopics);
      setTotalPages(1); // Mock pagination
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);

    try {
      await loadTopics(1, query);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle delete topic
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Topic',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement actual delete when AdminService.getTopics() is available
              setTopics(prev => prev.filter(t => t.id !== id));
              Alert.alert('Success', 'Topic deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete topic');
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

  // Load all topics for dropdown
  const loadAllTopics = async () => {
    try {
      const topicsData = await AdminService.getAllTopics();
      setAllTopics(topicsData as unknown as Topic[]);
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  // Handle topics assignment
  const handleTopicsAssignment = async (sermonId: string, topicIds: string[]) => {
    try {
      setSavingSermonId(sermonId);
      await AdminService.assignSermonToTopics(sermonId, topicIds);

      // Update local state
      setSermons(prev => prev.map(sermon =>
        sermon.id === sermonId
          ? {
            ...sermon,
            topics: allTopics.filter(t => topicIds.includes(t.id))
          }
          : sermon
      ));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign topics');
    } finally {
      setSavingSermonId(null);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSermons(), loadAllTopics()]);
  };

  // Load topics on mount
  useEffect(() => {
    loadTopics(1, searchQuery);
  }, []);

  // Load sermons and topics when assignment tab is active
  useEffect(() => {
    if (activeTab === 'assign') {
      loadSermons();
      loadAllTopics();
    }
  }, [activeTab, sermonSearchQuery]);

  const canCreate = checkPermission('topics.create');
  const canEdit = checkPermission('topics.manage');
  const canDelete = checkPermission('topics.manage');

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
          renderItem={({ item: sermon }) => {
            const currentTopicIds = (sermon.topics || []).map(t => t.id);
            return (
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
                      {currentTopicIds.length > 0 && (
                        <View style={styles.topicsBadge}>
                          <Chip
                            icon="label"
                            compact
                            style={{ alignSelf: 'flex-start' }}
                          >
                            {currentTopicIds.length} topic{currentTopicIds.length !== 1 ? 's' : ''}
                          </Chip>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.sermonDropdown}>
                    <CustomDropdown
                      options={allTopics.map(t => ({ id: t.id, label: t.name, value: t.id }))}
                      selectedValues={currentTopicIds}
                      onMultiSelect={(values) => handleTopicsAssignment(sermon.id, values)}
                      placeholder="Select Topics"
                      variant="dark"
                      multiSelect={true}
                    />
                  </View>
                </Card.Content>
              </Card>
            );
          }}
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
        <Text style={styles.title}>Topic Management</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'manage' | 'assign')}
          buttons={[
            { value: 'manage', label: 'Manage Topics' },
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
              placeholder="Search topics..."
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

          {/* Topics List */}
          <ScrollView
            style={styles.topicsList}
            contentContainerStyle={styles.topicsListContent}
            showsVerticalScrollIndicator={false}
          >
            {loading && topics.length === 0 ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.emptyText}>Loading topics...</Text>
              </View>
            ) : error ? (
              <Card style={styles.errorCard} elevation={1}>
                <View style={styles.errorContent}>
                  <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.md }}>
                    {error}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => loadTopics(currentPage, searchQuery)}
                    style={{ alignSelf: 'center' }}
                  >
                    Retry
                  </Button>
                </View>
              </Card>
            ) : topics.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="label-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  No topics found. {canCreate && 'Create your first one!'}
                </Text>
              </View>
            ) : (
              topics.map((topic) => (
                <Card key={topic.id} style={styles.topicCard} elevation={2}>
                  <Card.Content style={{ padding: theme.spacing.md }}>
                    <View style={styles.topicHeader}>
                      <View style={styles.topicInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialIcons
                            name={topic.icon as any}
                            size={20}
                            color={topic.color}
                            style={styles.topicIcon}
                          />
                          <Text style={styles.topicName}>{topic.name}</Text>
                        </View>
                        {topic.description && (
                          <Text style={styles.topicDescription}>{topic.description}</Text>
                        )}
                        <Text style={styles.topicMeta}>
                          Created {new Date(topic.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <Chip
                          style={{ backgroundColor: topic.color + '20' }}
                          textStyle={{ color: topic.color }}
                        >
                          {topic.name}
                        </Chip>
                        {canEdit && (
                          <IconButton
                            icon="pencil"
                            size={20}
                            onPress={() => router.push(`/admin/topic-edit/${topic.id}`)}
                          />
                        )}
                        {canDelete && (
                          <IconButton
                            icon="delete"
                            size={20}
                            iconColor={theme.colors.error}
                            onPress={() => handleDelete(topic.id, topic.name)}
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
                  onPress={() => loadTopics(currentPage - 1, searchQuery)}
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
                  onPress={() => loadTopics(currentPage + 1, searchQuery)}
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
              onPress={() => router.push('/admin/topic-create')}
              label="Create Topic"
            />
          )}
        </>
      )}
    </View>
  );
};

export default TopicManagementSection;
