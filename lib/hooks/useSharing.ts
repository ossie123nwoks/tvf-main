import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  sharingService,
  ShareContent,
  ShareOptions,
  ShareResult,
  ShareAnalytics,
} from '@/lib/services/sharingService';
import { useAuth } from '@/lib/auth/AuthContext';

export interface UseSharingReturn {
  sharing: boolean;
  availableMethods: string[];
  shareContent: (content: ShareContent, options: ShareOptions) => Promise<ShareResult>;
  getShareAnalytics: (contentId: string) => Promise<{
    totalShares: number;
    sharesByMethod: Record<string, number>;
    recentShares: ShareAnalytics[];
  }>;
  loadAvailableMethods: () => Promise<void>;
}

export const useSharing = (): UseSharingReturn => {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);

  const shareContent = useCallback(async (
    content: ShareContent,
    options: ShareOptions
  ): Promise<ShareResult> => {
    setSharing(true);
    
    try {
      const result = await sharingService.shareContent(content, options);
      
      if (result.success) {
        // Show success feedback based on method
        switch (options.method) {
          case 'copy':
            Alert.alert('Copied!', 'Content link has been copied to your clipboard.');
            break;
          case 'email':
            Alert.alert('Email Opened', 'Your email app has been opened with the content details.');
            break;
          case 'sms':
            Alert.alert('SMS Opened', 'Your messaging app has been opened with the content details.');
            break;
          case 'whatsapp':
            Alert.alert('WhatsApp Opened', 'WhatsApp has been opened with the content details.');
            break;
          case 'telegram':
            Alert.alert('Telegram Opened', 'Telegram has been opened with the content details.');
            break;
          case 'twitter':
            Alert.alert('Twitter Opened', 'Twitter has been opened with the content details.');
            break;
          case 'facebook':
            Alert.alert('Facebook Opened', 'Facebook has been opened with the content details.');
            break;
          default:
            // Native share doesn't need additional feedback
            break;
        }
      } else {
        // Show error feedback
        Alert.alert(
          'Share Failed',
          result.error || 'Unable to share content. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Share Error', errorMessage, [{ text: 'OK' }]);
      
      return {
        success: false,
        method: options.method,
        error: errorMessage,
      };
    } finally {
      setSharing(false);
    }
  }, []);

  const getShareAnalytics = useCallback(async (contentId: string) => {
    try {
      return await sharingService.getShareAnalytics(contentId);
    } catch (error) {
      console.error('Error fetching share analytics:', error);
      return {
        totalShares: 0,
        sharesByMethod: {},
        recentShares: [],
      };
    }
  }, []);

  const loadAvailableMethods = useCallback(async () => {
    try {
      const methods = await sharingService.getAvailableSharingMethods();
      setAvailableMethods(methods);
    } catch (error) {
      console.error('Error loading available sharing methods:', error);
      setAvailableMethods(['native', 'copy']); // Fallback methods
    }
  }, []);

  return {
    sharing,
    availableMethods,
    shareContent,
    getShareAnalytics,
    loadAvailableMethods,
  };
};
