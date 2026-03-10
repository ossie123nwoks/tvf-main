import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  Chip,
  IconButton,
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

  const [contentType, setContentType] = useState<'sermons' | 'articles'>('sermons');
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    try {
      await loadContent(1, query);
    } finally {
      setSearchLoading(false);
    }
  };

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
    <View style={[staticStyles.container, { padding: theme.spacing.md }]}>
      {/* Header */}
      <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text, marginBottom: theme.spacing.md }}>
        Content Management
      </Text>

      {/* Content Type Selector */}
      <SegmentedButtons
        value={contentType}
        onValueChange={(value) => setContentType(value as 'sermons' | 'articles')}
        buttons={[
          { value: 'sermons', label: 'Sermons', icon: 'music' },
          { value: 'articles', label: 'Articles', icon: 'text' },
        ]}
        style={{ marginBottom: theme.spacing.md }}
      />

      {/* Search */}
      <TextInput
        placeholder={`Search ${contentType}...`}
        value={searchQuery}
        onChangeText={handleSearch}
        style={[staticStyles.searchInput, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md }]}
        mode="outlined"
        dense
        outlineStyle={{ borderRadius: theme.borderRadius.md }}
        right={
          searchLoading ? (
            <TextInput.Icon icon={() => <ActivityIndicator size={16} color={theme.colors.primary} />} />
          ) : (
            <TextInput.Icon icon="magnify" />
          )
        }
      />

      {/* Content List */}
      <ScrollView
        style={staticStyles.contentList}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && currentContent.length === 0 ? (
          <View style={[staticStyles.emptyState, { padding: theme.spacing.xxl }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.md }}>
              Loading content...
            </Text>
          </View>
        ) : error ? (
          <View style={[staticStyles.errorContainer, { padding: theme.spacing.lg, backgroundColor: theme.colors.errorContainer, borderRadius: theme.borderRadius.lg, marginTop: theme.spacing.md }]}>
            <MaterialIcons name="error-outline" size={32} color={theme.colors.error} />
            <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.error, textAlign: 'center', marginVertical: theme.spacing.sm }}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={() => loadContent(currentPage, searchQuery)}
              buttonColor={theme.colors.error}
              textColor="#FFFFFF"
              compact
            >
              Retry
            </Button>
          </View>
        ) : currentContent.length === 0 ? (
          <View style={[staticStyles.emptyState, { padding: theme.spacing.xxl }]}>
            <MaterialIcons name="inbox" size={56} color={theme.colors.textTertiary} />
            <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, marginTop: theme.spacing.md, textAlign: 'center' }}>
              No {contentType} found
            </Text>
            {canCreate && (
              <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textTertiary, marginTop: theme.spacing.xs }}>
                Create your first one!
              </Text>
            )}
          </View>
        ) : (
          currentContent.map((item) => {
            const isSermon = contentType === 'sermons';
            const metaText = isSermon
              ? `${(item as Sermon).preacher} • ${new Date((item as Sermon).date).toLocaleDateString()}`
              : `By ${(item as Article).author} • ${new Date((item as Article).created_at).toLocaleDateString()}`;
            const descText = isSermon
              ? (item as Sermon).description || 'No description'
              : (item as Article).excerpt || 'No excerpt';

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (canEdit) {
                    router.push(isSermon ? `/admin/sermon/edit/${item.id}` : `/admin/article/edit/${item.id}`);
                  }
                }}
                style={({ pressed }) => [
                  staticStyles.contentCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.sm,
                    opacity: pressed && canEdit ? 0.85 : 1,
                    ...theme.shadows.small,
                  },
                ]}
              >
                {/* Title row */}
                <View style={staticStyles.cardHeader}>
                  <View style={staticStyles.cardInfo}>
                    <Text
                      style={{ ...theme.typography.titleSmall, color: theme.colors.text }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 }}>
                      {metaText}
                    </Text>
                  </View>

                  {/* Status badge */}
                  <View
                    style={[
                      staticStyles.statusBadge,
                      {
                        backgroundColor: item.is_published
                          ? theme.colors.successContainer
                          : theme.colors.warningContainer,
                        borderRadius: theme.borderRadius.full,
                      },
                    ]}
                  >
                    <View
                      style={[
                        staticStyles.statusDot,
                        { backgroundColor: item.is_published ? theme.colors.success : theme.colors.warning },
                      ]}
                    />
                    <Text
                      style={{
                        ...theme.typography.labelSmall,
                        color: item.is_published ? theme.colors.success : theme.colors.warning,
                      }}
                    >
                      {item.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text
                  style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}
                  numberOfLines={2}
                >
                  {descText}
                </Text>

                {/* Actions */}
                <View style={[staticStyles.cardActions, { marginTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, paddingTop: theme.spacing.xs }]}>
                  {/* Stats */}
                  <View style={staticStyles.statsRow}>
                    <MaterialIcons name="visibility" size={14} color={theme.colors.textTertiary} />
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginLeft: 4 }}>
                      {item.views || 0}
                    </Text>
                  </View>

                  {/* Action icons */}
                  <View style={staticStyles.actionIcons}>
                    {canEdit && (
                      <IconButton
                        icon="pencil-outline"
                        size={18}
                        iconColor={theme.colors.primary}
                        onPress={() => {
                          router.push(isSermon ? `/admin/sermon/edit/${item.id}` : `/admin/article/edit/${item.id}`);
                        }}
                        style={staticStyles.iconBtn}
                      />
                    )}
                    {canDelete && (
                      <IconButton
                        icon="delete-outline"
                        size={18}
                        iconColor={theme.colors.error}
                        onPress={() => handleDelete(item.id, item.title)}
                        style={staticStyles.iconBtn}
                      />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[staticStyles.pagination, { marginTop: theme.spacing.lg }]}>
            <Button
              mode="outlined"
              onPress={() => loadContent(currentPage - 1, searchQuery)}
              disabled={currentPage === 1}
              compact
              style={{ borderRadius: theme.borderRadius.md }}
            >
              Previous
            </Button>
            <Text style={{ ...theme.typography.labelMedium, color: theme.colors.textSecondary }}>
              {currentPage} of {totalPages}
            </Text>
            <Button
              mode="outlined"
              onPress={() => loadContent(currentPage + 1, searchQuery)}
              disabled={currentPage === totalPages}
              compact
              style={{ borderRadius: theme.borderRadius.md }}
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
          style={[staticStyles.fab, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg }]}
          color="#FFFFFF"
          onPress={() => {
            router.push(contentType === 'sermons' ? '/admin/sermon/create' : '/admin/article/create');
          }}
          label={`New ${contentType === 'sermons' ? 'Sermon' : 'Article'}`}
        />
      )}
    </View>
  );
};

export default ContentManagementSection;

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 12,
  },
  contentList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorContainer: {
    alignItems: 'center',
  },
  contentCard: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    margin: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
