import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, SegmentedButtons, IconButton, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { Sermon, Article } from '@/types/content';
import { useAdminAuth } from './AdminAuthGuard';
import { useRouter } from 'expo-router';
import { DataTable, Column, DashboardCard, ActionButton } from '@/components/admin/ui';

export default function ContentManagementSection() {
  const { theme } = useTheme();
  const { checkPermission } = useAdminAuth();
  const router = useRouter();

  const [contentType, setContentType] = useState<'sermons' | 'articles'>('sermons');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadContent = async (reset: boolean = false) => {
    try {
      if (reset) setLoading(true);

      if (contentType === 'sermons') {
        const result = await AdminService.getSermons(1, 50, appliedSearch);
        setData(result.sermons);
      } else {
        const result = await AdminService.getArticles(1, 50, appliedSearch);
        setData(result.articles);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      if (reset) setLoading(false);
    }
  };

  useEffect(() => {
    loadContent(true);
  }, [contentType, appliedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = (id: string, title: string) => {
    setMenuVisible(null);
    Alert.alert('Delete Content', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (contentType === 'sermons') {
              await AdminService.deleteSermon(id);
            } else {
              await AdminService.deleteArticle(id);
            }
            setData(prev => prev.filter(item => item.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete content');
          }
        },
      },
    ]);
  };

  const getStatusColor = (isPublished: boolean) =>
    isPublished ? theme.colors.success : theme.colors.warning;

  const canCreate =
    contentType === 'sermons'
      ? checkPermission('content.sermons.create')
      : checkPermission('content.articles.create');
  const canEdit =
    contentType === 'sermons'
      ? checkPermission('content.sermons.edit')
      : checkPermission('content.articles.edit');
  const canDelete =
    contentType === 'sermons'
      ? checkPermission('content.sermons.delete')
      : checkPermission('content.articles.delete');

  const columns: Column<any>[] = [
    {
      key: 'title',
      title: 'Title',
      flex: 3,
      render: item => (
        <View style={{ paddingRight: 8 }}>
          <Text
            style={{ ...theme.typography.titleMedium, color: theme.colors.text }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={{
              ...theme.typography.bodySmall,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {contentType === 'sermons'
              ? `${item.preacher} • ${new Date(item.date).toLocaleDateString()}`
              : `By ${item.author} • ${new Date(item.created_at).toLocaleDateString()}`}
          </Text>
        </View>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      flex: 1,
      render: item => (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: getStatusColor(item.is_published) + '15',
          }}
        >
          <Text
            style={{ ...theme.typography.labelSmall, color: getStatusColor(item.is_published) }}
          >
            {item.is_published ? 'Published' : 'Draft'}
          </Text>
        </View>
      ),
    },
    {
      key: 'stats',
      title: 'Views',
      flex: 1,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons
            name="visibility"
            size={16}
            color={theme.colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary }}>
            {item.views || 0}
          </Text>
        </View>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 50,
      render: item => (
        <Menu
          visible={menuVisible === item.id}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton icon="dots-vertical" size={20} onPress={() => setMenuVisible(item.id)} />
          }
        >
          {canEdit && (
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                router.push(
                  contentType === 'sermons'
                    ? `/admin/sermon/edit/${item.id}`
                    : `/admin/article/edit/${item.id}`
                );
              }}
              title="Edit"
              leadingIcon="pencil"
            />
          )}
          {canDelete && (
            <Menu.Item
              onPress={() => handleDelete(item.id, item.title)}
              title="Delete"
              titleStyle={{ color: theme.colors.error }}
              leadingIcon={() => (
                <MaterialIcons name="delete" size={20} color={theme.colors.error} />
              )}
            />
          )}
        </Menu>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <DashboardCard style={{ marginBottom: 16 }}>
        <View style={styles.header}>
          <SegmentedButtons
            value={contentType}
            onValueChange={val => setContentType(val as 'sermons' | 'articles')}
            buttons={[
              { value: 'sermons', label: 'Sermons', icon: 'headphones' },
              { value: 'articles', label: 'Articles', icon: 'text-box-outline' },
            ]}
            style={styles.segmentedControl}
          />

          {canCreate && (
            <ActionButton
              label={`New ${contentType === 'sermons' ? 'Sermon' : 'Article'}`}
              icon="add"
              onPress={() =>
                router.push(
                  contentType === 'sermons' ? '/admin/sermon/create' : '/admin/article/create'
                )
              }
              style={styles.createButton}
            />
          )}
        </View>

        <Searchbar
          placeholder={`Search ${contentType}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
          iconColor={theme.colors.textTertiary}
          inputStyle={{ ...theme.typography.bodyMedium, color: theme.colors.text }}
        />
      </DashboardCard>

      <DashboardCard contentStyle={{ padding: 0 }} style={{ flex: 1 }}>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          keyExtractor={item => item.id}
          onRefresh={() => loadContent(true)}
          emptyTitle={`No ${contentType} found`}
          emptyDescription={`Try adjusting your search or create a new ${contentType.slice(0, -1)}.`}
          emptyIcon="inbox"
        />
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  segmentedControl: {
    flex: 1,
    minWidth: 250,
  },
  createButton: {
    minWidth: 140,
  },
  searchBar: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
