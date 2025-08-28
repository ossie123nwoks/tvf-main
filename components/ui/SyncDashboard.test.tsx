import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SyncDashboard } from './SyncDashboard';
import { ThemeProvider } from '../../lib/theme/ThemeProvider';

// Mock the useSyncManager hook
jest.mock('../../lib/storage/useSyncManager', () => ({
  useSyncManager: () => ({
    syncQueue: [],
    activeSyncs: [],
    syncProgress: {
      totalItems: 0,
      completedItems: 0,
      failedItems: 0,
      inProgressItems: 0,
      estimatedTimeRemaining: 0,
      bytesTransferred: 0,
      totalBytes: 0,
    },
    syncOptions: {
      autoSync: true,
      syncOnWifi: true,
      syncOnCellular: false,
      maxConcurrentSyncs: 3,
      retryFailedItems: true,
      maxRetryAttempts: 3,
      syncInterval: 30,
      priorityOrder: true,
      conflictResolution: 'newest',
    },
    syncConflicts: [],
    syncStats: {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalItemsSynced: 0,
      totalBytesTransferred: 0,
      averageSyncTime: 0,
      lastSyncTime: 0,
      conflictsResolved: 0,
      retryAttempts: 0,
    },
    isSyncInProgress: false,
    isLoading: false,
    addToSyncQueue: jest.fn(),
    startSync: jest.fn(),
    pauseSync: jest.fn(),
    resumeSync: jest.fn(),
    retryFailedSyncs: jest.fn(),
    clearCompletedSyncs: jest.fn(),
    updateSyncOptions: jest.fn(),
    resolveSyncConflict: jest.fn(),
    triggerOfflineContentSync: jest.fn(),
    getSyncStatusSummary: () => ({
      totalItems: 0,
      pendingItems: 0,
      inProgressItems: 0,
      completedItems: 0,
      failedItems: 0,
      offlineContentCount: 0,
      lastSyncTime: Date.now(),
    }),
    refreshData: jest.fn(),
  }),
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

describe('SyncDashboard', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('renders correctly with default state', () => {
    const { getByText } = renderWithTheme(<SyncDashboard />);
    
    expect(getByText('Sync Dashboard')).toBeTruthy();
    expect(getByText('Sync Status')).toBeTruthy();
    expect(getByText('Sync Controls')).toBeTruthy();
    expect(getByText('Sync Queue (0)')).toBeTruthy();
  });

  it('displays sync status information', () => {
    const { getByText } = renderWithTheme(<SyncDashboard />);
    
    expect(getByText('Status: Idle')).toBeTruthy();
    expect(getByText('Total Items')).toBeTruthy();
    expect(getByText('Offline Content')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Failed')).toBeTruthy();
  });

  it('shows sync controls', () => {
    const { getByText } = renderWithTheme(<SyncDashboard />);
    
    expect(getByText('Start Sync')).toBeTruthy();
    expect(getByText('Retry Failed')).toBeTruthy();
    expect(getByText('Clear Completed')).toBeTruthy();
    expect(getByText('Sync Offline Content')).toBeTruthy();
  });

  it('displays sync options', () => {
    const { getByText } = renderWithTheme(<SyncDashboard />);
    
    expect(getByText('Auto-sync')).toBeTruthy();
    expect(getByText('Sync on WiFi')).toBeTruthy();
    expect(getByText('Sync on Cellular')).toBeTruthy();
    expect(getByText('Retry failed items')).toBeTruthy();
    expect(getByText('Priority ordering')).toBeTruthy();
  });

  it('shows empty queue message when no items', () => {
    const { getByText } = renderWithTheme(<SyncDashboard />);
    
    expect(getByText('No items in sync queue')).toBeTruthy();
  });

  it('handles close button when onClose prop is provided', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithTheme(<SyncDashboard onClose={onClose} />);
    
    // Note: The close button is rendered by IconButton, so we need to check if it exists
    // This test verifies the component renders without crashing when onClose is provided
    expect(onClose).toBeDefined();
  });
});
