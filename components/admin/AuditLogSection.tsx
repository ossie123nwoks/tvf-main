import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  List,
  Avatar,
  ActivityIndicator,
  Divider,
  Searchbar,
  Menu,
  Portal,
  Modal,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';

interface AuditLog {
  id: string;
  action_type: string;
  description: string;
  target_user_id?: string;
  target_user_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
  admin_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  target_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ActivitySummary {
  auditLogs: Record<string, number>;
  userActivity: Record<string, number>;
  totalAuditActions: number;
  totalUserActivities: number;
  period: string;
}

interface AuditLogSectionProps {
  onLogSelect?: (log: AuditLog) => void;
}

const AuditLogSection: React.FC<AuditLogSectionProps> = ({
  onLogSelect,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [showFilters, setShowFilters] = useState(false);
  
  // Activity summary
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logDetailsModal, setLogDetailsModal] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    searchBar: {
      flex: 1,
    },
    filterButton: {
      marginLeft: theme.spacing.sm,
    },
    filtersContainer: {
      marginBottom: theme.spacing.md,
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    summaryCard: {
      width: '48%',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    summaryNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    logCard: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    logHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    logDetails: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    logDescription: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    logMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    actionChip: {
      height: 24,
    },
    logTimestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    logUser: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    errorContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    loadMoreButton: {
      marginTop: theme.spacing.md,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      maxWidth: 500,
      width: '100%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
    },
    modalSection: {
      marginBottom: theme.spacing.md,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    modalText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    metadataContainer: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.sm,
    },
  });

  // Load audit logs
  const loadAuditLogs = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      }

      const filters: any = {};
      if (selectedActionType !== 'all') {
        filters.actionType = selectedActionType;
      }
      if (selectedTimeRange !== 'all') {
        const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        filters.dateFrom = dateFrom.toISOString();
      }

      const result = await AdminService.getAuditLogs(pageNum, 20, filters);

      if (reset) {
        setLogs(result.logs);
      } else {
        setLogs(prev => [...prev, ...result.logs]);
      }

