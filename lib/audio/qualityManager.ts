import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AudioQuality {
  id: string;
  name: string;
  bitrate: number; // kbps
  sampleRate: number; // Hz
  channels: number;
  fileSize: number; // bytes
  url: string;
  format: 'mp3' | 'aac' | 'ogg' | 'wav';
  description: string;
}

export interface NetworkCondition {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  strength: 'excellent' | 'good' | 'fair' | 'poor';
  speed: 'fast' | 'medium' | 'slow';
  isConnected: boolean;
  isMetered: boolean;
}

export interface QualityPreferences {
  autoQuality: boolean;
  preferredQuality: string;
  maxBitrate: number;
  allowCellular: boolean;
  dataSaver: boolean;
  highQualityWifi: boolean;
  mediumQualityCellular: boolean;
  lowQualitySlow: boolean;
}

export interface QualityRecommendation {
  recommendedQuality: AudioQuality;
  reason: string;
  networkCondition: NetworkCondition;
  userPreference: string;
  estimatedDownloadTime: number; // seconds
  dataUsage: number; // MB
}

export class AudioQualityManager {
  private static instance: AudioQualityManager;
  private storageKey = '@audio_quality_preferences';
  private defaultPreferences: QualityPreferences = {
    autoQuality: true,
    preferredQuality: 'high',
    maxBitrate: 320,
    allowCellular: true,
    dataSaver: false,
    highQualityWifi: true,
    mediumQualityCellular: true,
    lowQualitySlow: true,
  };

  private qualityLevels: AudioQuality[] = [
    {
      id: 'ultra',
      name: 'Ultra High Quality',
      bitrate: 320,
      sampleRate: 48000,
      channels: 2,
      fileSize: 0, // Will be calculated per content
      url: '', // Will be set per content
      format: 'mp3',
      description: 'Best audio quality, highest data usage',
    },
    {
      id: 'high',
      name: 'High Quality',
      bitrate: 192,
      sampleRate: 44100,
      channels: 2,
      fileSize: 0,
      url: '',
      format: 'mp3',
      description: 'Excellent audio quality, moderate data usage',
    },
    {
      id: 'medium',
      name: 'Medium Quality',
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      fileSize: 0,
      url: '',
      format: 'mp3',
      description: 'Good audio quality, lower data usage',
    },
    {
      id: 'low',
      name: 'Low Quality',
      bitrate: 64,
      sampleRate: 22050,
      channels: 2,
      fileSize: 0,
      url: '',
      format: 'mp3',
      description: 'Basic audio quality, minimal data usage',
    },
    {
      id: 'data-saver',
      name: 'Data Saver',
      bitrate: 32,
      sampleRate: 22050,
      channels: 1,
      fileSize: 0,
      url: '',
      format: 'mp3',
      description: 'Minimal quality, extremely low data usage',
    },
  ];

  private constructor() {}

  static getInstance(): AudioQualityManager {
    if (!AudioQualityManager.instance) {
      AudioQualityManager.instance = new AudioQualityManager();
    }
    return AudioQualityManager.instance;
  }

  /**
   * Get current network conditions
   */
  async getNetworkConditions(): Promise<NetworkCondition> {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        return {
          type: 'unknown',
          strength: 'poor',
          speed: 'slow',
          isConnected: false,
          isMetered: false,
        };
      }

      let type: NetworkCondition['type'] = 'unknown';
      let strength: NetworkCondition['strength'] = 'fair';
      let speed: NetworkCondition['speed'] = 'medium';
      let isMetered = false;

