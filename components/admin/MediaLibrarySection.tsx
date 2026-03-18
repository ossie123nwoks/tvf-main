import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Text, Searchbar, Chip, IconButton, Menu, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { MediaFile } from '@/types/admin';
import { DataTable, Column, DashboardCard, ActionButton } from '@/components/admin/ui';

interface MediaLibrarySectionProps {
  onFileSelect?: (file: MediaFile) => void;
  onFileEdit?: (file: MediaFile) => void;
  onFileDelete?: (file: MediaFile) => void;
  selectionMode?: boolean;
  onSelectionChange?: (selectedFiles: MediaFile[]) => void;
}

export default function MediaLibrarySection({
  onFileSelect,
  onFileEdit,
  onFileDelete,
  selectionMode = false,
  onSelectionChange,
}: MediaLibrarySectionProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadFiles = async (reset: boolean = false) => {
    try {
      if (reset) setLoading(true);

      const filters = {
        search: appliedSearch || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        isUsed: selectedStatus !== 'all' ? selectedStatus === 'used' : undefined,
      };

      const result = await AdminService.getMediaFiles(1, 50, filters);

      if (reset) {
        setFiles(result.files);
      } else {
        setFiles(prev => [...prev, ...result.files]);
      }
    } catch (err) {
      console.error('Error loading media files:', err);
      Alert.alert('Error', 'Failed to load media files');
    } finally {
      if (reset) setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(true);
  }, [appliedSearch, selectedType, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDeleteFile = async (file: MediaFile) => {
    setMenuVisible(null);
    Alert.alert('Delete File', `Are you sure you want to delete "${file.filename}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await AdminService.deleteMediaFile(file.id);
            setFiles(prev => prev.filter(f => f.id !== file.id));
            if (onFileDelete) onFileDelete(file);
            Alert.alert('Success', 'File deleted successfully');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete file');
          }
        },
      },
    ]);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.startsWith('audio/')) return 'library-music';
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    return 'insert-drive-file';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const columns: Column<MediaFile>[] = [
    {
      key: 'name',
      title: 'File',
      flex: 3,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialIcons
              name={getFileIcon(item.mimeType)}
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ ...theme.typography.titleSmall, color: theme.colors.text }}
              numberOfLines={1}
            >
              {item.filename}
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary }}>
              {formatFileSize(item.size)} • {new Date(item.uploadedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      flex: 1,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Badge
            size={8}
            style={{
              backgroundColor: item.isUsed ? theme.colors.primary : theme.colors.textTertiary,
              marginRight: 8,
            }}
          />
          <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary }}>
            {item.isUsed ? 'Used' : 'Unused'}
          </Text>
        </View>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 60,
      render: item => (
        <Menu
          visible={menuVisible === item.id}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton icon="dots-vertical" size={20} onPress={() => setMenuVisible(item.id)} />
          }
        >
          {onFileSelect && (
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                onFileSelect(item);
              }}
              title="Select"
              leadingIcon="check"
            />
          )}
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              if (onFileEdit) onFileEdit(item);
            }}
            title="Edit Details"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => handleDeleteFile(item)}
            title="Delete"
            titleStyle={{ color: theme.colors.error }}
            leadingIcon={() => <MaterialIcons name="delete" size={20} color={theme.colors.error} />}
          />
        </Menu>
      ),
    },
  ];

  if (!isTablet) {
    // Hide status column on mobile to save space
    columns.splice(1, 1);
  }

  return (
    <View style={styles.container}>
      <DashboardCard style={{ marginBottom: 16 }}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search media..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            elevation={0}
            iconColor={theme.colors.textTertiary}
            inputStyle={{ ...theme.typography.bodyMedium, color: theme.colors.text }}
          />
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setShowFilters(!showFilters)}
            containerColor={showFilters ? theme.colors.primaryContainer : 'transparent'}
            iconColor={showFilters ? theme.colors.primary : theme.colors.textSecondary}
          />
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Type:</Text>
              {['all', 'image', 'video', 'audio', 'document'].map(type => (
                <Chip
                  key={type}
                  selected={selectedType === type}
                  onPress={() => setSelectedType(type)}
                  style={styles.chip}
                  showSelectedOverlay
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status:</Text>
              {['all', 'used', 'unused'].map(status => (
                <Chip
                  key={status}
                  selected={selectedStatus === status}
                  onPress={() => setSelectedStatus(status)}
                  style={styles.chip}
                  showSelectedOverlay
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </DashboardCard>

      <DashboardCard contentStyle={{ padding: 0 }} style={{ flex: 1 }}>
        <DataTable
          columns={columns}
          data={files}
          keyExtractor={item => item.id}
          loading={loading}
          onRefresh={() => loadFiles(true)}
          emptyTitle="No Media Files"
          emptyDescription="Upload files to manage your app's media."
          emptyIcon="cloud-upload"
        />
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filtersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterLabel: {
    width: 60,
    fontSize: 14,
    color: '#666',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
