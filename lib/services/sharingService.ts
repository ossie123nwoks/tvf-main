import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';
import * as IntentLauncher from 'expo-intent-launcher';
import { Share, Alert, Platform, Linking } from 'react-native';
import { createShareableDeepLink } from '@/lib/utils/deepLinking';
import { supabase } from '@/lib/supabase/client';

export interface ShareContent {
  type: 'sermon' | 'article';
  id: string;
  title: string;
  description?: string;
  author?: string;
  date?: string;
  url?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
}

export interface ShareOptions {
  method: 'native' | 'email' | 'sms' | 'whatsapp' | 'telegram' | 'twitter' | 'facebook' | 'copy';
  customMessage?: string;
  includeImage?: boolean;
  includeAudio?: boolean;
  recipientEmail?: string;
  recipientPhone?: string;
  campaign?: string;
}

export interface ShareResult {
  success: boolean;
  method: string;
  error?: string;
  action?: string;
}

export interface ShareAnalytics {
  contentId: string;
  contentType: string;
  shareMethod: string;
  timestamp: Date;
  userId?: string;
  success: boolean;
  error?: string;
}

class SharingService {
  /**
   * Share content using the specified method
   */
  async shareContent(
    content: ShareContent,
    options: ShareOptions
  ): Promise<ShareResult> {
    try {
      const shareMessage = this.buildShareMessage(content, options.customMessage);
      const shareUrl = this.generateShareableLink(content, options.campaign);

      let result: ShareResult;

      switch (options.method) {
        case 'native':
          result = await this.shareNative(shareMessage, shareUrl, content.title);
          break;
        case 'email':
          result = await this.shareEmail(content, shareMessage, shareUrl, options.recipientEmail);
          break;
        case 'sms':
          result = await this.shareSMS(shareMessage, shareUrl, options.recipientPhone);
          break;
        case 'whatsapp':
          result = await this.shareWhatsApp(shareMessage, shareUrl);
          break;
        case 'telegram':
          result = await this.shareTelegram(shareMessage, shareUrl);
          break;
        case 'twitter':
          result = await this.shareTwitter(shareMessage, shareUrl);
          break;
        case 'facebook':
          result = await this.shareFacebook(shareMessage, shareUrl);
          break;
        case 'copy':
          result = await this.shareCopy(shareMessage, shareUrl);
          break;
        default:
          throw new Error(`Unsupported share method: ${options.method}`);
      }

      // Log analytics
      await this.logShareAnalytics({
        contentId: content.id,
        contentType: content.type,
        shareMethod: options.method,
        timestamp: new Date(),
        success: result.success,
        error: result.error,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed analytics
      await this.logShareAnalytics({
        contentId: content.id,
        contentType: content.type,
        shareMethod: options.method,
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        method: options.method,
        error: errorMessage,
      };
    }
  }

  /**
   * Share using native share dialog
   */
  private async shareNative(
    message: string,
    url: string,
    title: string
  ): Promise<ShareResult> {
    try {
      const result = await Share.share({
        message: `${message}\n\n${url}`,
        title: `TRUEVINE FELLOWSHIP - ${title}`,
        url: url,
      });

      return {
        success: result.action !== Share.dismissedAction,
        method: 'native',
        action: result.action,
      };
    } catch (error) {
      return {
        success: false,
        method: 'native',
        error: error instanceof Error ? error.message : 'Native share failed',
      };
    }
  }

  /**
   * Share via email
   */
  private async shareEmail(
    content: ShareContent,
    message: string,
    url: string,
    recipientEmail?: string
  ): Promise<ShareResult> {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Email is not available on this device');
      }

      const emailSubject = `TRUEVINE FELLOWSHIP - ${content.title}`;
      const emailBody = `${message}\n\n${url}\n\n---\nShared from TRUEVINE FELLOWSHIP Church App`;

      const mailOptions: MailComposer.MailComposerOptions = {
        recipients: recipientEmail ? [recipientEmail] : [],
        subject: emailSubject,
        body: emailBody,
        isHtml: false,
      };

      await MailComposer.composeAsync(mailOptions);

      return {
        success: true,
        method: 'email',
      };
    } catch (error) {
      return {
        success: false,
        method: 'email',
        error: error instanceof Error ? error.message : 'Email share failed',
      };
    }
  }

  /**
   * Share via SMS
   */
  private async shareSMS(
    message: string,
    url: string,
    recipientPhone?: string
  ): Promise<ShareResult> {
    try {
      const smsUrl = recipientPhone
        ? `sms:${recipientPhone}?body=${encodeURIComponent(`${message}\n\n${url}`)}`
        : `sms:?body=${encodeURIComponent(`${message}\n\n${url}`)}`;

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        throw new Error('SMS is not available on this device');
      }

      await Linking.openURL(smsUrl);

      return {
        success: true,
        method: 'sms',
      };
    } catch (error) {
      return {
        success: false,
        method: 'sms',
        error: error instanceof Error ? error.message : 'SMS share failed',
      };
    }
  }

  /**
   * Share via WhatsApp
   */
  private async shareWhatsApp(message: string, url: string): Promise<ShareResult> {
    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(`${message}\n\n${url}`)}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (!canOpen) {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${url}`)}`;
        await Linking.openURL(webWhatsappUrl);
      } else {
        await Linking.openURL(whatsappUrl);
      }