      if (netInfo.type === 'wifi') {
        type = 'wifi';
        // Estimate WiFi strength based on signal strength if available
        if (netInfo.details && 'strength' in netInfo.details) {
          const signalStrength = (netInfo.details as any).strength;
          if (signalStrength > 80) strength = 'excellent';
          else if (signalStrength > 60) strength = 'good';
          else if (signalStrength > 40) strength = 'fair';
          else strength = 'poor';
        }

        // Estimate speed based on WiFi generation
        if (netInfo.details && 'frequency' in netInfo.details) {
          const frequency = (netInfo.details as any).frequency;
          if (frequency > 5000)
            speed = 'fast'; // 5GHz WiFi
          else speed = 'medium'; // 2.4GHz WiFi
        }

        isMetered = false;
      } else if (netInfo.type === 'cellular') {
        type = 'cellular';
        isMetered = true;

        // Estimate cellular strength and speed
        if (netInfo.details && 'cellularGeneration' in netInfo.details) {
          const generation = (netInfo.details as any).cellularGeneration;
          if (generation === '5g') {
            strength = 'excellent';
            speed = 'fast';
          } else if (generation === '4g') {
            strength = 'good';
            speed = 'medium';
          } else if (generation === '3g') {
            strength = 'fair';
            speed = 'slow';
          } else {
            strength = 'poor';
            speed = 'slow';
          }
        }
      } else if (netInfo.type === 'ethernet') {
        type = 'ethernet';
        strength = 'excellent';
        speed = 'fast';
        isMetered = false;
      }

