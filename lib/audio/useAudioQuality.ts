import { useState, useEffect, useCallback } from 'react';
import {
  audioQualityManager,
  AudioQuality,
  NetworkCondition,
  QualityPreferences,
  QualityRecommendation,
} from './qualityManager';

export interface UseAudioQualityReturn {
  currentQuality: AudioQuality | null;
  availableQualities: AudioQuality[];
  networkCondition: NetworkCondition | null;
  qualityPreferences: QualityPreferences | null;
  currentRecommendation: QualityRecommendation | null;
  isLoading: boolean;
  refreshNetworkInfo: () => Promise<void>;
  updateQualityPreferences: (preferences: Partial<QualityPreferences>) => Promise<void>;
  getRecommendedQuality: (contentUrl: string, duration: number) => Promise<QualityRecommendation>;
  shouldChangeQuality: (
    currentQuality: AudioQuality,
    contentUrl: string,
    duration: number
  ) => Promise<{
    shouldChange: boolean;
    newQuality?: AudioQuality;
    reason?: string;
  }>;
  getQualityComparison: (
    quality1: AudioQuality,
    quality2: AudioQuality
  ) => {
    bitrateDifference: number;
    fileSizeDifference: number;
    qualityDifference: string;
    recommendation: string;
  };
  resetPreferences: () => Promise<void>;
}

export const useAudioQuality = (): UseAudioQualityReturn => {
  const [currentQuality, setCurrentQuality] = useState<AudioQuality | null>(null);
  const [availableQualities, setAvailableQualities] = useState<AudioQuality[]>([]);
  const [networkCondition, setNetworkCondition] = useState<NetworkCondition | null>(null);
  const [qualityPreferences, setQualityPreferences] = useState<QualityPreferences | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<QualityRecommendation | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [preferences, qualities] = await Promise.all([
        audioQualityManager.getQualityPreferences(),
        audioQualityManager.getAllQualityLevels(),
      ]);

      setQualityPreferences(preferences);
      setAvailableQualities(qualities);

      // Set default current quality
      if (qualities.length > 0) {
        setCurrentQuality(qualities[2]); // Default to medium quality
      }
    } catch (error) {
      console.error('Failed to load initial audio quality data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh network information
  const refreshNetworkInfo = useCallback(async () => {
    try {
      const condition = await audioQualityManager.getNetworkConditions();
      setNetworkCondition(condition);
    } catch (error) {
      console.error('Failed to refresh network info:', error);
    }
  }, []);

  // Update quality preferences
  const updateQualityPreferences = useCallback(async (preferences: Partial<QualityPreferences>) => {
    try {
      await audioQualityManager.updateQualityPreferences(preferences);

      // Reload preferences
      const updated = await audioQualityManager.getQualityPreferences();
      setQualityPreferences(updated);
    } catch (error) {
      console.error('Failed to update quality preferences:', error);
    }
  }, []);

  // Get recommended quality for content
  const getRecommendedQuality = useCallback(async (contentUrl: string, duration: number) => {
    try {
      const recommendation = await audioQualityManager.getRecommendedQuality(contentUrl, duration);
      setCurrentRecommendation(recommendation);
      return recommendation;
    } catch (error) {
      console.error('Failed to get recommended quality:', error);
      throw error;
    }
  }, []);

  // Check if quality should change
  const shouldChangeQuality = useCallback(
    async (currentQuality: AudioQuality, contentUrl: string, duration: number) => {
      try {
        return await audioQualityManager.shouldChangeQuality(currentQuality, contentUrl, duration);
      } catch (error) {
        console.error('Failed to check if quality should change:', error);
        throw error;
      }
    },
    []
  );

  // Get quality comparison
  const getQualityComparison = useCallback((quality1: AudioQuality, quality2: AudioQuality) => {
    return audioQualityManager.getQualityComparison(quality1, quality2);
  }, []);

  // Reset preferences
  const resetPreferences = useCallback(async () => {
    try {
      await audioQualityManager.resetPreferences();

      // Reload preferences
      const preferences = await audioQualityManager.getQualityPreferences();
      setQualityPreferences(preferences);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Set up network monitoring
  useEffect(() => {
    let isMounted = true;

    const monitorNetwork = async () => {
      try {
        const condition = await audioQualityManager.getNetworkConditions();
        if (isMounted) {
          setNetworkCondition(condition);
        }
      } catch (error) {
        console.error('Failed to monitor network:', error);
      }
    };

    // Initial network check
    monitorNetwork();

    // Set up periodic network monitoring (every 30 seconds)
    const interval = setInterval(monitorNetwork, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Monitor network changes and update recommendations
  useEffect(() => {
    if (networkCondition && currentQuality && currentRecommendation) {
      // Check if quality should change based on network changes
      shouldChangeQuality(currentQuality, currentRecommendation.recommendedQuality.url, 0)
        .then(({ shouldChange, newQuality, reason }) => {
          if (shouldChange && newQuality) {
            console.log(`Quality change recommended: ${reason}`);
            // You could show a notification to the user here
          }
        })
        .catch(error => {
          console.error('Failed to check quality change:', error);
        });
    }
  }, [networkCondition, currentQuality, currentRecommendation, shouldChangeQuality]);

  return {
    currentQuality,
    availableQualities,
    networkCondition,
    qualityPreferences,
    currentRecommendation,
    isLoading,
    refreshNetworkInfo,
    updateQualityPreferences,
    getRecommendedQuality,
    shouldChangeQuality,
    getQualityComparison,
    resetPreferences,
  };
};

