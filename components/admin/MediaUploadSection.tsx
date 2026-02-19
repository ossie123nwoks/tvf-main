import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  List,
  IconButton,
  Chip,
  Portal,
  Modal,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { MediaFile, MediaUploadProgress } from '@/types/admin';

interface MediaUploadSectionProps {
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
}

const { width } = Dimensions.get('window');

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  maxFileSize = 50, // 50MB default
}) => {
  const { theme } = useTheme();
  
  // State management
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    uploadArea: {
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderStyle: 'dashed',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    uploadAreaActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    uploadIcon: {
      marginBottom: theme.spacing.md,
    },
    uploadText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    uploadSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    uploadButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    fileList: {
      marginTop: theme.spacing.md,
    },
    fileItem: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    fileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fileInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fileIcon: {
      marginRight: theme.spacing.md,
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    fileSize: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    fileProgress: {
      marginTop: theme.spacing.sm,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    uploadActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
    },
    previewModal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    previewContent: {
      width: '90%',
      height: '80%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    previewImage: {
      width: '100%',
      height: '70%',
      resizeMode: 'contain',
    },
    previewInfo: {
      marginTop: theme.spacing.md,
    },
    errorContainer: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    typeChip: {
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'music';
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    return 'insert-drive-file';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: any) => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      throw new Error(`File type ${file.type} is not allowed.`);
    }

    return true;
  };

  const handleFileSelection = async (type: 'image' | 'document') => {
    try {
      setError(null);
      let result;

      if (type === 'image') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: true,
          quality: 0.8,
        });

        if (result.canceled) return;

        const files = result.assets.map(asset => ({
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
          uri: asset.uri,
        }));

        files.forEach(validateFile);
        setSelectedFiles(prev => [...prev, ...files]);
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: allowedTypes.join(','),
          multiple: true,
        });

        if (result.canceled) return;

        const files = result.assets.map(asset => ({
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          uri: asset.uri,
        }));

        files.forEach(validateFile);
        setSelectedFiles(prev => [...prev, ...files]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select files';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('No Files', 'Please select files to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress([]);

      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileId = `file_${Date.now()}_${index}`;
        
        // Initialize progress tracking
        setUploadProgress(prev => [...prev, {
          fileId,
          filename: file.name,
          progress: 0,
          status: 'uploading',
        }]);

        try {
          // Simulate file upload with progress
          const uploadResult = await simulateFileUpload(file, fileId);
          
          // Update progress to completed
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, progress: 100, status: 'completed' }
              : p
          ));

          return uploadResult;
        } catch (err) {
          // Update progress to error
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
              : p
          ));
          throw err;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);

      // Clear selected files and progress
      setSelectedFiles([]);
      setUploadProgress([]);

      Alert.alert('Success', `Successfully uploaded ${successfulUploads.length} files.`);
      
      if (onUploadComplete) {
        onUploadComplete(successfulUploads);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const simulateFileUpload = async (file: any, fileId: string): Promise<MediaFile> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Simulate successful upload
          const mediaFile: MediaFile = {
            id: fileId,
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: `https://example.com/uploads/${fileId}`,
            uploadedBy: 'current_user_id',
            uploadedAt: new Date().toISOString(),
            isUsed: false,
            usageCount: 0,
            metadata: {
              duration: file.type.startsWith('video/') ? 120 : undefined,
              dimensions: file.type.startsWith('image/') ? { width: 1920, height: 1080 } : undefined,
            },
          };
          
          resolve(mediaFile);
        } else {
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, progress: Math.round(progress) }
              : p
          ));
        }
      }, 200);
    });
  };

  const handlePreviewFile = (file: any) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const renderFileItem = (file: any, index: number) => {
    const progress = uploadProgress.find(p => p.filename === file.name);
    
    return (
      <Card key={index} style={styles.fileItem}>
        <Card.Content>
          <View style={styles.fileHeader}>
            <View style={styles.fileInfo}>
              <MaterialIcons
                name={getFileIcon(file.type)}
                size={24}
                color={theme.colors.primary}
                style={styles.fileIcon}
              />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon="eye"
                size={20}
                onPress={() => handlePreviewFile(file)}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => removeFile(index)}
              />
            </View>
          </View>
          
          {progress && (
            <View style={styles.fileProgress}>
              <Text style={styles.progressText}>
                {progress.status === 'uploading' && `${progress.progress}%`}
                {progress.status === 'completed' && 'Completed'}
                {progress.status === 'error' && `Error: ${progress.error}`}
              </Text>
              <ProgressBar
                progress={progress.progress / 100}
                color={progress.status === 'error' ? theme.colors.error : theme.colors.primary}
                style={{ height: 4 }}
              />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderPreviewModal = () => (
    <Portal>
      <Modal
        visible={showPreview}
        onDismiss={() => setShowPreview(false)}
        contentContainerStyle={styles.previewModal}
      >
        <View style={styles.previewContent}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>File Preview</Text>
            <IconButton
              icon="close"
              onPress={() => setShowPreview(false)}
            />
          </View>
          
          {previewFile && (
            <>
              {previewFile.type.startsWith('image/') ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Image preview would go here</Text>
                </View>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons
                    name={getFileIcon(previewFile.type)}
                    size={64}
                    color={theme.colors.primary}
                  />
                </View>
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.fileName}>{previewFile.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(previewFile.size)}</Text>
                <Text style={styles.fileSize}>Type: {previewFile.type}</Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Media Upload</Text>
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
          Max {maxFiles} files, {maxFileSize}MB each
        </Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Upload Area */}
      <Card style={[styles.uploadArea, uploading && styles.uploadAreaActive]}>
        <MaterialIcons
          name="cloud-upload"
          size={48}
          color={theme.colors.primary}
          style={styles.uploadIcon}
        />
        <Text style={styles.uploadText}>
          {uploading ? 'Uploading Files...' : 'Select Files to Upload'}
        </Text>
        <Text style={styles.uploadSubtext}>
          Choose images, videos, audio files, or documents
        </Text>
        
        {!uploading && (
          <View style={styles.uploadButtons}>
            <Button
              mode="outlined"
              onPress={() => handleFileSelection('image')}
              icon="image"
              disabled={selectedFiles.length >= maxFiles}
            >
              Photos
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleFileSelection('document')}
              icon="insert-drive-file"
              disabled={selectedFiles.length >= maxFiles}
            >
              Documents
            </Button>
          </View>
        )}
      </Card>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <View style={styles.fileList}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: theme.spacing.md }}>
            Selected Files ({selectedFiles.length})
          </Text>
          {selectedFiles.map(renderFileItem)}
        </View>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <View style={styles.fileList}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: theme.spacing.md }}>
            Upload Progress
          </Text>
          {uploadProgress.map((progress) => (
            <Card key={progress.fileId} style={styles.fileItem}>
              <Card.Content>
                <View style={styles.fileHeader}>
                  <View style={styles.fileInfo}>
                    <MaterialIcons
                      name="cloud-upload"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.fileIcon}
                    />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{progress.filename}</Text>
                      <Text style={styles.fileSize}>
                        {progress.status === 'uploading' && 'Uploading...'}
                        {progress.status === 'completed' && 'Completed'}
                        {progress.status === 'error' && 'Failed'}
                      </Text>
                    </View>
                  </View>
                  {progress.status === 'uploading' && (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  )}
                </View>
                
                <View style={styles.fileProgress}>
                  <Text style={styles.progressText}>
                    {progress.status === 'uploading' && `${progress.progress}%`}
                    {progress.status === 'completed' && 'Upload completed successfully'}
                    {progress.status === 'error' && `Error: ${progress.error}`}
                  </Text>
                  <ProgressBar
                    progress={progress.progress / 100}
                    color={progress.status === 'error' ? theme.colors.error : theme.colors.primary}
                    style={{ height: 4 }}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Upload Actions */}
      {selectedFiles.length > 0 && !uploading && (
        <View style={styles.uploadActions}>
          <Button
            mode="outlined"
            onPress={() => setSelectedFiles([])}
            icon="delete-sweep"
          >
            Clear All
          </Button>
          <Button
            mode="contained"
            onPress={uploadFiles}
            icon="upload"
          >
            Upload {selectedFiles.length} Files
          </Button>
        </View>
      )}

      {/* Preview Modal */}
      {renderPreviewModal()}
    </View>
  );
};

export default MediaUploadSection;
