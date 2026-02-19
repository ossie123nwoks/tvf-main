import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AuthService } from '@/lib/supabase/auth';
import { sessionManager } from './sessionManager';
import { autoReauthService } from './autoReauth';
import {
  User,
  Session,
  AuthState,
  SignInCredentials,
  SignUpCredentials,
  AuthError,
  AuthSuccess,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordResetConfirmOtp,
  EmailVerificationRequest,
  UserProfileUpdate,
  ChangePasswordRequest,
  DeleteAccountRequest,
  OnboardingData,
} from '@/types/user';

interface AuthContextType extends AuthState {
  // Authentication methods
  signUp: (credentials: SignUpCredentials) => Promise<AuthSuccess | AuthError>;
  signIn: (credentials: SignInCredentials) => Promise<AuthSuccess | AuthError>;
  signInWithGoogle: () => Promise<AuthSuccess | AuthError>;
  signOut: () => Promise<void>;

  // Password management
  requestPasswordReset: (
    request: PasswordResetRequest
  ) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (confirm: PasswordResetConfirm) => Promise<AuthSuccess | AuthError>;
  confirmPasswordResetOtp: (confirm: PasswordResetConfirmOtp) => Promise<AuthSuccess | AuthError>;

  // Email verification
  requestEmailVerification: (
    request: EmailVerificationRequest
  ) => Promise<{ success: boolean; error?: string }>;

  // Profile management
  updateProfile: (updates: UserProfileUpdate) => Promise<AuthSuccess | AuthError>;
  changePassword: (request: ChangePasswordRequest) => Promise<AuthSuccess | AuthError>;
  deleteAccount: (request: DeleteAccountRequest) => Promise<{ success: boolean; error?: string }>;

  // Onboarding
  updateOnboardingData: (
    onboardingData: OnboardingData
  ) => Promise<{ success: boolean; error?: string }>;

