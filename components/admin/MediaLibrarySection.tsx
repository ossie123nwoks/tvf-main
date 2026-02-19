import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  Chip,
  List,
  Avatar,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
  Badge,
  Portal,
  Modal,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { MediaFile } from '@/types/admin';

interface MediaLibrarySectionProps {
  onFileSelect?: (file: MediaFile) => void;
  onFileEdit?: (file: MediaFile) => void;
  onFileDelete?: (file: MediaFile) => void;
  selectionMode?: boolean;
  onSelectionChange?: (selectedFiles: MediaFile[]) => void;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const MediaLibrarySection: React.FC<MediaLibrarySectionProps> = ({
  onFileSelect,
  onFileEdit,
  onFileDelete,
  selectionMode = false,
  onSelectionChange,
}) => {
  const { theme } = useTheme();

  // State management
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Modal state
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [fileDetailsModal, setFileDetailsModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    searchBar: {
      flex: 1,
    },
    filterButton: {
      marginLeft: theme.spacing.sm,
    },
    filtersContainer: {
      marginBottom: theme.spacing.md,
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    bulkActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    fileCard: {
      width: isTablet ? '23%' : '48%',
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    fileImage: {
      width: '100%',
      height: isTablet ? 120 : 100,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fileIcon: {
      marginBottom: theme.spacing.xs,
    },
    fileInfo: {
      padding: theme.spacing.sm,
    },
    fileName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    fileMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fileSize: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    fileStatus: {
    },
    selectedFile: {
      backgroundColor: theme.colors.primary + '10',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    listContainer: {
      flex: 1,
    },
    listItem: {
      marginBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    listItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
    },
    listItemIcon: {
      marginRight: theme.spacing.md,
    },
    listItemInfo: {
      flex: 1,
    },
    listItemName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    listItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    listItemSize: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    listItemDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    listItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      minWidth: 80,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    errorContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    loadMoreButton: {
      marginTop: theme.spacing.md,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      maxWidth: 500,
      width: '100%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
    },
    modalSection: {
      marginBottom: theme.spacing.md,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    modalText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    metadataContainer: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.sm,
    },
  });

  // Load media files
  const loadFiles = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      }

      const filters = {
        search: searchQuery || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        isUsed: selectedStatus !== 'all' ? selectedStatus === 'used' : undefined,
      };

      const result = await AdminService.getMediaFiles(pageNum, 20, filters);

      if (reset) {
        setFiles(result.files);
      } else {
        setFiles(prev => [...prev, ...result.files]);
      }

      setPage(result.page);
      setTotalPages(result.totalPages);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      console.error('Error loading media files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadFiles(1, true);
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadFiles(1, true);
  }, [searchQuery, selectedType, selectedStatus, sortBy, sortOrder]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFiles(1, true);
  };

  const handleFilePress = (file: MediaFile) => {
    if (selectionMode) {
      toggleFileSelection(file.id);
    } else if (onFileSelect) {
      onFileSelect(file);
    } else {
      setSelectedFile(file);
      setFileDetailsModal(true);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);

    if (onSelectionChange) {
      const selectedFilesList = files.filter(file => newSelection.has(file.id));
      onSelectionChange(selectedFilesList);
    }
  };

  const selectAllFiles = () => {
    const newSelection = new Set(files.map(file => file.id));
    setSelectedFiles(newSelection);

    if (onSelectionChange) {
      onSelectionChange(files);
    }
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());

    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleDeleteFile = async (file: MediaFile) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.filename}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.deleteMediaFile(file.id);

              // Update local state
              setFiles(prev => prev.filter(f => f.id !== file.id));

              if (onFileDelete) {
                onFileDelete(file);
              }

              Alert.alert('Success', 'File deleted successfully');
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.startsWith('audio/')) return 'music-note';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderFileCard = (file: MediaFile) => {
    const isSelected = selectedFiles.has(file.id);

    return (
      <Card
        key={file.id}
        style={[styles.fileCard, isSelected && styles.selectedFile]}
        onPress={() => handleFilePress(file)}
      >
        <View style={styles.fileImage}>
          <MaterialIcons
            name={getFileIcon(file.mimeType)}
            size={32}
            color={theme.colors.primary}
            style={styles.fileIcon}
          />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={2}>
            {file.filename}
          </Text>
          <View style={styles.fileMeta}>
            <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
            <Chip
              mode="outlined"
              style={styles.fileStatus}
              textStyle={{ fontSize: 8 }}
            >
              {file.isUsed ? 'Used' : 'Unused'}
            </Chip>
          </View>
        </View>
      </Card>
    );
  };

