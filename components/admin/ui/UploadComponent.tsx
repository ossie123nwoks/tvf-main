import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import ActionButton from './ActionButton';

interface UploadComponentProps {
  label?: string;
  type: 'image' | 'audio' | 'document';
  currentUrl?: string | null;
  onSelect: (uri: string, fileInfo: any) => void;
  onClear: () => void;
  loading?: boolean;
  error?: string;
  helperText?: string;
}

export default function UploadComponent({
  label,
  type,
  currentUrl,
  onSelect,
  onClear,
  loading = false,
  error,
  helperText,
}: UploadComponentProps) {
  const { theme } = useTheme();

  const handlePick = async () => {
    try {
      if (type === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          onSelect(result.assets[0].uri, result.assets[0]);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: type === 'audio' ? 'audio/*' : '*/*',
          copyToCacheDirectory: true,
        });

        if (result.canceled === false && result.assets[0]) {
          onSelect(result.assets[0].uri, result.assets[0]);
        }
      }
    } catch (err) {
      console.error('Picker error:', err);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'image':
        return 'image';
      case 'audio':
        return 'audiotrack';
      case 'document':
        return 'description';
      default:
        return 'upload-file';
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { ...theme.typography.labelMedium, color: theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={handlePick}
        activeOpacity={0.7}
        disabled={loading}
        style={[
          styles.uploadBox,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderStyle: currentUrl ? 'solid' : 'dashed',
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16, color: theme.colors.textSecondary }}>Uploading...</Text>
          </View>
        ) : currentUrl ? (
          <View style={styles.previewContainer}>
            {type === 'image' ? (
              <Image source={{ uri: currentUrl }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View
                style={[styles.filePreview, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <MaterialIcons name={getIcon()} size={48} color={theme.colors.primary} />
                <Text
                  style={{
                    marginTop: 8,
                    color: theme.colors.primary,
                    ...theme.typography.labelMedium,
                  }}
                >
                  {type === 'audio' ? 'Audio Selected' : 'File Selected'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.clearButton,
                { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: theme.borderRadius.full },
              ]}
              onPress={onClear}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
            >
              <MaterialIcons name="cloud-upload" size={32} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                styles.uploadText,
                { ...theme.typography.titleMedium, color: theme.colors.text },
              ]}
            >
              Tap to select {type}
            </Text>
            <Text
              style={[
                styles.uploadSubtext,
                { ...theme.typography.bodySmall, color: theme.colors.textTertiary },
              ]}
            >
              {type === 'image' ? 'JPG, PNG, GIF up to 5MB' : 'Max size 50MB'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {(error || helperText) && (
        <Text
          style={[styles.helper, { color: error ? theme.colors.error : theme.colors.textTertiary }]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  uploadBox: {
    height: 160,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  centerContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: {
    marginBottom: 4,
  },
  uploadSubtext: {},
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  filePreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
  },
});
