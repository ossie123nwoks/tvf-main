import { supabase } from '@/lib/supabase/client';
import { generateDeepLink } from '@/lib/utils/deepLinking';

export interface AppInvitation {
  id: string;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  message?: string;
  invitationCode: string;
  downloadLink: string;
  deepLink?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'installed' | 'expired';
  platform: 'ios' | 'android' | 'web' | 'universal';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    campaign?: string;
  };
}

export interface InvitationInput {
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  message?: string;
  platform?: 'ios' | 'android' | 'web' | 'universal';
  expiresInDays?: number;
  campaign?: string;
}

export interface InvitationStats {
  totalInvitations: number;
  pendingInvitations: number;
  sentInvitations: number;
  deliveredInvitations: number;
  openedInvitations: number;
  installedInvitations: number;
  expiredInvitations: number;
  conversionRate: number;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
  recentInvitations: AppInvitation[];
}

export interface InvitationAnalytics {
  invitationId: string;
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'installed' | 'expired';
  timestamp: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    platform?: string;
  };
}

class InvitationService {
  private readonly INVITATION_CODE_LENGTH = 8;
  private readonly DEFAULT_EXPIRY_DAYS = 30;

  /**
   * Generate a unique invitation code
   */
  private generateInvitationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < this.INVITATION_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate download links for different platforms
   */
  private generateDownloadLinks(platform: string): string {
    const baseUrl = 'https://tvffellowship.com/download';
    
    switch (platform) {
      case 'ios':
        return `${baseUrl}/ios`;
      case 'android':
        return `${baseUrl}/android`;
      case 'web':
        return `${baseUrl}/web`;
      case 'universal':
      default:
        return `${baseUrl}`;
    }
  }

  /**
   * Create a new app invitation
   */
  async createInvitation(
    inviterId: string,
    input: InvitationInput
  ): Promise<AppInvitation> {
    try {
      // Get inviter information
      const { data: inviter, error: inviterError } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', inviterId)
        .single();

      if (inviterError || !inviter) {
        throw new Error('Inviter not found');
      }

      // Generate invitation code and download link
      const invitationCode = this.generateInvitationCode();
      const platform = input.platform || 'universal';
      const downloadLink = this.generateDownloadLinks(platform);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || this.DEFAULT_EXPIRY_DAYS));