      setPage(result.page);
      setTotalPages(result.totalPages);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load activity summary
  const loadActivitySummary = async () => {
    try {
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const summary = await AdminService.getActivitySummary(days);
      setActivitySummary(summary);
    } catch (err) {
      console.error('Error loading activity summary:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadAuditLogs(1, true);
    loadActivitySummary();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadAuditLogs(1, true);
    loadActivitySummary();
  }, [selectedActionType, selectedTimeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAuditLogs(1, true);
    loadActivitySummary();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadAuditLogs(page + 1, false);
    }
  };

  const handleLogPress = (log: AuditLog) => {
    if (onLogSelect) {
      onLogSelect(log);
    } else {
      setSelectedLog(log);
      setLogDetailsModal(true);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_role_changed': return 'account-switch';
      case 'content_created': return 'plus';
      case 'content_updated': return 'pencil';
      case 'content_deleted': return 'delete';
      case 'user_created': return 'account-plus';
      case 'user_updated': return 'account-edit';
      case 'notification_sent': return 'bell';
      default: return 'information';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'user_role_changed': return theme.colors.warning;
      case 'content_created': return theme.colors.success;
      case 'content_updated': return theme.colors.info;
      case 'content_deleted': return theme.colors.error;
      case 'user_created': return theme.colors.success;
      case 'user_updated': return theme.colors.info;
      case 'notification_sent': return theme.colors.primary;
      default: return theme.colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderLogCard = (log: AuditLog) => (
    <Card
      key={log.id}
      style={styles.logCard}
      onPress={() => handleLogPress(log)}
    >
      <Card.Content>
        <View style={styles.logHeader}>
          <View style={styles.logInfo}>
            <Avatar.Icon
              size={40}
              icon={getActionIcon(log.action_type)}
              style={{ backgroundColor: getActionColor(log.action_type) + '20' }}
            />
            <View style={styles.logDetails}>
              <Text style={styles.logDescription}>{log.description}</Text>
              <View style={styles.logMeta}>
                <Chip
                  mode="outlined"
                  style={[styles.actionChip, { borderColor: getActionColor(log.action_type) }]}
                  textStyle={{ color: getActionColor(log.action_type), fontSize: 10 }}
                >
                  {log.action_type.replace('_', ' ').toUpperCase()}
                </Chip>
                <Text style={styles.logTimestamp}>
                  {formatTimestamp(log.created_at)}
                </Text>
              </View>
              {log.admin_user && (
                <Text style={styles.logUser}>
                  by {log.admin_user.first_name} {log.admin_user.last_name}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    const actionTypes = [
      'all', 'user_role_changed', 'content_created', 'content_updated', 
      'content_deleted', 'user_created', 'user_updated', 'notification_sent'
    ];

    return (
      <View style={styles.filtersContainer}>
        <Text style={{ marginBottom: theme.spacing.sm, fontWeight: '600' }}>
          Filters
        </Text>
        <View style={styles.filterChips}>
          <Text style={{ marginRight: theme.spacing.sm, alignSelf: 'center' }}>Action Type:</Text>
          {actionTypes.map((actionType) => (
            <Chip
              key={actionType}
              selected={selectedActionType === actionType}
              onPress={() => setSelectedActionType(actionType)}
              mode="outlined"
            >
              {actionType === 'all' ? 'All Actions' : actionType.replace('_', ' ').toUpperCase()}
            </Chip>
          ))}
        </View>
        <View style={styles.filterChips}>
          <Text style={{ marginRight: theme.spacing.sm, alignSelf: 'center' }}>Time Range:</Text>
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <Chip
              key={range}
              selected={selectedTimeRange === range}
              onPress={() => setSelectedTimeRange(range)}
              mode="outlined"
            >
              {range === 'all' ? 'All Time' : range}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  const renderLogDetailsModal = () => {
    if (!selectedLog) return null;

    return (
      <Portal>
        <Modal
          visible={logDetailsModal}
          onDismiss={() => setLogDetailsModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Audit Log Details</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Action</Text>
              <Text style={styles.modalText}>{selectedLog.description}</Text>
              <Text style={styles.modalText}>
                Type: {selectedLog.action_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Admin User</Text>
              {selectedLog.admin_user ? (
                <Text style={styles.modalText}>
                  {selectedLog.admin_user.first_name} {selectedLog.admin_user.last_name}
                  {'\n'}{selectedLog.admin_user.email}
                </Text>
              ) : (
                <Text style={styles.modalText}>Unknown</Text>
              )}
            </View>

            {selectedLog.target_user && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Target User</Text>
                <Text style={styles.modalText}>
                  {selectedLog.target_user.first_name} {selectedLog.target_user.last_name}
                  {'\n'}{selectedLog.target_user.email}
                </Text>
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Timestamp</Text>
              <Text style={styles.modalText}>
                {new Date(selectedLog.created_at).toLocaleString()}
              </Text>
            </View>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Metadata</Text>
                <View style={styles.metadataContainer}>
                  <Text style={styles.modalText}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </Text>
                </View>
              </View>
            )}

            <Button 
              mode="contained" 
              onPress={() => setLogDetailsModal(false)}
              style={{ marginTop: theme.spacing.lg }}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md }}>Loading audit logs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => loadAuditLogs(1, true)}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Audit Logs</Text>
        <Button
          mode="outlined"
          onPress={() => setShowFilters(!showFilters)}
          icon="filter"
          compact
        >
          Filters
        </Button>
      </View>

      {/* Activity Summary */}
      {activitySummary && (
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{activitySummary.totalAuditActions}</Text>
            <Text style={styles.summaryLabel}>Admin Actions ({activitySummary.period})</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{activitySummary.totalUserActivities}</Text>
            <Text style={styles.summaryLabel}>User Activities ({activitySummary.period})</Text>
          </Card>
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search audit logs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {renderFilters()}

      {/* Audit Logs List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
          <MaterialIcons
            name="timeline"
            size={64}
            color={theme.colors.textSecondary}
          />
            <Text style={styles.emptyText}>No audit logs found</Text>
          </View>
        ) : (
          <>
            {logs.map(renderLogCard)}
            
            {hasMore && (
              <Button
                mode="outlined"
                onPress={handleLoadMore}
                loading={loading}
                style={styles.loadMoreButton}
              >
                Load More Logs
              </Button>
            )}
          </>
        )}
      </ScrollView>

      {/* Log Details Modal */}
      {renderLogDetailsModal()}
    </View>
  );
};

export default AuditLogSection;