      return {
        success: true,
        method: 'whatsapp',
      };
    } catch (error) {
      return {
        success: false,
        method: 'whatsapp',
        error: error instanceof Error ? error.message : 'WhatsApp share failed',
      };
    }
  }

  /**
   * Share via Telegram
   */
  private async shareTelegram(message: string, url: string): Promise<ShareResult> {
    try {
      const telegramUrl = `tg://msg?text=${encodeURIComponent(`${message}\n\n${url}`)}`;

      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (!canOpen) {
        // Fallback to web Telegram
        const webTelegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
        await Linking.openURL(webTelegramUrl);
      } else {
        await Linking.openURL(telegramUrl);
      }

      return {
        success: true,
        method: 'telegram',
      };
    } catch (error) {
      return {
        success: false,
        method: 'telegram',
        error: error instanceof Error ? error.message : 'Telegram share failed',
      };
    }
  }

  /**
   * Share via Twitter
   */
  private async shareTwitter(message: string, url: string): Promise<ShareResult> {
    try {
      // Twitter has character limits, so we need to be concise
      const twitterMessage = this.truncateForTwitter(message);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}&url=${encodeURIComponent(url)}`;

      await Linking.openURL(twitterUrl);

      return {
        success: true,
        method: 'twitter',
      };
    } catch (error) {
      return {
        success: false,
        method: 'twitter',
        error: error instanceof Error ? error.message : 'Twitter share failed',
      };
    }
  }

  /**
   * Share via Facebook
   */
  private async shareFacebook(message: string, url: string): Promise<ShareResult> {
    try {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;

      await Linking.openURL(facebookUrl);

      return {
        success: true,
        method: 'facebook',
      };
    } catch (error) {
      return {
        success: false,
        method: 'facebook',
        error: error instanceof Error ? error.message : 'Facebook share failed',
      };
    }
  }

  /**
   * Copy to clipboard
   */
  private async shareCopy(message: string, url: string): Promise<ShareResult> {
    try {
      const clipboardText = `${message}\n\n${url}`;
      await Clipboard.setStringAsync(clipboardText);

      return {
        success: true,
        method: 'copy',
      };
    } catch (error) {
      return {
        success: false,
        method: 'copy',
        error: error instanceof Error ? error.message : 'Copy to clipboard failed',
      };
    }
  }

  /**
   * Build share message based on content and custom message
   */
  private buildShareMessage(content: ShareContent, customMessage?: string): string {
    if (customMessage) {
      return customMessage;
    }

    const contentType = content.type === 'sermon' ? 'Sermon' : 'Article';
    let message = `Check out this ${contentType.toLowerCase()} from TRUEVINE FELLOWSHIP Church!\n\n"${content.title}"`;

    if (content.author) {
      message += `\nby ${content.author}`;
    }

    if (content.date) {
      message += `\n${content.date}`;
    }

    if (content.description) {
      message += `\n\n${content.description}`;
    }

    if (content.duration && content.type === 'sermon') {
      const minutes = Math.floor(content.duration / 60);
      const seconds = content.duration % 60;
      message += `\n\nDuration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return message;
  }

  /**
   * Generate shareable deep link with tracking
   */
  private generateShareableLink(content: ShareContent, campaign?: string): string {
    return createShareableDeepLink(
      content.type,
      content.id,
      campaign || 'content_share',
      'app_share'
    );
  }

  /**
   * Truncate message for Twitter (280 character limit)
   */
  private truncateForTwitter(message: string): string {
    const maxLength = 200; // Leave room for URL
    if (message.length <= maxLength) {
      return message;
    }

    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get available sharing methods for the current platform
   */
  async getAvailableSharingMethods(): Promise<string[]> {
    const methods = ['native', 'copy'];

    try {
      // Check email availability
      const emailAvailable = await MailComposer.isAvailableAsync();
      if (emailAvailable) {
        methods.push('email');
      }
    } catch (error) {
      console.log('Email not available:', error);
    }

    // SMS is generally available on mobile platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      methods.push('sms');
    }

    // Social media apps
    methods.push('whatsapp', 'telegram', 'twitter', 'facebook');

    return methods;
  }

  /**
   * Log share analytics to database
   */
  private async logShareAnalytics(analytics: ShareAnalytics): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_analytics')
        .insert({
          content_id: analytics.contentId,
          content_type: analytics.contentType,
          share_method: analytics.shareMethod,
          timestamp: analytics.timestamp.toISOString(),
          user_id: analytics.userId,
          success: analytics.success,
          error: analytics.error,
        });

      if (error) {
        console.error('Error logging share analytics:', error);
      }
    } catch (error) {
      console.error('Error logging share analytics:', error);
    }
  }

  /**
   * Get share analytics for content
   */
  async getShareAnalytics(contentId: string): Promise<{
    totalShares: number;
    sharesByMethod: Record<string, number>;
    recentShares: ShareAnalytics[];
  }> {
    try {
      const { data, error } = await supabase
        .from('share_analytics')
        .select('*')
        .eq('content_id', contentId)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch share analytics: ${error.message}`);
      }

      const totalShares = data?.length || 0;
      const sharesByMethod = data?.reduce((acc, share) => {
        acc[share.share_method] = (acc[share.share_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const recentShares = (data || []).slice(0, 10).map(share => ({
        contentId: share.content_id,
        contentType: share.content_type,
        shareMethod: share.share_method,
        timestamp: new Date(share.timestamp),
        userId: share.user_id,
        success: share.success,
        error: share.error,
      }));

      return {
        totalShares,
        sharesByMethod,
        recentShares,
      };
    } catch (error) {
      console.error('Error fetching share analytics:', error);
      return {
        totalShares: 0,
        sharesByMethod: {},
        recentShares: [],
      };
    }
  }
}

// Export singleton instance
export const sharingService = new SharingService();

// Types are exported inline above
