import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Card, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import AudioUploadService, { AudioUploadOptions } from '@/lib/services/audioUploadService';

interface AudioUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  folder?: string;
  disabled?: boolean;
  maxFileSize?: number;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  value,
  onChange,
  placeholder = "Tap to select an audio file",
  folder = 'sermons',
  disabled = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
}) => {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    uploadArea: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      backgroundColor: theme.colors.surface,
    },
    uploadAreaActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    fileInfo: {
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    fileName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    fileSize: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    placeholderIcon: {
      marginBottom: theme.spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    removeButton: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
  });

  const handleAudioPicker = async () => {
    if (disabled || uploading) return;

    try {
      setUploading(true);
      console.log('AudioUpload: Starting audio picker...');
      
      const result = await AudioUploadService.pickAudioFile();

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('AudioUpload: Selected file:', asset);
        
        // Validate the file
        const validation = AudioUploadService.validateAudio({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
        });

        if (!validation.valid) {
          Alert.alert('Invalid File', validation.error || 'Please select a valid audio file');
          return;
        }

        // Set the selected file info
        setSelectedFile({
          name: asset.name || 'Unknown',
          size: asset.size || 0,
          uri: asset.uri,
        });

        // Upload the file
        await uploadAudio(asset.uri, asset.name || 'audio_file');
      }
    } catch (error) {
      console.error('AudioUpload: Error picking audio file:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    } finally {
      setUploading(false);
    }
  };

  const uploadAudio = async (audioUri: string, fileName: string) => {
    try {
      setUploading(true);
      console.log('AudioUpload: Starting upload process...');
      console.log('AudioUpload: Audio URI:', audioUri);
      console.log('AudioUpload: File name:', fileName);
      
      const result = await AudioUploadService.uploadAudio(audioUri, fileName, {
        folder,
        maxFileSize,
      });

      console.log('AudioUpload: Upload result:', result);

      if (result.success && result.url) {
        console.log('AudioUpload: Upload successful, setting URL');
        onChange(result.url);
        Alert.alert('Success', 'Audio file uploaded successfully!');
      } else {
        console.error('AudioUpload: Upload failed:', result.error);
        Alert.alert('Upload Failed', result.error || 'Failed to upload audio file');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('AudioUpload: Error uploading audio:', error);
      Alert.alert('Error', `Failed to upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removeAudio = () => {
    setSelectedFile(null);
    onChange(null);
  };

  const renderUploadArea = () => {
    if (selectedFile) {
      return (
        <View style={styles.uploadArea}>
          <MaterialIcons
            name="audiotrack"
            size={48}
            color={theme.colors.primary}
            style={styles.placeholderIcon}
          />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {AudioUploadService.formatFileSize(selectedFile.size)}
            </Text>
            {value && (
              <Text style={styles.statusText}>✓ Uploaded successfully</Text>
            )}
          </View>
          {!disabled && (
            <IconButton
              icon="close"
              size={20}
              iconColor="white"
              style={styles.removeButton}
              onPress={removeAudio}
            />
          )}
          {uploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={{ color: 'white', marginTop: theme.spacing.sm }}>
                Uploading...
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.uploadArea, uploading && styles.uploadAreaActive]}
        onPress={handleAudioPicker}
        disabled={disabled || uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <>
            <MaterialIcons
              name="add-circle-outline"
              size={48}
              color={theme.colors.primary}
              style={styles.placeholderIcon}
            />
            <Text style={styles.placeholderText}>{placeholder}</Text>
            <Text style={styles.statusText}>
              Supported: MP3, WAV, M4A, AAC, OGG, FLAC (Max {Math.round(maxFileSize / (1024 * 1024))}MB)
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderUploadArea()}
      
      {selectedFile && !uploading && (
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleAudioPicker}
            disabled={disabled}
            style={styles.actionButton}
            icon="file-music"
          >
            Change Audio
          </Button>
          <Button
            mode="outlined"
            onPress={removeAudio}
            disabled={disabled}
            style={styles.actionButton}
            icon="delete"
            buttonColor={theme.colors.error}
            textColor="white"
          >
            Remove
          </Button>
        </View>
      )}
    </View>
  );
};

export default AudioUpload;
