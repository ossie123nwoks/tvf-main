import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  SegmentedButtons,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { Sermon, Article } from '@/types/content';
import { useAdminAuth } from './AdminAuthGuard';
import { useRouter } from 'expo-router';

interface ContentManagementSectionProps {
  onNavigate?: (section: string) => void;
}

const ContentManagementSection: React.FC<ContentManagementSectionProps> = ({
  onNavigate
}) => {
  const { theme } = useTheme();
  const { checkPermission } = useAdminAuth();
  const router = useRouter();
  
  // Content type state
  const [contentType, setContentType] = useState<'sermons' | 'articles'>('sermons');
  
  // Content lists state
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

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
    segmentedButtons: {
      marginBottom: theme.spacing.lg,
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
    contentList: {
      flex: 1,
    },
    contentListContent: {
      paddingBottom: theme.spacing.xl * 2,
    },
    contentCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    contentHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    contentInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    contentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: 22,
    },
    contentMeta: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    contentDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginTop: theme.spacing.xs,
    },
    statusChip: {
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.xs,
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
    errorCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    errorContent: {
      padding: theme.spacing.lg,
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.lg,
      right: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
    },
  });

  // Load content based on current type and page
  const loadContent = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (contentType === 'sermons') {
        const result = await AdminService.getSermons(page, 10, search);
        setSermons(result.sermons);
        setTotalPages(result.totalPages);
      } else {
        const result = await AdminService.getArticles(page, 10, search);
        setArticles(result.articles);
        setTotalPages(result.totalPages);
      }
      
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    
    try {
      await loadContent(1, query);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle delete content
  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Content',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (contentType === 'sermons') {
                await AdminService.deleteSermon(id);
                setSermons(prev => prev.filter(s => s.id !== id));
              } else {
                await AdminService.deleteArticle(id);
                setArticles(prev => prev.filter(a => a.id !== id));
              }
              
              Alert.alert('Success', 'Content deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete content');
            }
          },
        },
      ]
    );
  };

  // Load content on mount and when type changes
  useEffect(() => {
    loadContent(1, searchQuery);
  }, [contentType]);

  const currentContent = contentType === 'sermons' ? sermons : articles;
  const canCreate = contentType === 'sermons' 
    ? checkPermission('content.sermons.create')
    : checkPermission('content.articles.create');
  const canEdit = contentType === 'sermons'
    ? checkPermission('content.sermons.edit')
    : checkPermission('content.articles.edit');
  const canDelete = contentType === 'sermons'
    ? checkPermission('content.sermons.delete')
    : checkPermission('content.articles.delete');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Content Management</Text>
      </View>

      {/* Content Type Selector */}
      <SegmentedButtons
        value={contentType}
        onValueChange={(value) => setContentType(value as 'sermons' | 'articles')}
        buttons={[
          {
            value: 'sermons',
            label: 'Sermons',
            icon: 'music',
          },
          {
            value: 'articles',
            label: 'Articles',
            icon: 'text',
          },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder={`Search ${contentType}...`}
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

      {/* Content List */}
      <ScrollView 
        style={styles.contentList} 
        contentContainerStyle={styles.contentListContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && currentContent.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.emptyText}>Loading content...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard} elevation={1}>
            <View style={styles.errorContent}>
              <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.md }}>
                {error}
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => loadContent(currentPage, searchQuery)}
                style={{ alignSelf: 'center' }}
              >
                Retry
              </Button>
            </View>
          </Card>
        ) : currentContent.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="inbox" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.emptyText}>
              No {contentType} found. {canCreate && 'Create your first one!'}
            </Text>
          </View>
        ) : (
          currentContent.map((item) => (
            <Card key={item.id} style={styles.contentCard} elevation={2}>
              <Card.Content style={{ padding: theme.spacing.md }}>
                <View style={styles.contentHeader}>
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle}>{item.title}</Text>
                    <Text style={styles.contentMeta}>
                      {contentType === 'sermons' 
                        ? `${(item as Sermon).preacher} • ${new Date((item as Sermon).date).toLocaleDateString()}`
                        : `By ${(item as Article).author} • ${new Date((item as Article).created_at).toLocaleDateString()}`
                      }
                    </Text>
                    <Text style={styles.contentDescription} numberOfLines={2}>
                      {contentType === 'sermons' 
                        ? (item as Sermon).description || 'No description available'
                        : (item as Article).content || 'No description available'
                      }
                    </Text>
                    <Chip
                      style={[
                        styles.statusChip,
                        { 
                          backgroundColor: item.is_published 
                            ? theme.colors.primary + '20' 
                            : theme.colors.surfaceVariant 
                        }
                      ]}
                      textStyle={{ 
                        color: item.is_published 
                          ? theme.colors.primary 
                          : theme.colors.textSecondary 
                      }}
                    >
                      {item.is_published ? 'Published' : 'Draft'}
                    </Chip>
                  </View>
                  <View style={styles.actionButtons}>
                    {canEdit && (
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => {
                          if (contentType === 'sermons') {
                            router.push(`/admin/sermon/edit/${item.id}`);
                          } else {
                            router.push(`/admin/article/edit/${item.id}`);
                          }
                        }}
                      />
                    )}
                    {canDelete && (
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => handleDelete(item.id, item.title)}
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
              onPress={() => loadContent(currentPage - 1, searchQuery)}
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
              onPress={() => loadContent(currentPage + 1, searchQuery)}
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
          onPress={() => {
            if (contentType === 'sermons') {
              router.push('/admin/sermon/create');
            } else {
              router.push('/admin/article/create');
            }
          }}
          label={`Create ${contentType === 'sermons' ? 'Sermon' : 'Article'}`}
        />
      )}

    </View>
  );
};

export default ContentManagementSection;
