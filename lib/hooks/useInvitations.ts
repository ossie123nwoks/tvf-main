import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  invitationService,
  AppInvitation,
  InvitationInput,
  InvitationStats,
} from '@/lib/services/invitationService';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSharing } from '@/lib/hooks/useSharing';

export interface UseInvitationsReturn {
  invitations: AppInvitation[];
  stats: InvitationStats | null;
  loading: boolean;
  error: string | null;
  createInvitation: (input: InvitationInput) => Promise<AppInvitation>;
  sendInvitation: (invitation: AppInvitation, method: 'email' | 'sms' | 'whatsapp' | 'telegram') => Promise<void>;
  trackInvitationEvent: (invitationCode: string, event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'installed' | 'expired') => Promise<void>;
  refreshInvitations: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useInvitations = (): UseInvitationsReturn => {
  const { user } = useAuth();
  const { shareContent } = useSharing();
  const [invitations, setInvitations] = useState<AppInvitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setInvitations([]);
      setStats(null);
    }
  }, [user]);

  const loadAllData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [userInvitations, userStats] = await Promise.all([
        invitationService.getUserInvitations(user.id),
        invitationService.getUserInvitationStats(user.id),
      ]);

      setInvitations(userInvitations);
      setStats(userStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(errorMessage);
      console.error('Error loading invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createInvitation = useCallback(async (input: InvitationInput): Promise<AppInvitation> => {
    if (!user) {
      throw new Error('User must be authenticated to create invitations');
    }

    setLoading(true);
    setError(null);

    try {
      const invitation = await invitationService.createInvitation(user.id, input);
      
      // Add to local state
      setInvitations(prev => [invitation, ...prev]);
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalInvitations: prev.totalInvitations + 1,
          pendingInvitations: prev.pendingInvitations + 1,
          recentInvitations: [invitation, ...prev.recentInvitations.slice(0, 9)],
        } : null);
      }

      return invitation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invitation';
      setError(errorMessage);
      console.error('Error creating invitation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, stats]);

  const sendInvitation = useCallback(async (
    invitation: AppInvitation,
    method: 'email' | 'sms' | 'whatsapp' | 'telegram'
  ): Promise<void> => {
    try {
      const message = invitationService.generateInvitationMessage(invitation, invitation.message);
      
      // Use the sharing service to send the invitation
      const shareResult = await shareContent(
        {
          type: 'sermon', // This is just for the sharing service, not actual content
          id: invitation.id,
          title: 'TRUEVINE FELLOWSHIP Church App',
          description: message,
          author: invitation.inviterName,
        },
        {
          method: method,
          customMessage: message,
          recipientEmail: method === 'email' ? invitation.recipientEmail : undefined,
          recipientPhone: method === 'sms' ? invitation.recipientPhone : undefined,
        }
      );

      if (shareResult.success) {
        // Update invitation status to sent
        await invitationService.updateInvitationStatus(invitation.id, 'sent');
        
        // Update local state
        setInvitations(prev => prev.map(inv => 
          inv.id === invitation.id ? { ...inv, status: 'sent' } : inv
        ));

        // Update stats
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            sentInvitations: prev.sentInvitations + 1,
            pendingInvitations: Math.max(0, prev.pendingInvitations - 1),
          } : null);
        }

        Alert.alert('Invitation Sent', 'Your invitation has been sent successfully!');
      } else {
        throw new Error(shareResult.error || 'Failed to send invitation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      Alert.alert('Send Failed', errorMessage);
      throw err;
    }
  }, [shareContent, stats]);

  const trackInvitationEvent = useCallback(async (
    invitationCode: string,
    event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'installed' | 'expired'
  ): Promise<void> => {
    try {
      await invitationService.trackInvitationEvent(invitationCode, event);
    } catch (err) {
      console.error('Error tracking invitation event:', err);
    }
  }, []);

  const refreshInvitations = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userInvitations = await invitationService.getUserInvitations(user.id);
      setInvitations(userInvitations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh invitations';
      setError(errorMessage);
      console.error('Error refreshing invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshStats = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const userStats = await invitationService.getUserInvitationStats(user.id);
      setStats(userStats);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  }, [user]);

  return {
    invitations,
    stats,
    loading,
    error,
    createInvitation,
    sendInvitation,
    trackInvitationEvent,
    refreshInvitations,
    refreshStats,
  };
};