  const renderFileListItem = (file: MediaFile) => {
    const isSelected = selectedFiles.has(file.id);

    return (
      <Card
        key={file.id}
        style={[styles.listItem, isSelected && styles.selectedFile]}
        onPress={() => handleFilePress(file)}
      >
        <View style={styles.listItemContent}>
          {selectionMode && (
            <IconButton
              icon={isSelected ? 'check-circle' : 'radio-button-unchecked'}
              size={20}
              onPress={() => toggleFileSelection(file.id)}
            />
          )}
          <MaterialIcons
            name={getFileIcon(file.mimeType)}
            size={24}
            color={theme.colors.primary}
            style={styles.listItemIcon}
          />
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemName}>{file.filename}</Text>
            <View style={styles.listItemMeta}>
              <Text style={styles.listItemSize}>{formatFileSize(file.size)}</Text>
              <Text style={styles.listItemDate}>{formatDate(file.uploadedAt)}</Text>
              <Chip
                mode="outlined"
                style={styles.fileStatus}
                textStyle={{ fontSize: 10 }}
              >
                {file.isUsed ? 'Used' : 'Unused'}
              </Chip>
            </View>
          </View>
          <View style={styles.listItemActions}>
            <Menu
              visible={menuVisible === file.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="more-vert"
                  size={20}
                  onPress={() => setMenuVisible(file.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  setSelectedFile(file);
                  setFileDetailsModal(true);
                }}
                title="View Details"
                leadingIcon="info"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  if (onFileEdit) onFileEdit(file);
                }}
                title="Edit Metadata"
                leadingIcon="edit"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteFile(file);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
        </View>
      </Card>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    const fileTypes = [
      { id: 'all', label: 'All Types' },
      { id: 'image', label: 'Images' },
      { id: 'video', label: 'Videos' },
      { id: 'audio', label: 'Audio' },
      { id: 'document', label: 'Documents' },
    ];

    const statusOptions = [
      { id: 'all', label: 'All Files' },
      { id: 'used', label: 'Used' },
      { id: 'unused', label: 'Unused' },
    ];

    const sortOptions = [
      { id: 'name', label: 'Name' },
      { id: 'date', label: 'Date' },
      { id: 'size', label: 'Size' },
      { id: 'type', label: 'Type' },
    ];

    return (
      <View style={styles.filtersContainer}>
        <Text style={{ marginBottom: theme.spacing.sm, fontWeight: '600' }}>
          Filters & Sorting
        </Text>

        <View style={styles.filterChips}>
          <Text style={{ marginRight: theme.spacing.sm, alignSelf: 'center' }}>Type:</Text>
          {fileTypes.map((type) => (
            <Chip
              key={type.id}
              selected={selectedType === type.id}
              onPress={() => setSelectedType(type.id)}
              mode="outlined"
            >
              {type.label}
            </Chip>
          ))}
        </View>

        <View style={styles.filterChips}>
          <Text style={{ marginRight: theme.spacing.sm, alignSelf: 'center' }}>Status:</Text>
          {statusOptions.map((status) => (
            <Chip
              key={status.id}
              selected={selectedStatus === status.id}
              onPress={() => setSelectedStatus(status.id)}
              mode="outlined"
            >
              {status.label}
            </Chip>
          ))}
        </View>

        <View style={styles.filterChips}>
          <Text style={{ marginRight: theme.spacing.sm, alignSelf: 'center' }}>Sort by:</Text>
          {sortOptions.map((sort) => (
            <Chip
              key={sort.id}
              selected={sortBy === sort.id}
              onPress={() => setSortBy(sort.id as any)}
              mode="outlined"
            >
              {sort.label}
            </Chip>
          ))}
          <Chip
            selected={sortOrder === 'desc'}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            mode="outlined"
            icon={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
          >
            {sortOrder === 'desc' ? 'Desc' : 'Asc'}
          </Chip>
        </View>
      </View>
    );
  };

