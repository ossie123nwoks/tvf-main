import { supabase } from '@/lib/supabase/client';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface ImageUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  folder?: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && mediaLibraryStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick an image from the device
   */
  static async pickImage(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    try {
      const hasPermissions = await this.requestPermissions();
      
      if (!hasPermissions) {
        throw new Error('Camera and media library permissions are required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Good aspect ratio for content thumbnails
        quality: options.quality || 0.8,
        base64: false,
        exif: false, // Disable EXIF data to reduce file size
      });

      // Validate result
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.uri || asset.uri.trim().length === 0) {
          console.error('Image picker returned invalid URI:', asset);
        }
      }

      return result;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * Take a photo with the camera
   */
  static async takePhoto(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    try {
      const hasPermissions = await this.requestPermissions();
      
      if (!hasPermissions) {
        throw new Error('Camera and media library permissions are required');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: options.quality || 0.8,
        base64: false,
        exif: false, // Disable EXIF data to reduce file size
      });

      // Validate result
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.uri || asset.uri.trim().length === 0) {
          console.error('Camera returned invalid URI:', asset);
        }
      }

      return result;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  /**
   * Upload an image to Supabase Storage
   */
  static async uploadImage(
    imageUri: string,
    fileName: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      console.log('Starting image upload process...');
      console.log('Image URI:', imageUri);
      console.log('File name:', fileName);
      
      // Validate that we have a valid URI
      if (!imageUri || imageUri.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid image URI provided.',
        };
      }
      
      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File does not exist at the specified path.',
        };
      }
      
      if (fileInfo.size && fileInfo.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 5MB.',
        };
      }

      // Normalize the image URI for Windows compatibility
      let normalizedUri = imageUri;
      if (Platform.OS === 'windows' && normalizedUri.startsWith('file:///')) {
        // Windows file URIs need proper formatting
        normalizedUri = normalizedUri.replace(/^file:\/\//, 'file://');
      }

      // Read the file as base64 first
      console.log('Reading file as base64...');
      console.log('Normalized URI:', normalizedUri);
      
      let base64: string;
      try {
        base64 = await FileSystem.readAsStringAsync(normalizedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (readError) {
        console.error('Error reading file:', readError);
        return {
          success: false,
          error: 'Failed to read image file. Please ensure the file is accessible and not corrupted.',
        };
      }
      
      console.log('Base64 length:', base64?.length || 0);
      
      if (!base64 || base64.length === 0) {
        return {
          success: false,
          error: 'Failed to read image file. File may be corrupted or empty.',
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
          error: 'Failed to process image data. File may be corrupted.',
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Create folder path
      const folder = options.folder || 'content';
      const filePath = `${folder}/${uniqueFileName}`;
      
      console.log('Upload path:', filePath);

      // Upload to Supabase Storage using bytes array
      console.log('Uploading to Supabase Storage...');
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, bytes, {
          contentType: 'image/jpeg',
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
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  static async deleteImage(filePath: string): Promise<{ success: boolean; error?: string }> {
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
   * Get public URL for an image
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Resize image if needed
   */
  static async resizeImage(
    imageUri: string,
    maxWidth: number = 800,
    maxHeight: number = 600
  ): Promise<string> {
    try {
      // For now, we'll return the original URI
      // In a production app, you might want to use a library like expo-image-manipulator
      // to resize images before uploading
      return imageUri;
    } catch (error) {
      console.error('Image resize error:', error);
      return imageUri;
    }
  }

  /**
   * Validate image file
   */
  static validateImage(file: { uri: string; type?: string; size?: number }): {
    valid: boolean;
    error?: string;
  } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (file.type && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.',
      };
    }

    // Check file size
    if (file.size && file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.',
      };
    }

    return { valid: true };
  }
}

export default ImageUploadService;
