import { Platform } from 'react-native';
import Constants from 'expo-constants';
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
  PasswordResetConfirmOtp,
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

      // Note: User profile in public.users is automatically created by the
      // handle_new_user() database trigger on auth.users INSERT.
      // Wait briefly for the trigger to complete, then update additional fields.
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update the profile with additional fields that the trigger doesn't set
      const { error: profileError } = await supabase
        .from('users')
        .update({
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
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail the signup if profile update fails
        // The profile fields can be set later
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

      // Fetch complete user data including role from custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Failed to fetch user data:', userError);
        // Fallback to basic user data if custom table query fails
        return {
          message: 'Signed in successfully',
          user: this.transformSupabaseUser(data.user),
          session: this.transformSupabaseSession(data.session),
        };
      }

      // Update last sign in time
      await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // Transform user with complete data including role
      const completeUser = this.transformSupabaseUserWithCustomData(data.user, userData);

      return {
        message: 'Signed in successfully',
        user: completeUser,
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
  static async requestPasswordReset(
    request: PasswordResetRequest
  ): Promise<{ success: boolean; error?: string }> {
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
  static async confirmPasswordReset(
    confirm: PasswordResetConfirm
  ): Promise<AuthSuccess | AuthError> {
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
   * Confirm password reset with OTP
   */
  static async confirmPasswordResetOtp(
    confirm: PasswordResetConfirmOtp
  ): Promise<AuthSuccess | AuthError> {
    try {
      // 1. Verify the OTP
      const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        email: confirm.email,
        token: confirm.token,
        type: 'recovery',
      });

      if (verifyError) {
        return {
          code: verifyError.message,
          message: this.getErrorMessage(verifyError.message),
        };
      }

      if (!sessionData.session || !sessionData.user) {
        return {
          code: 'OTP_VERIFICATION_FAILED',
          message: 'Failed to verify code',
        };
      }

      // 2. Update the password
      const { data, error } = await supabase.auth.updateUser({
        password: confirm.newPassword,
      });

      if (error) {
        return {
          code: error.message,
          message: this.getErrorMessage(error.message),
        };
      }

      return {
        message: 'Password reset successfully',
        user: this.transformSupabaseUser(data.user || sessionData.user),
        session: this.transformSupabaseSession(sessionData.session),
      };
    } catch (error) {
      console.error('Password reset OTP confirmation error:', error);
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during password reset',
      };
    }
  }

  /**
   * Request email verification
   */
  static async requestEmailVerification(
    request: EmailVerificationRequest
  ): Promise<{ success: boolean; error?: string }> {
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
   * Verify email with token from confirmation link
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Supabase handles email verification automatically when the user clicks the link
      // The token is processed via the redirect URL. We need to check if the session
      // has been updated with email_confirmed_at.

      // First, try to get the current session to see if verification happened
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        return { success: false, error: sessionError.message };
      }

      // If we have a session, check if email is verified
      if (session?.user) {
        // Refresh the user to get latest verification status
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          return { success: false, error: userError.message };
        }

        if (user?.email_confirmed_at) {
          return { success: true };
        }
      }

      // If no session or not verified, the token might need to be processed differently
      // For Supabase, email verification links typically redirect with a hash that
      // Supabase processes automatically. If we're here, verification may have failed.
      return { success: false, error: 'Email verification failed. Please try requesting a new verification email.' };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'An unexpected error occurred during email verification' };
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      // Fetch complete user data including role from custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Failed to fetch user data:', userError);
        // Fallback to basic user data if custom table query fails
        return this.transformSupabaseUser(user);
      }

      // Transform user with complete data including role
      return this.transformSupabaseUserWithCustomData(user, userData);
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
      const {
        data: { user },
        error,
      } = await supabase.auth.updateUser({
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
        await supabase.from('users').update({ preferences: updates.preferences }).eq('id', user.id);
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
  static async deleteAccount(
    request: DeleteAccountRequest
  ): Promise<{ success: boolean; error?: string }> {
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
  static async updateOnboardingData(
    onboardingData: OnboardingData
  ): Promise<{ success: boolean; error?: string }> {
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
   * Sign in with Google using native Google Sign-In
   * This method uses @react-native-google-signin/google-signin for native authentication
   * and then authenticates with Supabase using signInWithIdToken
   */
  static async signInWithGoogle(): Promise<AuthSuccess | AuthError> {
    try {
      // Check if we're in a web environment
      if (Platform.OS === 'web') {
        return {
          code: 'NOT_SUPPORTED',
          message: 'Google Sign-In is not supported on web. Please use the mobile app.',
        };
      }

      // Import GoogleSignin dynamically to avoid issues if not installed
      let GoogleSignin;
      try {
        const googleSignInModule = require('@react-native-google-signin/google-signin');
        GoogleSignin = googleSignInModule.GoogleSignin;

        // Check if GoogleSignin is actually available (not undefined)
        if (!GoogleSignin) {
          throw new Error('GoogleSignin module not available');
        }
      } catch (moduleError: any) {
        console.error('Failed to load Google Sign-In module:', moduleError);
        return {
          code: 'MODULE_NOT_AVAILABLE',
          message: 'Google Sign-In native module is not available. Please rebuild the app using "npx expo run:android" or "npx expo run:ios" after installing the package. Google Sign-In requires a development build and cannot run in Expo Go.',
        };
      }

      // Get Google Client ID from environment
      const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      }

      // Extract iOS Client ID from iosUrlScheme if on iOS
      // iosUrlScheme format: com.googleusercontent.apps.XXXXX-XXXXX
      // iOS Client ID format: XXXXX-XXXXX.apps.googleusercontent.com
      let iosClientId: string | undefined;
      if (Platform.OS === 'ios') {
        // Try to get from Constants first, fallback to known value from app.config.ts
        const iosUrlScheme =
          Constants.expoConfig?.plugins?.find(
            (plugin: any) => Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin'
          )?.[1]?.iosUrlScheme ||
          'com.googleusercontent.apps.611655344607-brc26j79oqujh50g9q1fejeomu9uurf1';

        // Extract the client ID part from the reversed format
        // com.googleusercontent.apps.611655344607-xxxxx -> 611655344607-xxxxx.apps.googleusercontent.com
        const match = iosUrlScheme.match(/com\.googleusercontent\.apps\.(.+)/);
        if (match && match[1]) {
          iosClientId = `${match[1]}.apps.googleusercontent.com`;
        }
      }

      // Configure Google Sign-In
      // For iOS, we need both webClientId (for backend) and iosClientId (for native)
      // For Android, we only need webClientId
      const config: any = {
        webClientId: googleClientId,
      };

      if (Platform.OS === 'ios' && iosClientId) {
        config.iosClientId = iosClientId;
      }

      GoogleSignin.configure(config);

      console.log('Starting native Google Sign-In');

      // Check if Google Play Services are available (Android only)
      // This will throw an error on iOS, so we handle it gracefully
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (playServicesError: any) {
        // On iOS, hasPlayServices is not needed, continue with sign-in
        if (playServicesError.code !== 'PLAY_SERVICES_NOT_AVAILABLE') {
          console.log('Google Play Services check skipped (iOS or unavailable)');
        }
      }

      // Sign in with Google
      let userInfo;
      try {
        userInfo = await GoogleSignin.signIn();
      } catch (signInError: any) {
        // If signIn throws an error, check if it's a cancellation
        if (
          signInError.code === 'SIGN_IN_CANCELLED' ||
          signInError.code === '10' || // Android cancellation code
          signInError.code === '-5' || // iOS cancellation code
          signInError.message?.toLowerCase().includes('cancelled') ||
          signInError.message?.toLowerCase().includes('canceled')
        ) {
          return {
            code: 'USER_CANCELLED',
            message: 'Google sign-in was cancelled',
          };
        }
        // Re-throw if it's not a cancellation
        throw signInError;
      }

      // Check if user cancelled the sign-in
      // When cancelled, userInfo might be null, undefined, or missing data/idToken
      if (!userInfo) {
        return {
          code: 'USER_CANCELLED',
          message: 'Google sign-in was cancelled',
        };
      }

      // Check if data is missing or null
      if (!userInfo.data) {
        return {
          code: 'USER_CANCELLED',
          message: 'Google sign-in was cancelled',
        };
      }

      // Check if idToken is missing (most common cancellation indicator)
      if (!userInfo.data.idToken) {
        // If idToken is missing, assume it was cancelled (user didn't complete sign-in)
        return {
          code: 'USER_CANCELLED',
          message: 'Google sign-in was cancelled',
        };
      }

      console.log('Google Sign-In successful, authenticating with Supabase...');

      // Authenticate with Supabase using the ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });

      if (error) {
        console.error('Supabase authentication error:', error);
        return {
          code: error.message,
          message: this.getGoogleErrorMessage(error.message),
        };
      }

      if (!data.session || !data.user) {
        return {
          code: 'GOOGLE_AUTH_FAILED',
          message: 'Failed to create session with Supabase',
        };
      }

      // Handle Google profile creation/update
      if (data.user.app_metadata?.provider === 'google') {
        await this.createOrUpdateGoogleProfile(data.user);
      }

      console.log('Google Sign-In completed successfully');

      return {
        message: 'Signed in with Google successfully',
        user: this.transformSupabaseUser(data.user),
        session: this.transformSupabaseSession(data.session),
      };
    } catch (error: any) {
      console.error('Sign in with Google error:', error);

      // Handle cancellation errors first (user cancelled the sign-in)
      // This should be checked before other errors
      if (
        error.code === 'SIGN_IN_CANCELLED' ||
        error.code === '10' || // Android cancellation code
        error.code === '-5' || // iOS cancellation code
        error.message?.toLowerCase().includes('cancelled') ||
        error.message?.toLowerCase().includes('canceled') ||
        error.message?.toLowerCase().includes('user cancelled') ||
        error.message?.toLowerCase().includes('user canceled')
      ) {
        return {
          code: 'USER_CANCELLED',
          message: 'Google sign-in was cancelled',
        };
      }

      // Handle module not found errors
      if (
        error.message?.includes('RNGoogleSignin') ||
        error.message?.includes('could not be found') ||
        error.message?.includes('Cannot read property') ||
        error.message?.includes('GoogleSignin') && error.message?.includes('undefined')
      ) {
        return {
          code: 'MODULE_NOT_AVAILABLE',
          message: 'Google Sign-In native module is not available. Please rebuild the app using "npx expo run:android" or "npx expo run:ios". Google Sign-In requires a development build and cannot run in Expo Go.',
        };
      }

      if (error.code === 'IN_PROGRESS') {
        return {
          code: 'IN_PROGRESS',
          message: 'Google sign-in is already in progress',
        };
      }

      if (error.code === 'SIGN_IN_REQUIRED') {
        return {
          code: 'SIGN_IN_REQUIRED',
          message: 'Google sign-in is required',
        };
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred during Google authentication',
      };
    }
  }

  /**
   * Handle Google profile data from OAuth response
   */
  static handleGoogleProfileData(supabaseUser: any): {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    emailVerified: boolean;
  } {
    const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';
    const email = supabaseUser.email || '';
    const avatarUrl = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '';

    // Split full name into first and last name
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      firstName,
      lastName,
      avatarUrl,
      emailVerified: supabaseUser.email_confirmed_at !== null || supabaseUser.user_metadata?.email_verified === true,
    };
  }

  /**
   * Create or update user profile for Google-authenticated users
   */
  static async createOrUpdateGoogleProfile(user: any): Promise<void> {
    try {
      const profileData = this.handleGoogleProfileData(user);

      // Note: The handle_new_user() trigger already created the basic profile.
      // We just need to update it with Google-specific data.
      // Wait briefly to ensure the trigger has completed.
      await new Promise(resolve => setTimeout(resolve, 200));

      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          avatar_url: profileData.avatarUrl,
          is_email_verified: profileData.emailVerified,
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
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
      }
    } catch (error) {
      console.error('Error updating Google profile:', error);
    }
  }

  /**
   * Get Google-specific error message
   */
  private static getGoogleErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'Google OAuth error': 'Failed to connect with Google. Please try again.',
      'User cancelled': 'Google sign-in was cancelled. Please try again.',
      'Network error': 'Network error during Google sign-in. Please check your connection.',
      'Invalid credentials': 'Invalid Google credentials. Please try again.',
      'Account not found': 'Google account not found. Please sign up first.',
    };

    return errorMessages[errorCode] || 'An error occurred during Google sign-in. Please try again.';
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

  private static transformSupabaseUserWithCustomData(supabaseUser: any, customUserData: any): User {
    // Ensure supabaseUser is valid
    if (!supabaseUser) {
      console.error('Invalid Supabase user object:', supabaseUser);
      return this.transformSupabaseUser(supabaseUser);
    }

    // Use custom user data if available, otherwise fall back to Supabase user data
    const firstName = customUserData?.first_name || supabaseUser.user_metadata?.first_name || '';
    const lastName = customUserData?.last_name || supabaseUser.user_metadata?.last_name || '';
    const avatarUrl = customUserData?.avatar_url || supabaseUser.user_metadata?.avatar_url || '';
    const role = customUserData?.role || 'member';
    const preferences = customUserData?.preferences || {
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
    };

    return {
      id: supabaseUser.id || '',
      email: supabaseUser.email || '',
      firstName,
      lastName,
      avatarUrl,
      role,
      isEmailVerified: supabaseUser.email_confirmed_at !== null,
      lastSignInAt: customUserData?.last_sign_in_at || supabaseUser.last_sign_in_at || '',
      createdAt: customUserData?.created_at || supabaseUser.created_at || new Date().toISOString(),
      updatedAt: customUserData?.updated_at || supabaseUser.updated_at || supabaseUser.created_at || new Date().toISOString(),
      preferences,
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
      expiresAt: supabaseSession.expires_at || Date.now() + 3600000, // 1 hour from now if missing
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