  const renderFileDetailsModal = () => {
    if (!selectedFile) return null;

    return (
      <Portal>
        <Modal
          visible={fileDetailsModal}
          onDismiss={() => setFileDetailsModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>File Details</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Basic Information</Text>
              <Text style={styles.modalText}>Name: {selectedFile.filename}</Text>
              <Text style={styles.modalText}>Original Name: {selectedFile.originalName}</Text>
              <Text style={styles.modalText}>Type: {selectedFile.mimeType}</Text>
              <Text style={styles.modalText}>Size: {formatFileSize(selectedFile.size)}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Usage Information</Text>
              <Text style={styles.modalText}>Status: {selectedFile.isUsed ? 'Used' : 'Unused'}</Text>
              <Text style={styles.modalText}>Usage Count: {selectedFile.usageCount}</Text>
              <Text style={styles.modalText}>Uploaded: {formatDate(selectedFile.uploadedAt)}</Text>
            </View>

            {selectedFile.metadata && Object.keys(selectedFile.metadata).length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Metadata</Text>
                <View style={styles.metadataContainer}>
                  <Text style={styles.modalText}>
                    {JSON.stringify(selectedFile.metadata, null, 2)}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
              <Button mode="outlined" onPress={() => setFileDetailsModal(false)}>
                Close
              </Button>
              <Button mode="contained" onPress={() => {
                setFileDetailsModal(false);
                if (onFileEdit) onFileEdit(selectedFile);
              }}>
                Edit
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };

  if (loading && files.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md }}>Loading media files...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => loadFiles(1, true)}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Media Library</Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            mode="outlined"
            onPress={() => setShowFilters(!showFilters)}
            icon="filter"
            compact
          >
            Filters
          </Button>
          {selectionMode && (
            <Button
              mode={bulkActionMode ? "contained" : "outlined"}
              onPress={() => setBulkActionMode(!bulkActionMode)}
              compact
            >
              {bulkActionMode ? 'Cancel' : 'Select'}
            </Button>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search media files..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {renderFilters()}

      {/* Bulk Actions */}
      {bulkActionMode && selectedFiles.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={{ marginRight: theme.spacing.md }}>
            {selectedFiles.size} selected
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button mode="outlined" onPress={selectAllFiles} compact>
              Select All
            </Button>
            <Button mode="outlined" onPress={clearSelection} compact>
              Clear
            </Button>
            <Button mode="outlined" onPress={() => {
              // Handle bulk delete
              Alert.alert('Bulk Delete', `Delete ${selectedFiles.size} files?`);
            }} compact>
              Delete
            </Button>
          </View>
        </View>
      )}

      {/* File List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {files.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="folder-open"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No files found matching your search' : 'No media files found'}
            </Text>
            {searchQuery && (
              <Button mode="outlined" onPress={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </View>
        ) : (
          <View style={isTablet ? styles.gridContainer : styles.listContainer}>
            {isTablet ? files.map(renderFileCard) : files.map(renderFileListItem)}
          </View>
        )}
      </ScrollView>

      {/* File Details Modal */}
      {renderFileDetailsModal()}
    </View>
  );
};

export default MediaLibrarySection;