      return {
        type,
        strength,
        speed,
        isConnected: true,
        isMetered,
      };
    } catch (error) {
      console.error('Failed to get network conditions:', error);
      return {
        type: 'unknown',
        strength: 'fair',
        speed: 'medium',
        isConnected: true,
        isMetered: false,
      };
    }
  }

  /**
   * Get user quality preferences
   */
  async getQualityPreferences(): Promise<QualityPreferences> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        const stored = JSON.parse(data);
        return { ...this.defaultPreferences, ...stored };
      }
      return { ...this.defaultPreferences };
    } catch (error) {
      console.error('Failed to get quality preferences:', error);
      return { ...this.defaultPreferences };
    }
  }

  /**
   * Update user quality preferences
   */
  async updateQualityPreferences(preferences: Partial<QualityPreferences>): Promise<void> {
    try {
      const current = await this.getQualityPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update quality preferences:', error);
    }
  }

  /**
   * Get available quality levels for content
   */
  getAvailableQualities(contentUrl: string, duration: number): AudioQuality[] {
    // Calculate file sizes based on duration and bitrate
    // Formula: (bitrate * duration * 1000) / 8 bytes
    return this.qualityLevels.map(quality => ({
      ...quality,
      fileSize: Math.round((quality.bitrate * duration * 1000) / 8),
      url: this.generateQualityUrl(contentUrl, quality.id),
    }));
  }

  /**
   * Get recommended audio quality based on network conditions and preferences
   */
  async getRecommendedQuality(
    contentUrl: string,
    duration: number,
    userPreferences?: Partial<QualityPreferences>
  ): Promise<QualityRecommendation> {
    try {
      const [networkCondition, preferences] = await Promise.all([
        this.getNetworkConditions(),
        this.getQualityPreferences(),
      ]);

      // Merge user preferences
      const finalPreferences = { ...preferences, ...userPreferences };

      // Get available qualities
      const availableQualities = this.getAvailableQualities(contentUrl, duration);

      // Determine recommended quality based on conditions
      let recommendedQuality: AudioQuality;
      let reason: string;

      if (!finalPreferences.autoQuality) {
        // Manual quality selection
        const preferred = availableQualities.find(q => q.id === finalPreferences.preferredQuality);
        recommendedQuality = preferred || availableQualities[2]; // Default to medium
        reason = 'User preference';
      } else {
        // Automatic quality selection based on network conditions
        if (networkCondition.type === 'wifi' && networkCondition.strength === 'excellent') {
          if (finalPreferences.highQualityWifi) {
            recommendedQuality = availableQualities[1]; // High quality
            reason = 'Excellent WiFi connection';
          } else {
            recommendedQuality = availableQualities[2]; // Medium quality
            reason = 'Good WiFi connection';
          }
        } else if (networkCondition.type === 'wifi') {
          recommendedQuality = availableQualities[2]; // Medium quality
          reason = 'Standard WiFi connection';
        } else if (networkCondition.type === 'cellular') {
          if (!finalPreferences.allowCellular) {
            recommendedQuality = availableQualities[4]; // Data saver
            reason = 'Cellular not allowed, using data saver';
          } else if (
            networkCondition.strength === 'excellent' &&
            finalPreferences.mediumQualityCellular
          ) {
            recommendedQuality = availableQualities[2]; // Medium quality
            reason = 'Excellent cellular connection';
          } else {
            recommendedQuality = availableQualities[3]; // Low quality
            reason = 'Standard cellular connection';
          }
        } else if (networkCondition.speed === 'slow') {
          if (finalPreferences.lowQualitySlow) {
            recommendedQuality = availableQualities[3]; // Low quality
            reason = 'Slow network connection';
          } else {
            recommendedQuality = availableQualities[4]; // Data saver
            reason = 'Very slow network, using data saver';
          }
        } else {
          recommendedQuality = availableQualities[2]; // Medium quality
          reason = 'Standard network conditions';
        }

        // Apply data saver override
        if (finalPreferences.dataSaver) {
          recommendedQuality = availableQualities[4]; // Data saver
          reason = 'Data saver mode enabled';
        }

        // Apply max bitrate limit
        if (recommendedQuality.bitrate > finalPreferences.maxBitrate) {
          const limitedQuality = availableQualities.find(
            q => q.bitrate <= finalPreferences.maxBitrate
          );
          if (limitedQuality) {
            recommendedQuality = limitedQuality;
            reason = `Limited by max bitrate (${finalPreferences.maxBitrate} kbps)`;
          }
        }
      }

      // Calculate download time and data usage
      const estimatedDownloadTime = this.estimateDownloadTime(
        recommendedQuality.fileSize,
        networkCondition
      );
      const dataUsage = recommendedQuality.fileSize / (1024 * 1024); // Convert to MB

      return {
        recommendedQuality,
        reason,
        networkCondition,
        userPreference: finalPreferences.autoQuality ? 'Auto' : finalPreferences.preferredQuality,
        estimatedDownloadTime,
        dataUsage,
      };
    } catch (error) {
      console.error('Failed to get recommended quality:', error);
      // Return fallback quality
      const fallbackQuality = this.getAvailableQualities(contentUrl, duration)[2]; // Medium
      return {
        recommendedQuality: fallbackQuality,
        reason: 'Fallback due to error',
        networkCondition: {
          type: 'unknown',
          strength: 'fair',
          speed: 'medium',
          isConnected: true,
          isMetered: false,
        },
        userPreference: 'Auto',
        estimatedDownloadTime: 0,
        dataUsage: 0,
      };
    }
  }

  /**
   * Estimate download time based on file size and network conditions
   */
  private estimateDownloadTime(fileSize: number, networkCondition: NetworkCondition): number {
    let downloadSpeed: number; // bytes per second

    switch (networkCondition.type) {
      case 'wifi':
        if (networkCondition.strength === 'excellent') {
          downloadSpeed = 10 * 1024 * 1024; // 10 MB/s
        } else if (networkCondition.strength === 'good') {
          downloadSpeed = 5 * 1024 * 1024; // 5 MB/s
        } else if (networkCondition.strength === 'fair') {
          downloadSpeed = 2 * 1024 * 1024; // 2 MB/s
        } else {
          downloadSpeed = 1 * 1024 * 1024; // 1 MB/s
        }
        break;
      case 'cellular':
        if (networkCondition.strength === 'excellent') {
          downloadSpeed = 2 * 1024 * 1024; // 2 MB/s
        } else if (networkCondition.strength === 'good') {
          downloadSpeed = 1 * 1024 * 1024; // 1 MB/s
        } else if (networkCondition.strength === 'fair') {
          downloadSpeed = 512 * 1024; // 512 KB/s
        } else {
          downloadSpeed = 256 * 1024; // 256 KB/s
        }
        break;
      case 'ethernet':
        downloadSpeed = 50 * 1024 * 1024; // 50 MB/s
        break;
      default:
        downloadSpeed = 1 * 1024 * 1024; // 1 MB/s
    }

    // Apply speed modifier
    if (networkCondition.speed === 'slow') {
      downloadSpeed *= 0.5;
    } else if (networkCondition.speed === 'fast') {
      downloadSpeed *= 1.5;
    }

    return Math.ceil(fileSize / downloadSpeed);
  }

  /**
   * Generate quality-specific URL for content
   */
  private generateQualityUrl(baseUrl: string, qualityId: string): string {
    // This is a placeholder implementation
    // In a real app, you would have different URLs for different quality levels
    // or use query parameters to specify quality

    if (qualityId === 'ultra') {
      return `${baseUrl}?quality=ultra&bitrate=320`;
    } else if (qualityId === 'high') {
      return `${baseUrl}?quality=high&bitrate=192`;
    } else if (qualityId === 'medium') {
      return `${baseUrl}?quality=medium&bitrate=128`;
    } else if (qualityId === 'low') {
      return `${baseUrl}?quality=low&bitrate=64`;
    } else if (qualityId === 'data-saver') {
      return `${baseUrl}?quality=data-saver&bitrate=32`;
    }

    return baseUrl;
  }

  /**
   * Get quality level by ID
   */
  getQualityById(qualityId: string): AudioQuality | undefined {
    return this.qualityLevels.find(q => q.id === qualityId);
  }

  /**
   * Get all available quality levels
   */
  getAllQualityLevels(): AudioQuality[] {
    return [...this.qualityLevels];
  }

  /**
   * Check if quality change is recommended based on network changes
   */
  async shouldChangeQuality(
    currentQuality: AudioQuality,
    contentUrl: string,
    duration: number
  ): Promise<{
    shouldChange: boolean;
    newQuality?: AudioQuality;
    reason?: string;
  }> {
    try {
      const recommendation = await this.getRecommendedQuality(contentUrl, duration);

      if (recommendation.recommendedQuality.id !== currentQuality.id) {
        return {
          shouldChange: true,
          newQuality: recommendation.recommendedQuality,
          reason: recommendation.reason,
        };
      }

      return { shouldChange: false };
    } catch (error) {
      console.error('Failed to check if quality should change:', error);
      return { shouldChange: false };
    }
  }

  /**
   * Get quality comparison for user decision
   */
  getQualityComparison(
    quality1: AudioQuality,
    quality2: AudioQuality
  ): {
    bitrateDifference: number;
    fileSizeDifference: number;
    qualityDifference: string;
    recommendation: string;
  } {
    const bitrateDifference = quality1.bitrate - quality2.bitrate;
    const fileSizeDifference = quality1.fileSize - quality2.fileSize;

    let qualityDifference: string;
    let recommendation: string;

    if (quality1.bitrate > quality2.bitrate) {
      qualityDifference = `${quality1.name} is ${Math.round(quality1.bitrate / quality2.bitrate)}x higher quality`;
      recommendation = `Higher quality but ${Math.round((fileSizeDifference / (1024 * 1024)) * 100) / 100} MB more data`;
    } else {
      qualityDifference = `${quality2.name} is ${Math.round(quality2.bitrate / quality1.bitrate)}x higher quality`;
      recommendation = `Lower quality but ${Math.round((Math.abs(fileSizeDifference) / (1024 * 1024)) * 100) / 100} MB less data`;
    }

    return {
      bitrateDifference,
      fileSizeDifference,
      qualityDifference,
      recommendation,
    };
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for this service
  }
}

// Export singleton instance
export const audioQualityManager = AudioQualityManager.getInstance();

