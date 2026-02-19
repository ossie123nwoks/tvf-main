import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Dialog,
  Portal,
  Switch,
  TextInput,
  Divider,
  List,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAudioQuality } from '@/lib/audio/useAudioQuality';
import { AudioQuality, QualityPreferences } from '@/lib/audio/qualityManager';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface AudioQualitySelectorProps {
  visible: boolean;
  onDismiss: () => void;
  onQualitySelect?: (quality: AudioQuality) => void;
  contentUrl?: string;
  duration?: number;
}

export const AudioQualitySelector: React.FC<AudioQualitySelectorProps> = ({
  visible,
  onDismiss,
  onQualitySelect,
  contentUrl,
  duration,
}) => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    currentQuality,
    availableQualities,
    networkCondition,
    qualityPreferences,
    currentRecommendation,
    isLoading,
    refreshNetworkInfo,
    updateQualityPreferences,
    getRecommendedQuality,
    getQualityComparison,
    resetPreferences,
  } = useAudioQuality();

  const [preferencesDialogVisible, setPreferencesDialogVisible] = useState(false);
  const [comparisonDialogVisible, setComparisonDialogVisible] = useState(false);
  const [selectedQuality1, setSelectedQuality1] = useState<AudioQuality | null>(null);
  const [selectedQuality2, setSelectedQuality2] = useState<AudioQuality | null>(null);
  const [tempPreferences, setTempPreferences] = useState<QualityPreferences | null>(null);

  // Load recommendations when content changes
  useEffect(() => {
    if (visible && contentUrl && duration && qualityPreferences) {
      getRecommendedQuality(contentUrl, duration);
    }
  }, [visible, contentUrl, duration, qualityPreferences, getRecommendedQuality]);

  // Initialize temp preferences
  useEffect(() => {
    if (qualityPreferences) {
      setTempPreferences({ ...qualityPreferences });
    }
  }, [qualityPreferences]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get network icon
  const getNetworkIcon = (type: string): string => {
    switch (type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellphone';
      case 'ethernet':
        return 'ethernet';
      default:
        return 'wifi-off';
    }
  };

  // Get network color
  const getNetworkColor = (strength: string): string => {
    switch (strength) {
      case 'excellent':
        return theme.colors.success;
      case 'good':
        return theme.colors.primary;
      case 'fair':
        return theme.colors.warning;
      case 'poor':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Handle quality selection
  const handleQualitySelect = (quality: AudioQuality) => {
    if (onQualitySelect) {
      onQualitySelect(quality);
    }
    onDismiss();
  };

  // Handle preferences save
  const handlePreferencesSave = async () => {
    if (tempPreferences) {
      await updateQualityPreferences(tempPreferences);
      setPreferencesDialogVisible(false);
    }
  };

  // Handle quality comparison
  const handleQualityComparison = (quality1: AudioQuality, quality2: AudioQuality) => {
    setSelectedQuality1(quality1);
    setSelectedQuality2(quality2);
    setComparisonDialogVisible(true);
  };

  // Render network status
  const renderNetworkStatus = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.networkHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.text }}>
            Network Status
          </Text>
          <IconButton
            icon="refresh"
            size={20}
            onPress={refreshNetworkInfo}
            iconColor={theme.colors.primary}
          />
        </View>

        {networkCondition ? (
          <View style={styles.networkInfo}>
            <View style={styles.networkRow}>
              <MaterialIcons
                name={getNetworkIcon(networkCondition.type) as any}
                size={24}
                color={getNetworkColor(networkCondition.strength)}
              />
              <View style={styles.networkDetails}>
                <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                  {networkCondition.type.charAt(0).toUpperCase() + networkCondition.type.slice(1)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  {networkCondition.strength} • {networkCondition.speed}
                </Text>
              </View>
              <Chip
                mode="outlined"
                style={[
                  styles.networkChip,
                  { borderColor: getNetworkColor(networkCondition.strength) },
                ]}
              >
                {networkCondition.isMetered ? 'Metered' : 'Unlimited'}
              </Chip>
            </View>

            {networkCondition.type === 'cellular' && (
              <Text variant="bodySmall" style={{ color: theme.colors.warning, marginTop: 8 }}>
                ⚠️ Cellular data usage may incur charges
              </Text>
            )}
          </View>
        ) : (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        )}
      </Card.Content>
    </Card>
  );

  // Render quality recommendations
  const renderQualityRecommendations = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Recommended Quality
        </Text>

        {currentRecommendation ? (
          <View style={styles.recommendationContainer}>
            <View style={styles.recommendationHeader}>
              <Chip mode="outlined" icon="star" style={{ backgroundColor: theme.colors.primary }}>
                {currentRecommendation.recommendedQuality.name}
              </Chip>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
                {currentRecommendation.reason}
              </Text>
            </View>

            <View style={styles.recommendationDetails}>
              <View style={styles.recommendationDetail}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Bitrate:
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.text }}>
                  {currentRecommendation.recommendedQuality.bitrate} kbps
                </Text>
              </View>

              <View style={styles.recommendationDetail}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  File Size:
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.text }}>
                  {formatFileSize(currentRecommendation.recommendedQuality.fileSize)}
                </Text>
              </View>

              <View style={styles.recommendationDetail}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Download Time:
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.text }}>
                  ~{currentRecommendation.estimatedDownloadTime}s
                </Text>
              </View>

              <View style={styles.recommendationDetail}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Data Usage:
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.text }}>
                  {currentRecommendation.dataUsage.toFixed(2)} MB
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            No recommendation available
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  // Render quality options
  const renderQualityOptions = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Available Qualities
        </Text>

        {availableQualities.map(quality => {
          const isCurrent = currentQuality?.id === quality.id;
          const isRecommended = currentRecommendation?.recommendedQuality.id === quality.id;

          return (
            <View key={quality.id} style={styles.qualityOption}>
              <View style={styles.qualityInfo}>
                <View style={styles.qualityHeader}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                    {quality.name}
                  </Text>
                  {isCurrent && (
                    <Chip mode="outlined" style={styles.currentChip}>
                      Current
                    </Chip>
                  )}
                  {isRecommended && (
                    <Chip mode="outlined" style={styles.recommendedChip}>
                      Recommended
                    </Chip>
                  )}
                </View>

                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  {quality.bitrate} kbps • {quality.sampleRate} Hz • {quality.channels} channel
                  {quality.channels > 1 ? 's' : ''}
                </Text>

                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  {formatFileSize(quality.fileSize)} • {quality.description}
                </Text>
              </View>

              <View style={styles.qualityActions}>
                <Button
                  mode="outlined"
                  onPress={() => handleQualitySelect(quality)}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current' : 'Select'}
                </Button>

                {!isCurrent && (
                  <IconButton
                    icon="compare"
                    size={20}
                    onPress={() => handleQualityComparison(currentQuality!, quality)}
                    iconColor={theme.colors.primary}
                  />
                )}
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );

  // Render preferences dialog
  const renderPreferencesDialog = () => (
    <Portal>
      <Dialog
        visible={preferencesDialogVisible}
        onDismiss={() => setPreferencesDialogVisible(false)}
      >
        <Dialog.Title>Audio Quality Preferences</Dialog.Title>
        <Dialog.Content>
          {tempPreferences && (
            <ScrollView style={styles.preferencesScroll}>
              <View style={styles.preferenceOption}>
                <Text>Auto Quality Selection</Text>
                <Switch
                  value={tempPreferences.autoQuality}
                  onValueChange={value =>
                    setTempPreferences(prev => (prev ? { ...prev, autoQuality: value } : null))
                  }
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>Preferred Quality</Text>
                <TextInput
                  value={tempPreferences.preferredQuality}
                  onChangeText={text =>
                    setTempPreferences(prev => (prev ? { ...prev, preferredQuality: text } : null))
                  }
                  style={styles.preferenceInput}
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>Max Bitrate (kbps)</Text>
                <TextInput
                  value={tempPreferences.maxBitrate.toString()}
                  onChangeText={text =>
                    setTempPreferences(prev =>
                      prev ? { ...prev, maxBitrate: parseInt(text) || 320 } : null
                    )
                  }
                  keyboardType="numeric"
                  style={styles.preferenceInput}
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>Allow Cellular</Text>
                <Switch
                  value={tempPreferences.allowCellular}
                  onValueChange={value =>
                    setTempPreferences(prev => (prev ? { ...prev, allowCellular: value } : null))
                  }
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>Data Saver Mode</Text>
                <Switch
                  value={tempPreferences.dataSaver}
                  onValueChange={value =>
                    setTempPreferences(prev => (prev ? { ...prev, dataSaver: value } : null))
                  }
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>High Quality WiFi</Text>
                <Switch
                  value={tempPreferences.highQualityWifi}
                  onValueChange={value =>
                    setTempPreferences(prev => (prev ? { ...prev, highQualityWifi: value } : null))
                  }
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>Medium Quality Cellular</Text>
                <Switch
                  value={tempPreferences.mediumQualityCellular}
                  onValueChange={value =>
                    setTempPreferences(prev =>
                      prev ? { ...prev, mediumQualityCellular: value } : null
                    )
                  }
                />
              </View>

              <View style={styles.preferenceOption}>
                <Text>Low Quality Slow Networks</Text>
                <Switch
                  value={tempPreferences.lowQualitySlow}
                  onValueChange={value =>
                    setTempPreferences(prev => (prev ? { ...prev, lowQualitySlow: value } : null))
                  }
                />
              </View>
            </ScrollView>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setPreferencesDialogVisible(false)}>Cancel</Button>
          <Button onPress={handlePreferencesSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  // Render comparison dialog
  const renderComparisonDialog = () => (
    <Portal>
      <Dialog visible={comparisonDialogVisible} onDismiss={() => setComparisonDialogVisible(false)}>
        <Dialog.Title>Quality Comparison</Dialog.Title>
        <Dialog.Content>
          {selectedQuality1 && selectedQuality2 && (
            <View style={styles.comparisonContainer}>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonQuality}>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                    {selectedQuality1.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                    {selectedQuality1.bitrate} kbps
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                    {formatFileSize(selectedQuality1.fileSize)}
                  </Text>
                </View>

                <View style={styles.comparisonVs}>
                  <Text variant="titleLarge" style={{ color: theme.colors.textSecondary }}>
                    VS
                  </Text>
                </View>

                <View style={styles.comparisonQuality}>
                  <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>
                    {selectedQuality2.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                    {selectedQuality2.bitrate} kbps
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                    {formatFileSize(selectedQuality2.fileSize)}
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              {(() => {
                const comparison = getQualityComparison(selectedQuality1, selectedQuality2);
                return (
                  <View style={styles.comparisonDetails}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.text, marginBottom: 8 }}
                    >
                      {comparison.qualityDifference}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                      {comparison.recommendation}
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setComparisonDialogVisible(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={{ color: theme.colors.text }}>Audio Quality Selection</Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 16 }}>
                Loading quality options...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {renderNetworkStatus()}
              {renderQualityRecommendations()}
              {renderQualityOptions()}

              <View style={styles.actionsContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setPreferencesDialogVisible(true)}
                  icon="cog"
                  style={styles.actionButton}
                >
                  Preferences
                </Button>
                <Button
                  mode="outlined"
                  onPress={resetPreferences}
                  icon="restore"
                  style={styles.actionButton}
                >
                  Reset
                </Button>
              </View>
            </ScrollView>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      {renderPreferencesDialog()}
      {renderComparisonDialog()}
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: screenWidth * 0.95,
    maxHeight: '90%',
  },
  dialogContent: {
    paddingHorizontal: 0,
  },
  scrollView: {
    maxHeight: 600,
  },
  card: {
    marginBottom: 16,
  },
  networkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkInfo: {
    gap: 8,
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkDetails: {
    flex: 1,
  },
  networkChip: {
    borderWidth: 1,
  },
  recommendationContainer: {
    gap: 16,
  },
  recommendationHeader: {
    alignItems: 'center',
  },
  recommendationDetails: {
    gap: 8,
  },
  recommendationDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  qualityInfo: {
    flex: 1,
    marginRight: 16,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  currentChip: {
    marginLeft: 8,
  },
  recommendedChip: {
    marginLeft: 8,
  },
  qualityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  preferencesScroll: {
    maxHeight: 400,
  },
  preferenceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceInput: {
    width: 120,
    height: 40,
  },
  comparisonContainer: {
    gap: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonQuality: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonVs: {
    paddingHorizontal: 16,
  },
  comparisonDetails: {
    alignItems: 'center',
  },
});
