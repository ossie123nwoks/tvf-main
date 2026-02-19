import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/user';

// Supabase session interface (matches actual Supabase response)
interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number | string; // Supabase returns UNIX timestamp (number), stored as string
  user: any;
}

// Storage keys for session persistence
const STORAGE_KEYS = {
  SESSION: 'tvf_auth_session',
  USER: 'tvf_auth_user',
  REFRESH_TOKEN: 'tvf_refresh_token',
  LAST_ACTIVITY: 'tvf_last_activity',
  AUTO_LOGIN_ENABLED: 'tvf_auto_login_enabled',
} as const;

// Session configuration
const SESSION_CONFIG = {
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_SESSION_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  ACTIVITY_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours of inactivity
} as const;

export interface SessionData {
  session: SupabaseSession | null;
  user: User | null;
  refreshToken: string | null;
  lastActivity: number;
  autoLoginEnabled: boolean;
}

export interface SessionStatus {
  isValid: boolean;
  needsRefresh: boolean;
  isExpired: boolean;
  timeUntilExpiry: number;
  lastActivity: number;
}

class SessionManager {
  private currentSession: SessionData | null = null;
  private refreshPromise: Promise<SessionData | null> | null = null;
  private activityTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.setupActivityTracking();
  }

  // Initialize session manager and load persisted session
  async initialize(): Promise<SessionData | null> {
    try {
      const sessionData = await this.loadPersistedSession();

      if (sessionData && this.isSessionValid(sessionData)) {
        this.currentSession = sessionData;
        await this.updateLastActivity();

        // Check if session needs refresh
        if (this.shouldRefreshSession(sessionData)) {
          await this.refreshSession();
        }

        return this.currentSession;
      }

      return null;
    } catch (error) {
      console.error('Session initialization failed:', error);
      await this.clearSession();
      return null;
    }
  }

  // Get current session data
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  // Check session status
  getSessionStatus(): SessionStatus | null {
    if (!this.currentSession) return null;

    const now = Date.now();
    const sessionExpiry = this.currentSession.session?.expires_at
      ? new Date(this.currentSession.session.expires_at).getTime()
      : 0;

    const timeUntilExpiry = Math.max(0, sessionExpiry - now);
    const isExpired = timeUntilExpiry === 0;
    const needsRefresh = this.shouldRefreshSession(this.currentSession);
    const isValid = !isExpired && this.currentSession.user !== null;

    return {
      isValid,
      needsRefresh,
      isExpired,
      timeUntilExpiry,
      lastActivity: this.currentSession.lastActivity,
    };
  }

  // Save session data
  async saveSession(session: any, user: User): Promise<void> {
    try {
      const sessionData: SessionData = {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at != null ? String(session.expires_at) : String(Math.floor(Date.now() / 1000) + 3600),
          user: session.user,
        },
        user,
        refreshToken: session.refresh_token || null,
        lastActivity: Date.now(),
        autoLoginEnabled: true,
      };

      this.currentSession = sessionData;
      await this.persistSession(sessionData);
      await this.updateLastActivity();

      // Set up automatic refresh
      this.scheduleSessionRefresh(sessionData);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  // Refresh session using refresh token
  async refreshSession(): Promise<SessionData | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performSessionRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Clear session and remove persisted data
  async clearSession(): Promise<void> {
    try {
      this.currentSession = null;
      this.clearRefreshTimer();
      this.clearActivityTimer();

      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTO_LOGIN_ENABLED),
      ]);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Update last activity timestamp
  async updateLastActivity(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.lastActivity = Date.now();
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_ACTIVITY,
        this.currentSession.lastActivity.toString()
      );
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  // Check if auto-login is enabled
  async isAutoLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOGIN_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check auto-login status:', error);
      return false;
    }
  }

  // Set auto-login preference
  async setAutoLoginEnabled(enabled: boolean): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.autoLoginEnabled = enabled;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_LOGIN_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Failed to set auto-login preference:', error);
    }
  }

  // Check if session is valid
  private isSessionValid(sessionData: SessionData): boolean {
    if (!sessionData.session || !sessionData.user) return false;

    const now = Date.now();
    const expiresAt = sessionData.session.expires_at;
    const sessionExpiry = typeof expiresAt === 'number'
      ? expiresAt * 1000  // UNIX timestamp in seconds
      : new Date(expiresAt ?? 0).getTime();

    // Check if session is expired
    if (now >= sessionExpiry) return false;

    // Check if session is too old
    if (now - sessionData.lastActivity > SESSION_CONFIG.MAX_SESSION_AGE) return false;

    // Check if user has been inactive for too long
    if (now - sessionData.lastActivity > SESSION_CONFIG.ACTIVITY_TIMEOUT) return false;

    return true;
  }

  // Check if session needs refresh
  private shouldRefreshSession(sessionData: SessionData): boolean {
    if (!sessionData.session) return false;

    const now = Date.now();
    const expiresAt = sessionData.session.expires_at;
    const sessionExpiry = typeof expiresAt === 'number'
      ? expiresAt * 1000
      : new Date(expiresAt ?? 0).getTime();

    return sessionExpiry - now <= SESSION_CONFIG.REFRESH_THRESHOLD;
  }

  // Perform actual session refresh
  private async performSessionRefresh(): Promise<SessionData | null> {
    try {
      if (!this.currentSession?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: this.currentSession.refreshToken,
      });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        const sessionData: SessionData = {
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at != null ? String(data.session.expires_at) : String(Math.floor(Date.now() / 1000) + 3600),
            user: data.session.user,
          },
          user: data.user as unknown as User,
          refreshToken: data.session.refresh_token || null,
          lastActivity: Date.now(),
          autoLoginEnabled: this.currentSession.autoLoginEnabled,
        };

        this.currentSession = sessionData;
        await this.persistSession(sessionData);
        await this.updateLastActivity();

        // Schedule next refresh
        this.scheduleSessionRefresh(sessionData);

        return sessionData;
      }

      return null;
    } catch (error) {
      console.error('Session refresh failed:', error);

      // If refresh fails, clear the session
      await this.clearSession();
      return null;
    }
  }

  // Schedule automatic session refresh
  private scheduleSessionRefresh(sessionData: SessionData): void {
    this.clearRefreshTimer();

    if (!sessionData.session) return;

    const now = Date.now();
    const expiresAt = sessionData.session.expires_at;
    const sessionExpiry = expiresAt != null
      ? (typeof expiresAt === 'number' ? expiresAt * 1000 : new Date(expiresAt).getTime())
      : 0;
    const refreshTime = sessionExpiry - SESSION_CONFIG.REFRESH_THRESHOLD;
    const delay = Math.max(0, refreshTime - now);

    this.activityTimer = setTimeout(async () => {
      await this.refreshSession();
    }, delay);
  }

  // Clear refresh timer
  private clearRefreshTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Clear activity timer
  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Set up activity tracking
  private setupActivityTracking(): void {
    // Track app state changes to update activity
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.updateLastActivity();
        }
      });
    }
  }

  // Load persisted session from storage
  private async loadPersistedSession(): Promise<SessionData | null> {
    try {
      const [sessionStr, userStr, refreshToken, lastActivityStr, autoLoginStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY),
        AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOGIN_ENABLED),
      ]);

      if (!sessionStr || !userStr) return null;

      const session = JSON.parse(sessionStr);
      const user = JSON.parse(userStr);
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
      const autoLoginEnabled = autoLoginStr === 'true';

      return {
        session,
        user,
        refreshToken,
        lastActivity,
        autoLoginEnabled,
      };
    } catch (error) {
      console.error('Failed to load persisted session:', error);
      return null;
    }
  }

  // Persist session to storage
  private async persistSession(sessionData: SessionData): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData.session)),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionData.user)),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, sessionData.refreshToken || ''),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, sessionData.lastActivity.toString()),
        AsyncStorage.setItem(
          STORAGE_KEYS.AUTO_LOGIN_ENABLED,
          sessionData.autoLoginEnabled.toString()
        ),
      ]);
    } catch (error) {
      console.error('Failed to persist session:', error);
      throw error;
    }
  }

  // Validate session with Supabase
  async validateSessionWithServer(): Promise<boolean> {
    try {
      if (!this.currentSession?.session) return false;

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Server session validation failed:', error);
        return false;
      }

      // Update local session if server has newer data
      // Note: getSession() only returns { session }, not { session, user }.
      // We use getUser() to get the current user separately.
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await this.saveSession(data.session, userData.user as unknown as User);
        }
        return true;
      }

      return !!data.session;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Get session expiry information
  getSessionExpiryInfo(): { expiresAt: Date | null; timeUntilExpiry: number } | null {
    if (!this.currentSession?.session) return null;

    const rawExpiry = this.currentSession.session.expires_at;
    const expiresAt = rawExpiry != null
      ? new Date(typeof rawExpiry === 'number' ? rawExpiry * 1000 : rawExpiry)
      : null;
    const timeUntilExpiry = Math.max(0, (expiresAt?.getTime() ?? 0) - Date.now());

    return {
      expiresAt,
      timeUntilExpiry,
    };
  }

  // Force session refresh (for manual refresh)
  async forceRefresh(): Promise<SessionData | null> {
    return this.refreshSession();
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export utility functions
export const isSessionValid = (sessionData: SessionData): boolean => {
  return sessionManager['isSessionValid'](sessionData);
};

export const shouldRefreshSession = (sessionData: SessionData): boolean => {
  return sessionManager['shouldRefreshSession'](sessionData);
};
