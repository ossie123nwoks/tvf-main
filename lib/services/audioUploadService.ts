import { supabase } from '@/lib/supabase/client';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export interface AudioUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface AudioUploadOptions {
  folder?: string;
  maxFileSize?: number; // in bytes
}

export class AudioUploadService {
  private static readonly BUCKET_NAME = 'audio';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for audio files

  /**
   * Request permissions for document picker
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Document picker doesn't require explicit permissions on most platforms
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick an audio file from the device
   */
  static async pickAudioFile(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      return result;
    } catch (error) {
      console.error('Error picking audio file:', error);
      throw error;
    }
  }

  /**
   * Upload an audio file to Supabase Storage
   */
  static async uploadAudio(
    audioUri: string,
    fileName: string,
    options: AudioUploadOptions = {}
  ): Promise<AudioUploadResult> {
    try {
      console.log('Starting audio upload process...');
      console.log('Audio URI:', audioUri);
      console.log('File name:', fileName);
      
      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File does not exist at the specified path.',
        };
      }
      
      const maxSize = options.maxFileSize || this.MAX_FILE_SIZE;
      if (fileInfo.size && fileInfo.size > maxSize) {
        return {
          success: false,
          error: `File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`,
        };
      }

      // Read the file as base64 first
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Base64 length:', base64.length);
      
      if (!base64 || base64.length === 0) {
        return {
          success: false,
          error: 'Failed to read audio file. File may be corrupted or empty.',
        };
      }

      // Convert base64 to binary data for upload
      console.log('Converting base64 to binary data...');
      
      // Create a simple binary string from base64
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Binary data size:', bytes.length);
      
      if (bytes.length === 0) {
        return {
          success: false,
          error: 'Failed to process audio data. File may be corrupted.',
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop() || 'mp3';
      const uniqueFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Create folder path
      const folder = options.folder || 'sermons';
      const filePath = `${folder}/${uniqueFileName}`;
      
      console.log('Upload path:', filePath);

      // Determine content type based on file extension
      const contentType = this.getContentType(fileExtension);

      // Upload to Supabase Storage using bytes array
      console.log('Uploading to Supabase Storage...');
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, bytes, {
          contentType: contentType,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('Upload successful, data:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('Audio upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete an audio file from Supabase Storage
   */
  static async deleteAudio(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get public URL for an audio file
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Get content type based on file extension
   */
  private static getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
    };

    return contentTypes[extension.toLowerCase()] || 'audio/mpeg';
  }

  /**
   * Validate audio file
   */
  static validateAudio(file: { uri: string; name?: string; size?: number }): {
    valid: boolean;
    error?: string;
  } {
    // Check file type
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
    const fileExtension = file.name?.split('.').pop()?.toLowerCase();
    
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Invalid file type. Please select an MP3, WAV, M4A, AAC, OGG, or FLAC audio file.',
      };
    }

    // Check file size
    if (file.size && file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 50MB.',
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default AudioUploadService;
