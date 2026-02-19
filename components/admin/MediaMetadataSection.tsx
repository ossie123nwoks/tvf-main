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
  List,
  IconButton,
  ActivityIndicator,
  Divider,
  Portal,
  Modal,
  Chip,
  Switch,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { MediaFile } from '@/types/admin';

interface MediaMetadataSectionProps {
  file: MediaFile;
  onMetadataUpdate?: (file: MediaFile) => void;
  onClose?: () => void;
}

const MediaMetadataSection: React.FC<MediaMetadataSectionProps> = ({
  file,
  onMetadataUpdate,
  onClose,
}) => {
  const { theme } = useTheme();

  // State management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metadata state
  const [filename, setFilename] = useState(file.filename);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isUsed, setIsUsed] = useState(file.isUsed);
  const [customMetadata, setCustomMetadata] = useState<Record<string, any>>({});
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');

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
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
    },
    textInput: {
      marginBottom: theme.spacing.sm,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    switchLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    tagChip: {
      marginBottom: theme.spacing.xs,
    },
    addTagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    metadataContainer: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    metadataKey: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      flex: 1,
    },
    metadataValue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 2,
      textAlign: 'right',
    },
    addMetadataContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    fileIcon: {
      marginRight: theme.spacing.md,
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    fileMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
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
  });

  // Load file metadata
  const loadMetadata = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load additional metadata from the file
      setDescription(file.metadata?.description || '');
      setTags(file.metadata?.tags || []);
      setCustomMetadata(file.metadata || {});
    } catch (err) {
      console.error('Error loading metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMetadata();
  }, [file]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updatedMetadata = {
        ...customMetadata,
        description: description,
        tags: tags,
        lastModified: new Date().toISOString(),
      };

      await AdminService.updateMediaFileMetadata(file.id, updatedMetadata);

      // Update local file object
      const updatedFile = {
        ...file,
        filename: filename,
        isUsed: isUsed,
        metadata: updatedMetadata,
      };

      if (onMetadataUpdate) {
        onMetadataUpdate(updatedFile);
      }

      Alert.alert('Success', 'Metadata updated successfully');
    } catch (err) {
      console.error('Error saving metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to save metadata');
      Alert.alert('Error', 'Failed to save metadata');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addCustomMetadata = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      setCustomMetadata(prev => ({
        ...prev,
        [newMetadataKey.trim()]: newMetadataValue.trim(),
      }));
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  const removeCustomMetadata = (key: string) => {
    setCustomMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[key];
      return newMetadata;
    });
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
    return date.toLocaleString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.startsWith('audio/')) return 'music-note';
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    return 'insert-drive-file';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md }}>Loading metadata...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadMetadata}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>File Metadata</Text>
        {onClose && (
          <IconButton
            icon="close"
            onPress={onClose}
          />
        )}
      </View>

      {/* File Info */}
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.fileInfo}>
            <MaterialIcons
              name={getFileIcon(file.mimeType)}
              size={32}
              color={theme.colors.primary}
              style={styles.fileIcon}
            />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>{file.originalName}</Text>
              <Text style={styles.fileMeta}>
                {formatFileSize(file.size)} • {file.mimeType} • {formatDate(file.uploadedAt)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Basic Information */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Filename</Text>
            <TextInput
              mode="outlined"
              value={filename}
              onChangeText={setFilename}
              placeholder="Enter filename"
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter file description"
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>File is being used</Text>
            <Switch
              value={isUsed}
              onValueChange={setIsUsed}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Tags */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Tags</Text>

          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                mode="outlined"
                onClose={() => removeTag(tag)}
                style={styles.tagChip}
              >
                {tag}
              </Chip>
            ))}
          </View>

          <View style={styles.addTagContainer}>
            <TextInput
              mode="outlined"
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              style={{ flex: 1 }}
            />
            <Button
              mode="outlined"
              onPress={addTag}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Custom Metadata */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Custom Metadata</Text>

          <View style={styles.metadataContainer}>
            {Object.entries(customMetadata).map(([key, value]) => (
              <View key={key} style={styles.metadataItem}>
                <Text style={styles.metadataKey}>{key}</Text>
                <Text style={styles.metadataValue}>{String(value)}</Text>
                <IconButton
                  icon="delete"
                  size={16}
                  onPress={() => removeCustomMetadata(key)}
                />
              </View>
            ))}

            {Object.keys(customMetadata).length === 0 && (
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                No custom metadata
              </Text>
            )}
          </View>

          <View style={styles.addMetadataContainer}>
            <TextInput
              mode="outlined"
              value={newMetadataKey}
              onChangeText={setNewMetadataKey}
              placeholder="Key"
              style={{ flex: 1 }}
            />
            <TextInput
              mode="outlined"
              value={newMetadataValue}
              onChangeText={setNewMetadataValue}
              placeholder="Value"
              style={{ flex: 1 }}
            />
            <Button
              mode="outlined"
              onPress={addCustomMetadata}
              disabled={!newMetadataKey.trim() || !newMetadataValue.trim()}
            >
              Add
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* System Metadata */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>System Information</Text>

          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataKey}>File ID</Text>
              <Text style={styles.metadataValue}>{file.id}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataKey}>MIME Type</Text>
              <Text style={styles.metadataValue}>{file.mimeType}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataKey}>File Size</Text>
              <Text style={styles.metadataValue}>{formatFileSize(file.size)}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataKey}>Uploaded By</Text>
              <Text style={styles.metadataValue}>{file.uploadedBy}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataKey}>Upload Date</Text>
              <Text style={styles.metadataValue}>{formatDate(file.uploadedAt)}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataKey}>Usage Count</Text>
              <Text style={styles.metadataValue}>{file.usageCount}</Text>
            </View>
            {file.metadata?.dimensions && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataKey}>Dimensions</Text>
                <Text style={styles.metadataValue}>
                  {file.metadata.dimensions.width} × {file.metadata.dimensions.height}
                </Text>
              </View>
            )}
            {file.metadata?.duration && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataKey}>Duration</Text>
                <Text style={styles.metadataValue}>
                  {Math.floor(file.metadata.duration / 60)}:{(file.metadata.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </View>
    </View>
  );
};

export default MediaMetadataSection;
