import { supabase } from '@/lib/supabase/client';
import { sessionManager, SessionData } from './sessionManager';
import { AuthError } from '@/types/user';

export interface ReauthOptions {
  silent?: boolean; // Don't show UI during re-auth
  force?: boolean; // Force re-authentication even if session seems valid
  redirectTo?: string; // Where to redirect after successful re-auth
}

export interface ReauthResult {
  success: boolean;
  session: SessionData | null;
  error?: AuthError;
  wasSilent?: boolean;
}

class AutoReauthService {
  private isReauthenticating = false;
  private reauthPromise: Promise<ReauthResult> | null = null;

  // Main re-authentication method
  async reauthenticate(options: ReauthOptions = {}): Promise<ReauthResult> {
    // Prevent multiple simultaneous re-auth attempts
    if (this.isReauthenticating && this.reauthPromise) {
      return this.reauthPromise;
    }

    this.isReauthenticating = true;
    this.reauthPromise = this.performReauth(options);

    try {
      const result = await this.reauthPromise;
      return result;
    } finally {
      this.isReauthenticating = false;
      this.reauthPromise = null;
    }
  }

  // Check if re-authentication is needed
  async needsReauth(): Promise<boolean> {
    try {
      const currentSession = sessionManager.getCurrentSession();

      if (!currentSession) return true;

      const sessionStatus = sessionManager.getSessionStatus();
      if (!sessionStatus?.isValid) return true;

      // Validate with server
      const isValidOnServer = await sessionManager.validateSessionWithServer();
      if (!isValidOnServer) return true;

      return false;
    } catch (error) {
      console.error('Error checking re-auth need:', error);
      return true;
    }
  }

  // Attempt silent re-authentication
  async silentReauth(): Promise<ReauthResult> {
    return this.reauthenticate({ silent: true });
  }

  // Force re-authentication
  async forceReauth(): Promise<ReauthResult> {
    return this.reauthenticate({ force: true });
  }

  // Perform the actual re-authentication
  private async performReauth(options: ReauthOptions): Promise<ReauthResult> {
    try {
      const currentSession = sessionManager.getCurrentSession();

      // If no current session, user needs to sign in again
      if (!currentSession) {
        return {
          success: false,
          session: null,
          error: {
            code: 'NO_SESSION',
            message: 'No active session found',
          },
        };
      }

      // Try to refresh the session first
      if (!options.force) {
        try {
          const refreshedSession = await sessionManager.refreshSession();
          if (refreshedSession) {
            return {
              success: true,
              session: refreshedSession,
              wasSilent: options.silent,
            };
          }
        } catch (error) {
          console.log('Session refresh failed, attempting full re-auth:', error);
        }
      }

      // If refresh failed or force is true, try to restore from Supabase
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Failed to get session from Supabase:', error);
        return {
          success: false,
          session: null,
          error: {
            code: 'REAUTH_FAILED',
            message: 'Failed to restore session',
          },
        };
      }

      if (data.session && data.user) {
        // Session is valid on server, update local session
        await sessionManager.saveSession(data.session, data.user as User);

        return {
          success: true,
          session: sessionManager.getCurrentSession()!,
          wasSilent: options.silent,
        };
      }

      // No valid session on server, user needs to sign in again
      await sessionManager.clearSession();

      return {
        success: false,
        session: null,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired. Please sign in again.',
        },
      };
    } catch (error) {
      console.error('Re-authentication failed:', error);

      // Clear invalid session
      await sessionManager.clearSession();

      return {
        success: false,
        session: null,
        error: {
          code: 'REAUTH_ERROR',
          message: 'Re-authentication failed. Please sign in again.',
        },
      };
    }
  }

  // Handle network connectivity issues
  async handleNetworkError(): Promise<ReauthResult> {
    try {
      // Check if we have a cached session that might still be valid
      const currentSession = sessionManager.getCurrentSession();

      if (currentSession) {
        const sessionStatus = sessionManager.getSessionStatus();

        // If session is still valid locally, return it
        if (sessionStatus?.isValid) {
          return {
            success: true,
            session: currentSession,
            wasSilent: true,
          };
        }
      }

      // No valid cached session
      return {
        success: false,
        session: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection required for authentication',
        },
      };
    } catch (error) {
      console.error('Network error handling failed:', error);
      return {
        success: false,
        session: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection required for authentication',
        },
      };
    }
  }

  // Check if user should be automatically logged out
  async shouldAutoLogout(): Promise<boolean> {
    try {
      const currentSession = sessionManager.getCurrentSession();

      if (!currentSession) return false;

      const sessionStatus = sessionManager.getSessionStatus();

      // Auto-logout if session is expired or too old
      if (sessionStatus?.isExpired) return true;

      // Check if auto-login is disabled
      const autoLoginEnabled = await sessionManager.isAutoLoginEnabled();
      if (!autoLoginEnabled) return true;

      // Check for suspicious activity (multiple failed re-auth attempts)
      // This could be expanded with more sophisticated detection

      return false;
    } catch (error) {
      console.error('Error checking auto-logout:', error);
      return true; // Err on the side of security
    }
  }

  // Perform automatic logout if needed
  async performAutoLogout(): Promise<void> {
    try {
      if (await this.shouldAutoLogout()) {
        await sessionManager.clearSession();
        console.log('User automatically logged out due to security policy');
      }
    } catch (error) {
      console.error('Auto-logout failed:', error);
    }
  }

  // Get re-authentication status
  getStatus(): {
    isReauthenticating: boolean;
    hasValidSession: boolean;
    lastReauthAttempt: number | null;
  } {
    return {
      isReauthenticating: this.isReauthenticating,
      hasValidSession: !!sessionManager.getCurrentSession(),
      lastReauthAttempt: null, // Could be expanded to track this
    };
  }

  // Reset re-authentication state
  reset(): void {
    this.isReauthenticating = false;
    this.reauthPromise = null;
  }
}

// Export singleton instance
export const autoReauthService = new AutoReauthService();

// Export utility functions
export const needsReauth = (): Promise<boolean> => {
  return autoReauthService.needsReauth();
};

export const silentReauth = (): Promise<ReauthResult> => {
  return autoReauthService.silentReauth();
};

export const forceReauth = (): Promise<ReauthResult> => {
  return autoReauthService.forceReauth();
};
