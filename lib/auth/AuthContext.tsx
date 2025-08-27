import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
  signOut: () => Promise<void>;
  
  // Password management
  requestPasswordReset: (request: PasswordResetRequest) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (confirm: PasswordResetConfirm) => Promise<AuthSuccess | AuthError>;
  
  // Email verification
  requestEmailVerification: (request: EmailVerificationRequest) => Promise<{ success: boolean; error?: string }>;
  
  // Profile management
  updateProfile: (updates: UserProfileUpdate) => Promise<AuthSuccess | AuthError>;
  changePassword: (request: ChangePasswordRequest) => Promise<AuthSuccess | AuthError>;
  deleteAccount: (request: DeleteAccountRequest) => Promise<{ success: boolean; error?: string }>;
  
  // Onboarding
  updateOnboardingData: (onboardingData: OnboardingData) => Promise<{ success: boolean; error?: string }>;
  
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
            expiresAt: new Date(sessionData.session.expires_at).getTime(),
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
                 expiresAt: new Date(reauthResult.session.session!.expires_at).getTime(),
                 user: reauthResult.session.user!,
               };
              
              setAuthState({
                user: reauthResult.session.user,
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
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        const user = await AuthService.getCurrentUser();
        setAuthState({
          user,
          session: session ? {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at,
            user: user!,
          } : null,
          loading: false,
          error: null,
          isAuthenticated: true,
          isInitialized: true,
        });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const user = await AuthService.getCurrentUser();
        setAuthState(prev => ({
          ...prev,
          session: session ? {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at,
            user: user!,
          } : prev.session,
          user,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up method
  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<AuthSuccess | AuthError> => {
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
  }, []);

  // Sign in method
  const signIn = useCallback(async (credentials: SignInCredentials): Promise<AuthSuccess | AuthError> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await AuthService.signIn(credentials);
      
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
          isAuthenticated: true,
          isInitialized: true,
        });
        return result;
      }
    } catch (error) {
      console.error('Sign in error in context:', error);
      const errorMessage = 'An unexpected error occurred during sign in';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
      };
    }
  }, []);

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
          error: result.error || 'Failed to sign out' 
        }));
      }
    } catch (error) {
      console.error('Sign out error in context:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'An unexpected error occurred during sign out' 
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
        error: 'An unexpected error occurred' 
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Confirm password reset
  const confirmPasswordReset = useCallback(async (confirm: PasswordResetConfirm): Promise<AuthSuccess | AuthError> => {
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
  }, []);

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
        error: 'An unexpected error occurred' 
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: UserProfileUpdate): Promise<AuthSuccess | AuthError> => {
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
          error: null 
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
  }, []);

  // Change password
  const changePassword = useCallback(async (request: ChangePasswordRequest): Promise<AuthSuccess | AuthError> => {
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
  }, []);

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
          error: result.error || 'Failed to delete account' 
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Account deletion error in context:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'An unexpected error occurred during account deletion' 
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Update onboarding data
  const updateOnboardingData = useCallback(async (onboardingData: OnboardingData) => {
    try {
      const result = await AuthService.updateOnboardingData(onboardingData);
      
      if (result.success && authState.user) {
        // Update user's onboarding status in local state
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            preferences: {
              ...prev.user.preferences,
              ...onboardingData.preferences,
            },
          } : null,
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Onboarding data update error in context:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [authState.user]);

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
    signOut,
    requestPasswordReset,
    confirmPasswordReset,
    requestEmailVerification,
    updateProfile,
    changePassword,
    deleteAccount,
    updateOnboardingData,
    clearError,
    refreshUser,
    isUserVerified,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
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
