import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, ProgressBar, IconButton } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { sessionManager } from '@/lib/auth/sessionManager';
import { autoReauthService } from '@/lib/auth/autoReauth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SessionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  onRefresh?: () => void;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  showDetails = false,
  compact = false,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const { user, session } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<{
    timeUntilExpiry: number;
    isExpired: boolean;
    needsRefresh: boolean;
    lastActivity: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      updateSessionInfo();
      const interval = setInterval(updateSessionInfo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [session]);

  const updateSessionInfo = () => {
    if (!session) return;

    const now = Date.now();
    const timeUntilExpiry = Math.max(0, session.expiresAt - now);
    const isExpired = timeUntilExpiry === 0;
    const needsRefresh = timeUntilExpiry <= 5 * 60 * 1000; // 5 minutes

    setSessionInfo({
      timeUntilExpiry,
      isExpired,
      needsRefresh,
      lastActivity: Date.now(),
    });
  };

  const handleRefreshSession = async () => {
    if (!session) return;

    setIsRefreshing(true);
    try {
      const result = await autoReauthService.forceReauth();
      if (result.success) {
        onRefresh?.();
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualLogout = async () => {
    try {
      await sessionManager.clearSession();
      onRefresh?.();
    } catch (error) {
      console.error('Manual logout failed:', error);
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Expired';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const formatLastActivity = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (): string => {
    if (!sessionInfo) return theme.colors.primary;
    if (sessionInfo.isExpired) return theme.colors.error;
    if (sessionInfo.needsRefresh) return theme.colors.warning;
    return theme.colors.success;
  };

  const getStatusIcon = (): string => {
    if (!sessionInfo) return 'account-check';
    if (sessionInfo.isExpired) return 'account-off';
    if (sessionInfo.needsRefresh) return 'account-alert';
    return 'account-check';
  };

  if (!user || !session) return null;

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor(),
    },
    compactCard: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: getStatusColor(),
      padding: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: compact ? theme.spacing.xs : theme.spacing.sm,
    },
    statusIcon: {
      marginRight: theme.spacing.sm,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    statusText: {
      fontSize: compact ? 12 : 14,
      color: getStatusColor(),
      fontWeight: '600',
    },
    details: {
      marginTop: theme.spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    detailLabel: {
      fontSize: compact ? 11 : 12,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: compact ? 11 : 12,
      color: theme.colors.text,
      fontWeight: '500',
    },
    progressContainer: {
      marginTop: theme.spacing.sm,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      height: compact ? 32 : 40,
    },
    compactActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    compactButton: {
      minWidth: 60,
      height: 28,
    },
  });

  const getStatusText = (): string => {
    if (!sessionInfo) return 'Active';
    if (sessionInfo.isExpired) return 'Expired';
    if (sessionInfo.needsRefresh) return 'Needs Refresh';
    return 'Active';
  };

  const getProgressPercentage = (): number => {
    if (!session || !sessionInfo) return 100;
    
    const totalDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const remaining = sessionInfo.timeUntilExpiry;
    const elapsed = totalDuration - remaining;
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  if (compact) {
    return (
      <View style={styles.container}>
        <Card style={styles.compactCard}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name={getStatusIcon() as any}
              size={16}
              iconColor={getStatusColor()}
              style={styles.statusIcon}
            />
            <Text style={styles.title}>Session Status</Text>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          
          {showDetails && sessionInfo && (
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expires:</Text>
                <Text style={styles.detailValue}>
                  {formatTimeRemaining(sessionInfo.timeUntilExpiry)}
                </Text>
              </View>
              
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={getProgressPercentage() / 100}
                  color={getStatusColor()}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {Math.round(getProgressPercentage())}% of session used
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.compactActions}>
            <Button
              mode="outlined"
              onPress={handleRefreshSession}
              loading={isRefreshing}
              disabled={isRefreshing}
              style={styles.compactButton}
              labelStyle={{ fontSize: 10 }}
            >
              Refresh
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleManualLogout}
              style={styles.compactButton}
              labelStyle={{ fontSize: 10 }}
            >
              Logout
            </Button>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name={getStatusIcon() as any}
              size={20}
              iconColor={getStatusColor()}
              style={styles.statusIcon}
            />
            <Text style={styles.title}>Session Status</Text>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          
          {showDetails && sessionInfo && (
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Remaining:</Text>
                <Text style={styles.detailValue}>
                  {formatTimeRemaining(sessionInfo.timeUntilExpiry)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Activity:</Text>
                <Text style={styles.detailValue}>
                  {formatLastActivity(sessionInfo.lastActivity)}
                </Text>
              </View>
              
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={getProgressPercentage() / 100}
                  color={getStatusColor()}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {Math.round(getProgressPercentage())}% of session used
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleRefreshSession}
              loading={isRefreshing}
              disabled={isRefreshing}
              style={styles.actionButton}
            >
              Refresh Session
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleManualLogout}
              style={styles.actionButton}
            >
              Sign Out
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

// Compact session indicator for headers/toolbars
export const SessionIndicator: React.FC = () => {
  const { theme } = useTheme();
  const { session } = useAuth();
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (session) {
      const checkExpiry = () => {
        const now = Date.now();
        const timeUntilExpiry = Math.max(0, session.expiresAt - now);
        setIsExpiringSoon(timeUntilExpiry <= 5 * 60 * 1000); // 5 minutes
      };
      
      checkExpiry();
      const interval = setInterval(checkExpiry, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  if (!session) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1000,
    },
    indicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: isExpiringSoon ? theme.colors.warning : theme.colors.success,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
    </View>
  );
};
