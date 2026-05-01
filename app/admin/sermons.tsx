import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, IconButton, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { AdminAuthGuard, useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { useRouter, useFocusEffect } from 'expo-router';
import { HeaderBar, DataTable, Column, DashboardCard, ActionButton } from '@/components/admin/ui';

export default function SermonsManagementPage() {
  const { theme } = useTheme();
  const { checkPermission } = useAdminAuth();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadSermons = useCallback(async () => {
    try {
      setLoading(true);
      const result = await AdminService.getSermons(1, 50, appliedSearch || undefined);
      setData(result.sermons || []);
    } catch (err) {
      console.error('Failed to load sermons:', err);
      Alert.alert('Error', 'Failed to load sermons');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch]);

  // Reload data when screen comes into focus (e.g. after create/edit)
  useFocusEffect(
    useCallback(() => {
      loadSermons();
    }, [loadSermons])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = (id: string, title: string) => {
    setMenuVisible(null);
    Alert.alert('Delete Sermon', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await AdminService.deleteSermon(id);
            setData(prev => prev.filter(item => item.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete sermon');
          }
        },
      },
    ]);
  };

  const getStatusColor = (isPublished: boolean) =>
    isPublished ? theme.colors.success : theme.colors.warning;

  const canCreate = checkPermission('content.sermons.create');
  const canEdit = checkPermission('content.sermons.edit');
  const canDelete = checkPermission('content.sermons.delete');

  const columns: Column<any>[] = [
    {
      key: 'title',
      title: 'Title',
      flex: 3,
      render: (item: any) => (
        <View style={{ paddingRight: 8 }}>
          <Text
            style={{ ...theme.typography.titleMedium, color: theme.colors.text }}
            numberOfLines={1}
          >
            {item.title || 'Untitled'}
          </Text>
          <Text
            style={{
              ...theme.typography.bodySmall,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {item.preacher || 'Unknown'} • {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
          </Text>
        </View>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      flex: 1,
      render: (item: any) => (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: getStatusColor(!!item.is_published) + '15',
          }}
        >
          <Text
            style={{ ...theme.typography.labelSmall, color: getStatusColor(!!item.is_published) }}
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
      render: (item: any) => (
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
      render: (item: any) => (
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
                router.push(`/admin/sermon/edit/${item.id}`);
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
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title="Manage Sermons"
          subtitle="Create, edit, and publish sermons"
          backButton
          rightAction={
            canCreate ? (
              <ActionButton
                label="New"
                icon="add"
                size="small"
                onPress={() => router.push('/admin/sermon/create')}
              />
            ) : undefined
          }
        />

        <View style={styles.content}>
          <DashboardCard style={{ margin: 16, marginBottom: 8 }}>
            <Searchbar
              placeholder="Search sermons..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              elevation={0}
              iconColor={theme.colors.textTertiary}
              inputStyle={{ ...theme.typography.bodyMedium, color: theme.colors.text }}
            />
          </DashboardCard>

          <DashboardCard contentStyle={{ padding: 0 }} style={{ flex: 1, margin: 16, marginTop: 8 }}>
            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              keyExtractor={(item: any) => item.id}
              onRefresh={loadSermons}
              emptyTitle="No sermons found"
              emptyDescription="Try adjusting your search or create a new sermon."
              emptyIcon="headset"
            />
          </DashboardCard>
        </View>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  searchBar: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