      // Create invitation record
      const { data, error } = await supabase
        .from('app_invitations')
        .insert({
          inviter_id: inviterId,
          inviter_name: `${inviter.first_name} ${inviter.last_name}`,
          inviter_email: inviter.email,
          recipient_email: input.recipientEmail,
          recipient_phone: input.recipientPhone,
          recipient_name: input.recipientName,
          message: input.message,
          invitation_code: invitationCode,
          download_link: downloadLink,
          status: 'pending',
          platform: platform,
          expires_at: expiresAt.toISOString(),
          metadata: {
            campaign: input.campaign,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create invitation: ${error.message}`);
      }

      return this.mapDatabaseInvitationToInvitation(data);
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Get invitations sent by a user
   */
  async getUserInvitations(userId: string): Promise<AppInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('app_invitations')
        .select('*')
        .eq('inviter_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invitations: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseInvitationToInvitation);
    } catch (error) {
      console.error('Error fetching user invitations:', error);
      return [];
    }
  }

  /**
   * Get invitation by code
   */
  async getInvitationByCode(code: string): Promise<AppInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('app_invitations')
        .select('*')
        .eq('invitation_code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch invitation: ${error.message}`);
      }

      return this.mapDatabaseInvitationToInvitation(data);
    } catch (error) {
      console.error('Error fetching invitation by code:', error);
      return null;
    }
  }

  /**
   * Update invitation status
   */
  async updateInvitationStatus(
    invitationId: string,
    status: AppInvitation['status'],
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_invitations')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
          ...(metadata && { metadata }),
        })
        .eq('id', invitationId);

      if (error) {
        throw new Error(`Failed to update invitation status: ${error.message}`);
      }

      // Log the status change
      await this.logInvitationEvent(invitationId, status as any, metadata);
    } catch (error) {
      console.error('Error updating invitation status:', error);
      throw error;
    }
  }

  /**
   * Track invitation event
   */
  async trackInvitationEvent(
    invitationCode: string,
    event: InvitationAnalytics['event'],
    metadata?: any
  ): Promise<void> {
    try {
      // Get invitation by code
      const invitation = await this.getInvitationByCode(invitationCode);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Update invitation status based on event
      let newStatus: AppInvitation['status'] = invitation.status;
      switch (event) {
        case 'sent':
          newStatus = 'sent';
          break;
        case 'delivered':
          newStatus = 'delivered';
          break;
        case 'opened':
        case 'clicked':
          newStatus = 'opened';
          break;
        case 'installed':
          newStatus = 'installed';
          break;
        case 'expired':
          newStatus = 'expired';
          break;
      }

      // Update status if it's a progression
      if (this.isStatusProgression(invitation.status, newStatus)) {
        await this.updateInvitationStatus(invitation.id, newStatus, metadata);
      }

      // Log the event
      await this.logInvitationEvent(invitation.id, event, metadata);
    } catch (error) {
      console.error('Error tracking invitation event:', error);
    }
  }

  /**
   * Get invitation statistics for a user
   */
  async getUserInvitationStats(userId: string): Promise<InvitationStats> {
    try {
      const { data, error } = await supabase
        .from('app_invitations')
        .select('*')
        .eq('inviter_id', userId);

      if (error) {
        throw new Error(`Failed to fetch invitation stats: ${error.message}`);
      }

      const invitations = (data || []).map(this.mapDatabaseInvitationToInvitation);
      
      const totalInvitations = invitations.length;
      const pendingInvitations = invitations.filter(i => i.status === 'pending').length;
      const sentInvitations = invitations.filter(i => i.status === 'sent').length;
      const deliveredInvitations = invitations.filter(i => i.status === 'delivered').length;
      const openedInvitations = invitations.filter(i => i.status === 'opened').length;
      const installedInvitations = invitations.filter(i => i.status === 'installed').length;
      const expiredInvitations = invitations.filter(i => i.status === 'expired').length;
      
      const conversionRate = totalInvitations > 0 ? (installedInvitations / totalInvitations) * 100 : 0;

      const byPlatform = invitations.reduce((acc, inv) => {
        acc[inv.platform] = (acc[inv.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = invitations.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentInvitations = invitations.slice(0, 10);

      return {
        totalInvitations,
        pendingInvitations,
        sentInvitations,
        deliveredInvitations,
        openedInvitations,
        installedInvitations,
        expiredInvitations,
        conversionRate,
        byPlatform,
        byStatus,
        recentInvitations,
      };
    } catch (error) {
      console.error('Error fetching invitation stats:', error);
      return {
        totalInvitations: 0,
        pendingInvitations: 0,
        sentInvitations: 0,
        deliveredInvitations: 0,
        openedInvitations: 0,
        installedInvitations: 0,
        expiredInvitations: 0,
        conversionRate: 0,
        byPlatform: {},
        byStatus: {},
        recentInvitations: [],
      };
    }
  }

  /**
   * Generate invitation message
   */
  generateInvitationMessage(invitation: AppInvitation, customMessage?: string): string {
    const baseMessage = customMessage || 
      `Hi! I'd like to invite you to join TRUEVINE FELLOWSHIP Church through our mobile app. ` +
      `The app gives you access to sermons, articles, and church updates. ` +
      `Download it here: ${invitation.downloadLink}`;

    return baseMessage;
  }

  /**
   * Generate invitation email content
   */
  generateInvitationEmail(invitation: AppInvitation, customMessage?: string): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = `${invitation.inviterName} invited you to TRUEVINE FELLOWSHIP Church`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to TRUEVINE FELLOWSHIP Church</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E7D32; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TRUEVINE FELLOWSHIP Church</h1>
            <p>You're invited to join our community!</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p><strong>${invitation.inviterName}</strong> has invited you to join TRUEVINE FELLOWSHIP Church through our mobile app.</p>
            
            ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
            
            <p>Our app gives you access to:</p>
            <ul>
              <li>📱 Latest sermons and teachings</li>
              <li>📖 Inspirational articles and devotionals</li>
              <li>🔔 Church updates and notifications</li>
              <li>👥 Community features and events</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${invitation.downloadLink}" class="button">Download the App</a>
            </div>
            
            <p>Or visit: <a href="${invitation.downloadLink}">${invitation.downloadLink}</a></p>
            
            <p>We look forward to having you as part of our church family!</p>
            
            <p>Blessings,<br>The TRUEVINE FELLOWSHIP Team</p>
          </div>
          <div class="footer">
            <p>This invitation was sent by ${invitation.inviterName} (${invitation.inviterEmail})</p>
            <p>Invitation Code: ${invitation.invitationCode}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${invitation.inviterName} has invited you to join TRUEVINE FELLOWSHIP Church!
      
      ${customMessage ? `"${customMessage}"` : ''}
      
      Our app gives you access to:
      - Latest sermons and teachings
      - Inspirational articles and devotionals
      - Church updates and notifications
      - Community features and events
      
      Download the app: ${invitation.downloadLink}
      
      We look forward to having you as part of our church family!
      
      Blessings,
      The TRUEVINE FELLOWSHIP Team
      
      This invitation was sent by ${invitation.inviterName} (${invitation.inviterEmail})
      Invitation Code: ${invitation.invitationCode}
    `;

    return { subject, html, text };
  }

  /**
   * Check if status progression is valid
   */
  private isStatusProgression(current: string, newStatus: string): boolean {
    const progression = ['pending', 'sent', 'delivered', 'opened', 'installed'];
    const currentIndex = progression.indexOf(current);
    const newIndex = progression.indexOf(newStatus);
    
    return newIndex > currentIndex;
  }

  /**
   * Log invitation event
   */
  private async logInvitationEvent(
    invitationId: string,
    event: InvitationAnalytics['event'],
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitation_analytics')
        .insert({
          invitation_id: invitationId,
          event: event,
          timestamp: new Date().toISOString(),
          metadata: metadata,
        });

      if (error) {
        console.error('Error logging invitation event:', error);
      }
    } catch (error) {
      console.error('Error logging invitation event:', error);
    }
  }

  /**
   * Map database invitation to AppInvitation
   */
  private mapDatabaseInvitationToInvitation(data: any): AppInvitation {
    return {
      id: data.id,
      inviterId: data.inviter_id,
      inviterName: data.inviter_name,
      inviterEmail: data.inviter_email,
      recipientEmail: data.recipient_email,
      recipientPhone: data.recipient_phone,
      recipientName: data.recipient_name,
      message: data.message,
      invitationCode: data.invitation_code,
      downloadLink: data.download_link,
      deepLink: data.deep_link,
      status: data.status,
      platform: data.platform,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata,
    };
  }
}

// Export singleton instance
export const invitationService = new InvitationService();

// Export types
export type { AppInvitation, InvitationInput, InvitationStats, InvitationAnalytics };
