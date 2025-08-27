import { supabase } from './client';
import {
  SignInCredentials,
  SignUpCredentials,
  User,
  Session,
  AuthError,
  AuthSuccess,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerificationRequest,
  EmailVerificationConfirm,
  UserProfileUpdate,
  ChangePasswordRequest,
  DeleteAccountRequest,
  OnboardingData,
} from '@/types/user';

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(credentials: SignUpCredentials): Promise<AuthSuccess | AuthError> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            accept_terms: credentials.acceptTerms,
          },
        },
      });

      if (error) {
        return {
          code: error.message,
          message: this.getErrorMessage(error.message),
          field: this.getErrorField(error.message),
        };
      }

      if (!data.user) {
        return {
          code: 'SIGNUP_FAILED',
          message: 'Failed to create user account',
        };
      }

      // Create user profile in our custom users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: credentials.email,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          role: 'member',
          is_email_verified: false,
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
          onboarding_data: {
            hasCompletedOnboarding: false,
            onboardingStep: 0,
            preferences: {},
          },
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the signup if profile creation fails
        // The profile can be created later
      }

      return {
        message: 'Account created successfully. Please check your email to verify your account.',
        user: this.transformSupabaseUser(data.user),
        session: data.session ? this.transformSupabaseSession(data.session) : undefined,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during sign up',
      };
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(credentials: SignInCredentials): Promise<AuthSuccess | AuthError> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          code: error.message,
          message: this.getErrorMessage(error.message),
          field: this.getErrorField(error.message),
        };
      }

      if (!data.user || !data.session) {
        return {
          code: 'SIGNIN_FAILED',
          message: 'Failed to sign in',
        };
      }

      // Update last sign in time
      await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id);

      return {
        message: 'Signed in successfully',
        user: this.transformSupabaseUser(data.user),
        session: this.transformSupabaseSession(data.session),
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during sign in',
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'An unexpected error occurred during sign out' };
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(request: PasswordResetRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: 'tvf-app://reset-password',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Confirm password reset
   */
  static async confirmPasswordReset(confirm: PasswordResetConfirm): Promise<AuthSuccess | AuthError> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: confirm.newPassword,
      });

      if (error) {
        return {
          code: error.message,
          message: this.getErrorMessage(error.message),
        };
      }

      if (!data.user) {
        return {
          code: 'PASSWORD_RESET_FAILED',
          message: 'Failed to reset password',
        };
      }

      return {
        message: 'Password reset successfully',
        user: this.transformSupabaseUser(data.user),
        // No session after password reset
      };
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during password reset',
      };
    }
  }

  /**
   * Request email verification
   */
  static async requestEmailVerification(request: EmailVerificationRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: request.email,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Email verification request error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      return this.transformSupabaseSession(session);
    } catch (error) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return this.transformSupabaseUser(user);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: UserProfileUpdate): Promise<AuthSuccess | AuthError> {
    try {
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          avatar_url: updates.avatarUrl,
        },
      });

      if (error) {
        return {
          code: error.message,
          message: this.getErrorMessage(error.message),
        };
      }

      if (!user) {
        return {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update profile',
        };
      }

      // Update custom users table if preferences are provided
      if (updates.preferences) {
        await supabase
          .from('users')
          .update({ preferences: updates.preferences })
          .eq('id', user.id);
      }

      return {
        message: 'Profile updated successfully',
        user: this.transformSupabaseUser(user),
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during profile update',
      };
    }
  }

  /**
   * Change password
   */
  static async changePassword(request: ChangePasswordRequest): Promise<AuthSuccess | AuthError> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: request.newPassword,
      });

      if (error) {
        return {
          code: error.message,
          message: this.getErrorMessage(error.message),
        };
      }

      if (!data.user) {
        return {
          code: 'PASSWORD_CHANGE_FAILED',
          message: 'Failed to change password',
        };
      }

      return {
        message: 'Password changed successfully',
        user: this.transformSupabaseUser(data.user),
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during password change',
      };
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(request: DeleteAccountRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // First delete from custom users table
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) {
        console.error('Profile deletion error:', profileError);
      }

      // Then delete the auth user
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      return { success: false, error: 'An unexpected error occurred during account deletion' };
    }
  }

  /**
   * Update onboarding data
   */
  static async updateOnboardingData(onboardingData: OnboardingData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ onboarding_data: onboardingData })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Onboarding data update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Transform Supabase user to our User interface
   */
  private static transformSupabaseUser(supabaseUser: any): User {
    // Ensure supabaseUser is valid
    if (!supabaseUser) {
      console.error('Invalid Supabase user object:', supabaseUser);
      // Return a default user object to prevent errors
      return {
        id: '',
        email: '',
        firstName: '',
        lastName: '',
        avatarUrl: '',
        role: 'member',
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    }

    return {
      id: supabaseUser.id || '',
      email: supabaseUser.email || '',
      firstName: supabaseUser.user_metadata?.first_name || '',
      lastName: supabaseUser.user_metadata?.last_name || '',
      avatarUrl: supabaseUser.user_metadata?.avatar_url || '',
      role: 'member', // Default role, will be updated from custom table
      isEmailVerified: supabaseUser.email_confirmed_at !== null,
      lastSignInAt: supabaseUser.last_sign_in_at || '',
      createdAt: supabaseUser.created_at || new Date().toISOString(),
      updatedAt: supabaseUser.updated_at || supabaseUser.created_at || new Date().toISOString(),
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
  }

  /**
   * Transform Supabase session to our Session interface
   */
  private static transformSupabaseSession(supabaseSession: any): Session {
    // Ensure supabaseSession is valid
    if (!supabaseSession) {
      console.error('Invalid Supabase session object:', supabaseSession);
      // Return a default session object to prevent errors
      return {
        accessToken: '',
        refreshToken: '',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        user: this.transformSupabaseUser(null),
      };
    }
    
    return {
      accessToken: supabaseSession.access_token || '',
      refreshToken: supabaseSession.refresh_token || '',
      expiresAt: supabaseSession.expires_at || (Date.now() + 3600000), // 1 hour from now if missing
      user: this.transformSupabaseUser(supabaseSession.user),
    };
  }

  /**
   * Get user-friendly error messages
   */
  private static getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please verify your email address before signing in',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'Unable to validate email address': 'Please enter a valid email address',
      'Signup disabled': 'New account creation is currently disabled',
      'Too many requests': 'Too many attempts. Please try again later',
    };

    return errorMessages[errorCode] || errorCode;
  }

  /**
   * Get the field that caused the error
   */
  private static getErrorField(errorCode: string): string | undefined {
    const fieldMapping: Record<string, string> = {
      'Invalid login credentials': 'email',
      'Email not confirmed': 'email',
      'User already registered': 'email',
      'Password should be at least 6 characters': 'password',
      'Unable to validate email address': 'email',
    };

    return fieldMapping[errorCode];
  }
}
