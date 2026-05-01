import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, IconButton, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { useAdminAuth } from './AdminAuthGuard';
import { useRouter } from 'expo-router';
import { DataTable, Column, DashboardCard, ActionButton } from '@/components/admin/ui';
import { toMaterialIconName } from '@/lib/utils/materialIconName';

interface Topic {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export default function TopicManagementSection() {
  const { theme } = useTheme();
  const { checkPermission } = useAdminAuth();
  const router = useRouter();

  const [data, setData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadTopics = async (reset: boolean = false) => {
    try {
      if (reset) setLoading(true);

      const allTopics = await AdminService.getAllTopics();

      // Filter by search query locally
      const filtered = appliedSearch
        ? allTopics.filter(
            (t: any) =>
              t.name?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
              t.description?.toLowerCase().includes(appliedSearch.toLowerCase())
          )
        : allTopics;

      setData(filtered as Topic[]);
    } catch (err) {
      console.error('Failed to load topics:', err);
      Alert.alert('Error', 'Failed to load topics');
    } finally {
      if (reset) setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics(true);
  }, [appliedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = (id: string, name: string) => {
    setMenuVisible(null);
    Alert.alert('Delete Topic', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Remove from local state
            setData(prev => prev.filter(item => item.id !== id));
            Alert.alert('Success', 'Topic deleted successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete topic');
          }
        },
      },
    ]);
  };

  const canCreate = checkPermission('topics.create');
  const canEdit = checkPermission('topics.manage');
  const canDelete = checkPermission('topics.manage');

  const columns: Column<any>[] = [
    {
      key: 'name',
      title: 'Topic',
      flex: 3,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: (item.color || '#8B5CF6') + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <MaterialIcons
              name={toMaterialIconName(item.icon, 'label') as any}
              size={18}
              color={item.color || '#8B5CF6'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ ...theme.typography.titleMedium, color: theme.colors.text }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.description ? (
              <Text
                style={{
                  ...theme.typography.bodySmall,
                  color: theme.colors.textSecondary,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>
      ),
    },
    {
      key: 'color',
      title: 'Color',
      flex: 1,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: item.color || '#8B5CF6',
            marginRight: 8,
          }} />
          <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary }}>
            {item.color || '#8B5CF6'}
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
                router.push(`/admin/topic-edit/${item.id}`);
              }}
              title="Edit"
              leadingIcon="pencil"
            />
          )}
          {canDelete && (
            <Menu.Item
              onPress={() => handleDelete(item.id, item.name)}
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
          {canCreate && (
            <ActionButton
              label="New Topic"
              icon="add"
              onPress={() => router.push('/admin/topic-create')}
              style={styles.createButton}
            />
          )}
        </View>

        <Searchbar
          placeholder="Search topics..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
          iconColor={theme.colors.textTertiary}
          inputStyle={{ ...theme.typography.bodyMedium, color: theme.colors.text }}
        />
      </DashboardCard>

      <DashboardCard contentStyle={{ padding: 0, flex: 1 }} style={{ flex: 1 }}>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          keyExtractor={item => item.id}
          onRefresh={() => loadTopics(true)}
          emptyTitle="No topics found"
          emptyDescription="Try adjusting your search or create a new topic."
          emptyIcon="label"
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
    justifyContent: 'flex-end',
    marginBottom: 16,
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
