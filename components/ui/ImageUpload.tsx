import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Card, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import ImageUploadService, { ImageUploadOptions } from '@/lib/services/imageUploadService';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  aspectRatio?: [number, number];
  maxWidth?: number;
  maxHeight?: number;
  folder?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder = "Tap to select an image",
  aspectRatio = [16, 9],
  maxWidth = 800,
  maxHeight = 600,
  folder = 'content',
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(value || null);

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
      minHeight: 200,
      backgroundColor: theme.colors.surface,
    },
    uploadAreaActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
      resizeMode: 'cover',
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
  });

  const handleImagePicker = async () => {
    if (disabled || uploading) return;

    try {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: () => takePhoto(),
          },
          {
            text: 'Photo Library',
            onPress: () => pickFromLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error showing image picker:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const takePhoto = async () => {
    try {
      setUploading(true);
      const result = await ImageUploadService.takePhoto({
        quality: 0.8,
        maxWidth,
        maxHeight,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setUploading(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      setUploading(true);
      const result = await ImageUploadService.pickImage({
        quality: 0.8,
        maxWidth,
        maxHeight,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      console.log('ImageUpload: Starting upload process...');
      console.log('ImageUpload: Image URI:', imageUri);
      
      // Validate the image URI
      if (!imageUri || imageUri.trim().length === 0) {
        Alert.alert('Error', 'Invalid image selected. Please try again.');
        return;
      }
      
      // Generate filename from timestamp
      const timestamp = Date.now();
      const fileName = `image_${timestamp}.jpg`;
      
      console.log('ImageUpload: Generated filename:', fileName);
      console.log('ImageUpload: Folder:', folder);
      
      const result = await ImageUploadService.uploadImage(imageUri, fileName, {
        folder,
        maxWidth,
        maxHeight,
      });

      console.log('ImageUpload: Upload result:', result);

      if (result.success && result.url) {
        console.log('ImageUpload: Upload successful, setting preview URI');
        setPreviewUri(result.url);
        onChange(result.url);
        Alert.alert('Success', 'Image uploaded successfully!');
      } else {
        console.error('ImageUpload: Upload failed:', result.error);
        Alert.alert('Upload Failed', result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('ImageUpload: Error uploading image:', error);
      Alert.alert('Error', `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewUri(null);
    onChange(null);
  };

  const renderUploadArea = () => {
    if (previewUri) {
      return (
        <View style={styles.uploadArea}>
          <Image source={{ uri: previewUri }} style={styles.imagePreview} />
          {!disabled && (
            <IconButton
              icon="close"
              size={20}
              iconColor="white"
              style={styles.removeButton}
              onPress={removeImage}
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
        onPress={handleImagePicker}
        disabled={disabled || uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <>
            <MaterialIcons
              name="add-photo-alternate"
              size={48}
              color={theme.colors.primary}
              style={styles.placeholderIcon}
            />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderUploadArea()}
      
      {previewUri && !uploading && (
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleImagePicker}
            disabled={disabled}
            style={styles.actionButton}
            icon="camera"
          >
            Change Image
          </Button>
          <Button
            mode="outlined"
            onPress={removeImage}
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

export default ImageUpload;