  // Utility methods
  clearError: () => void;
  refreshUser: () => Promise<void>;
  isUserVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isInitialized: false,
  });

  // Initialize authentication state with session management
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true }));

        // Initialize session manager and load persisted session
        const sessionData = await sessionManager.initialize();

        if (sessionData?.session && sessionData?.user) {
          // Convert SessionData to AuthState format
          const session = {
            accessToken: sessionData.session.access_token,
            refreshToken: sessionData.session.refresh_token,
            expiresAt: (() => {
              const exp = sessionData.session.expires_at;
              if (exp == null) return Date.now() + 3600000;
              const ms = typeof exp === 'number' ? exp * 1000 : new Date(exp).getTime();
              return ms;
            })(),
            user: sessionData.user,
          };

          setAuthState({
            user: sessionData.user,
            session,
            loading: false,
            error: null,
            isAuthenticated: true,
            isInitialized: true,
          });
        } else {
          // No valid session, check if re-authentication is needed
          const needsReauth = await autoReauthService.needsReauth();

          if (needsReauth) {
            // Try silent re-authentication
            const reauthResult = await autoReauthService.silentReauth();

            if (reauthResult.success && reauthResult.session) {
              const session = {
                accessToken: reauthResult.session.session!.access_token,
                refreshToken: reauthResult.session.session!.refresh_token,
                expiresAt: (() => {
                  const exp = reauthResult.session!.session!.expires_at;
                  if (exp == null) return Date.now() + 3600000;
                  const ms = typeof exp === 'number' ? exp * 1000 : new Date(exp).getTime();
                  return ms;
                })(),
                user: reauthResult.session.user as unknown as User,
              };

              setAuthState({
                user: reauthResult.session.user as unknown as User,
                session,
                loading: false,
                error: null,
                isAuthenticated: true,
                isInitialized: true,
              });
            } else {
              // Re-authentication failed, user needs to sign in
              setAuthState({
                user: null,
                session: null,
                loading: false,
                error: null,
                isAuthenticated: false,
                isInitialized: true,
              });
            }
          } else {
            // No session and no re-auth needed
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
              isAuthenticated: false,
              isInitialized: true,
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: 'Failed to initialize authentication',
          isAuthenticated: false,
          isInitialized: true,
        });
      }
    };

    initializeAuth();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'session exists' : 'no session');

      try {
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ SIGNED_IN event received, processing...');

          // Create user immediately from session.user to avoid blocking on network
          const createUserFromSession = (sessionUser: any) => {
            if (!sessionUser) return null;
            return {
              id: sessionUser.id || '',
              email: sessionUser.email || '',
              firstName: sessionUser.user_metadata?.first_name || '',
              lastName: sessionUser.user_metadata?.last_name || '',
              avatarUrl: sessionUser.user_metadata?.avatar_url || '',
              role: 'member', // Will be updated if we can fetch from DB
              isEmailVerified: sessionUser.email_confirmed_at !== null,
              lastSignInAt: sessionUser.last_sign_in_at || '',
              createdAt: sessionUser.created_at || new Date().toISOString(),
              updatedAt: sessionUser.updated_at || sessionUser.created_at || new Date().toISOString(),
              preferences: {
                theme: 'auto',
                notifications: {
                  newContent: true,
                  reminders: true,
                  updates: true,
                  marketing: false,
                },
                audioQuality: 'medium',
                autoDownload: false,
                language: 'en',
              },
            };
          };

          // Create user immediately from session to unblock authentication
          let user = createUserFromSession(session.user);
          console.log('✅ User created from session:', user ? `${user.email}` : 'null');

          // Convert expires_at to milliseconds if it's in seconds (Supabase returns seconds)
          const expiresAt = session.expires_at
            ? (session.expires_at > 10000000000 ? session.expires_at : session.expires_at * 1000)
            : Date.now() + 3600000; // Default to 1 hour if missing

          // Set auth state immediately to unblock the UI
          console.log('🔄 Setting auth state immediately...');
          setAuthState({
            user: user as unknown as User,
            session: session
              ? {
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                expiresAt,
                user: (user as unknown as User)!,
              }
              : null,
            loading: false,
            error: null,
            isAuthenticated: true,
            isInitialized: true,
          });
          console.log('✅ Auth state set, user can now proceed');

          // Try to fetch complete user data in the background (with timeout)
          // This will update the user with role and other data if available
          const fetchCompleteUserData = async () => {
            try {
              console.log('📋 Fetching complete user data in background...');

              // Create a timeout promise
              const timeoutPromise = new Promise<null>((resolve) => {
                setTimeout(() => {
                  console.log('⏱️ Timeout: getCurrentUser took too long, using session data');
                  resolve(null);
                }, 15000); // 15 second timeout
              });

              // Race between getCurrentUser and timeout
              const fetchedUser = await Promise.race([
                AuthService.getCurrentUser(),
                timeoutPromise,
              ]);

              if (fetchedUser) {
                console.log('✅ Complete user data fetched:', fetchedUser.email);
                // Update state with complete user data
                setAuthState(prev => ({
                  ...prev,
                  user: fetchedUser,
                  session: prev.session ? {
                    ...prev.session,
                    user: fetchedUser,
                  } : null,
                }));
              } else {
                console.log('ℹ️ Using session-based user data (timeout or error)');
              }
            } catch (error) {
              console.error('❌ Error fetching complete user data:', error);
              // Continue with session-based user - already set above
            }
          };

          // Fetch complete user data in background (non-blocking)
          fetchCompleteUserData();

          // Handle Google profile creation/update (don't block on errors)
          if (session.user?.app_metadata?.provider === 'google') {
            // Run in background, don't await
            AuthService.createOrUpdateGoogleProfile(session.user).catch((error) => {
              console.error('❌ Error creating/updating Google profile:', error);
            });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 SIGNED_OUT event received');
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 TOKEN_REFRESHED event received');
          let user;
          try {
            user = await AuthService.getCurrentUser();
          } catch (error) {
            console.error('Error getting current user on token refresh:', error);
            // If getCurrentUser fails, create a basic user from session.user
            if (session.user) {
              user = {
                id: session.user.id || '',
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || '',
                lastName: session.user.user_metadata?.last_name || '',
                avatarUrl: session.user.user_metadata?.avatar_url || '',
                role: 'member',
                isEmailVerified: session.user.email_confirmed_at !== null,
                lastSignInAt: session.user.last_sign_in_at || '',
                createdAt: session.user.created_at || new Date().toISOString(),
                updatedAt: session.user.updated_at || session.user.created_at || new Date().toISOString(),
                preferences: {
                  theme: 'auto',
                  notifications: {
                    newContent: true,
                    reminders: true,
                    updates: true,
                    marketing: false,
                  },
                  audioQuality: 'medium',
                  autoDownload: false,
                  language: 'en',
                },
              };
            } else {
              user = null;
            }
          }

          // Convert expires_at to milliseconds if it's in seconds
          const expiresAt = session.expires_at
            ? (session.expires_at > 10000000000 ? session.expires_at : session.expires_at * 1000)
            : Date.now() + 3600000;

          setAuthState(prev => ({
            ...prev,
            session: session
              ? {
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                expiresAt,
                user: (user as unknown as User)!,
              }
              : prev.session,
            user: user as unknown as User,
          }));
        }
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error);
        // Ensure state is updated even on error to prevent infinite loading
        if (event === 'SIGNED_IN' && session) {
          console.log('🔄 Fallback: Setting auth state from error handler');
          // Create a basic user from session.user as fallback
          const user = session.user ? {
            id: session.user.id || '',
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            avatarUrl: session.user.user_metadata?.avatar_url || '',
            role: 'member',
            isEmailVerified: session.user.email_confirmed_at !== null,
            lastSignInAt: session.user.last_sign_in_at || '',
            createdAt: session.user.created_at || new Date().toISOString(),
            updatedAt: session.user.updated_at || session.user.created_at || new Date().toISOString(),
            preferences: {
              theme: 'auto',
              notifications: {
                newContent: true,
                reminders: true,
                updates: true,
                marketing: false,
              },
              audioQuality: 'medium',
              autoDownload: false,
              language: 'en',
            },
          } : null;

          const expiresAt = session.expires_at
            ? (session.expires_at > 10000000000 ? session.expires_at : session.expires_at * 1000)
            : Date.now() + 3600000;

          setAuthState({
            user: user as unknown as User,
            session: session
              ? {
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                expiresAt,
                user: (user as unknown as User)!,
              }
              : null,
            loading: false,
            error: null,
            isAuthenticated: true,
            isInitialized: true,
          });
          console.log('✅ Fallback auth state set');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up method
  const signUp = useCallback(
    async (credentials: SignUpCredentials): Promise<AuthSuccess | AuthError> => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.signUp(credentials);

        if ('code' in result) {
          // Error case
          setAuthState(prev => ({ ...prev, loading: false, error: result.message }));
          return result;
        } else {
          // Success case
          setAuthState({
            user: result.user,
            session: result.session || null,
            loading: false,
            error: null,
            isAuthenticated: !!result.session,
            isInitialized: true,
          });
          return result;
        }
      } catch (error) {
        console.error('Sign up error in context:', error);
        const errorMessage = 'An unexpected error occurred during sign up';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Sign in method
  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<AuthSuccess | AuthError> => {
      try {
        console.log('🔑 Sign in initiated');
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.signIn(credentials);

        if ('code' in result) {
          // Error case
          console.log('❌ Sign in error:', result.message);
          setAuthState(prev => ({ ...prev, loading: false, error: result.message }));
          return result;
        } else {
          // Success case - Note: onAuthStateChange will also fire and update state
          // But we set it here immediately to prevent loading delay
          console.log('✅ Sign in successful, setting state immediately');
          setAuthState({
            user: result.user,
            session: result.session || null,
            loading: false,
            error: null,
            isAuthenticated: true,
            isInitialized: true,
          });
          console.log('✅ Sign in state set, waiting for onAuthStateChange...');
          return result;
        }
      } catch (error) {
        console.error('❌ Sign in error in context:', error);
        const errorMessage = 'An unexpected error occurred during sign in';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Sign in with Google method
  const signInWithGoogle = useCallback(
    async (): Promise<AuthSuccess | AuthError> => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.signInWithGoogle();

        if ('code' in result) {
          // Error case - but don't set error for user cancellation (expected behavior)
          if (result.code === 'USER_CANCELLED') {
            setAuthState(prev => ({ ...prev, loading: false, error: null }));
          } else {
            setAuthState(prev => ({ ...prev, loading: false, error: result.message }));
          }
          return result;
        } else {
          // Success case - Native Google Sign-In returns session directly
          setAuthState({
            user: result.user,
            session: result.session || null,
            loading: false,
            error: null,
            isAuthenticated: true,
            isInitialized: true,
          });
          return result;
        }
      } catch (error) {
        console.error('Sign in with Google error in context:', error);
        const errorMessage = 'An unexpected error occurred during Google sign in';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Sign out method
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const result = await AuthService.signOut();

      if (result.success) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to sign out',
        }));
      }
    } catch (error) {
      console.error('Sign out error in context:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred during sign out',
      }));
    }
  }, []);

  // Request password reset
  const requestPasswordReset = useCallback(async (request: PasswordResetRequest) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.requestPasswordReset(request);

      setAuthState(prev => ({ ...prev, loading: false }));

      if (!result.success) {
        setAuthState(prev => ({ ...prev, error: result.error || null }));
      }

      return result;
    } catch (error) {
      console.error('Password reset request error in context:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred',
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Confirm password reset
  const confirmPasswordReset = useCallback(
    async (confirm: PasswordResetConfirm): Promise<AuthSuccess | AuthError> => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.confirmPasswordReset(confirm);

        setAuthState(prev => ({ ...prev, loading: false }));

        if ('code' in result) {
          setAuthState(prev => ({ ...prev, error: result.message }));
        }

        return result;
      } catch (error) {
        console.error('Password reset confirmation error in context:', error);
        const errorMessage = 'An unexpected error occurred during password reset';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Confirm password reset with OTP
  const confirmPasswordResetOtp = useCallback(
    async (confirm: PasswordResetConfirmOtp): Promise<AuthSuccess | AuthError> => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.confirmPasswordResetOtp(confirm);

        if ('code' in result) {
          // Error case
          setAuthState(prev => ({ ...prev, loading: false, error: result.message }));
          return result;
        } else {
          // Success case - Supabase automatically signs in after password reset
          setAuthState({
            user: result.user,
            session: result.session || null,
            loading: false,
            error: null,
            isAuthenticated: !!result.session,
            isInitialized: true,
          });
          return result;
        }
      } catch (error) {
        console.error('Password reset OTP confirmation error in context:', error);
        const errorMessage = 'An unexpected error occurred during password reset';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Request email verification
  const requestEmailVerification = useCallback(async (request: EmailVerificationRequest) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.requestEmailVerification(request);

      setAuthState(prev => ({ ...prev, loading: false }));

      if (!result.success) {
        setAuthState(prev => ({ ...prev, error: result.error || null }));
      }

      return result;
    } catch (error) {
      console.error('Email verification request error in context:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred',
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updates: UserProfileUpdate): Promise<AuthSuccess | AuthError> => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.updateProfile(updates);

        if ('code' in result) {
          setAuthState(prev => ({ ...prev, loading: false, error: result.message }));
          return result;
        } else {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            user: result.user,
            error: null,
          }));
          return result;
        }
      } catch (error) {
        console.error('Profile update error in context:', error);
        const errorMessage = 'An unexpected error occurred during profile update';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Change password
  const changePassword = useCallback(
    async (request: ChangePasswordRequest): Promise<AuthSuccess | AuthError> => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const result = await AuthService.changePassword(request);

        setAuthState(prev => ({ ...prev, loading: false }));

        if ('code' in result) {
          setAuthState(prev => ({ ...prev, error: result.message }));
        }

        return result;
      } catch (error) {
        console.error('Password change error in context:', error);
        const errorMessage = 'An unexpected error occurred during password change';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
        };
      }
    },
    []
  );

  // Delete account
  const deleteAccount = useCallback(async (request: DeleteAccountRequest) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.deleteAccount(request);

      if (result.success) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to delete account',
        }));
      }

      return result;
    } catch (error) {
      console.error('Account deletion error in context:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred during account deletion',
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Update onboarding data
  const updateOnboardingData = useCallback(
    async (onboardingData: OnboardingData) => {
      try {
        const result = await AuthService.updateOnboardingData(onboardingData);

        if (result.success && authState.user) {
          // Update user's onboarding status in local state
          setAuthState(prev => ({
            ...prev,
            user: prev.user
              ? {
                ...prev.user,
                preferences: {
                  ...prev.user.preferences,
                  ...onboardingData.preferences,
                },
              }
              : null,
          }));
        }

        return result;
      } catch (error) {
        console.error('Onboarding data update error in context:', error);
        return { success: false, error: 'An unexpected error occurred' };
      }
    },
    [authState.user]
  );

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        setAuthState(prev => ({ ...prev, user }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  // Check if user is verified
  const isUserVerified = useCallback(() => {
    return authState.user?.isEmailVerified || false;
  }, [authState.user]);

  const contextValue: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    requestPasswordReset,
    confirmPasswordReset,
    confirmPasswordResetOtp,
    requestEmailVerification,
    updateProfile,
    changePassword,
    deleteAccount,
    updateOnboardingData,
    clearError,
    refreshUser,
    isUserVerified,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for testing purposes
export { AuthContext };
